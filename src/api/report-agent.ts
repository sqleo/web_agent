import { HTTPError } from "@/https";
import { getReportGenerateUrl } from "@/lib/agent-chat-url";
import { iterateSseBlocks } from "@/lib/report-sse";
import { authApi } from "./client";
import { getAuthorizationHeaderValue } from "./auth-storage";
import type { ApiEnvelope } from "./types";

export type ReportTaskStatus = "running" | "interrupted" | "completed" | "not_found";
export type ReportResumeAction = "confirm" | "revise" | "replan";
export type ReportRollbackTargetNode = "intent" | "researcher" | "outliner" | "planner" | "writer";

export type ReportTaskSnapshot = {
  thread_id: string;
  status: ReportTaskStatus;
  current_node?: string | string[] | null;
  interrupt_payload?: unknown;
  result?: unknown;
  state?: unknown;
};

export type CreateReportTaskBody = {
  user_query: string;
  thread_id?: string;
};

export type ResumeReportTaskBody = {
  thread_id: string;
  action: ReportResumeAction;
  updates?: {
    outline?: string[];
  };
};

export type RollbackReportTaskResult = {
  thread_id: string;
  rollback_to: ReportRollbackTargetNode;
  status: string;
};

/** 报告节点类型 */
export type ReportNodeType = "intent" | "planner" | "researcher" | "outliner" | "human_review" | "writer";

/** `POST /report/generate` SSE 事件（与后端约定 v1 版本） */
export type ReportGenerateSseEvent =
  | { kind: "start"; thread_id: string; raw: unknown }
  | { kind: "node_start"; node: ReportNodeType; raw: unknown }
  | { kind: "node_end"; node: ReportNodeType; output: unknown; raw: unknown }
  | { kind: "message"; content: string; raw: unknown }
  | { kind: "tool_start"; tool: string; input: unknown; raw: unknown }
  | { kind: "tool_end"; tool: string; output: unknown; raw: unknown }
  | { kind: "interrupted"; thread_id: string; node: ReportNodeType; message: string; data: unknown; options: string[]; raw: unknown }
  | { kind: "done"; thread_id: string; raw: unknown }
  | { kind: "error"; message: string; raw: unknown }
  | { kind: "raw"; event: string; data: string };

async function toReadableMessage(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.json()) as Partial<ApiEnvelope<unknown>> & {
        message?: string;
      };
      return body.message ?? `请求失败（${error.response.status}）`;
    } catch {
      return `请求失败（${error.response.status}）`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}

/**
 * 解析单条 SSE 的 `event` + `data`（data 多为 JSON）。
 */
export function parseReportGenerateSseEvent(eventName: string, data: string): ReportGenerateSseEvent | null {
  const name = eventName.trim().toLowerCase();
  let json: unknown = null;
  const trimmed = data.trim();
  if (trimmed) {
    try {
      json = JSON.parse(trimmed) as unknown;
    } catch {
      json = trimmed;
    }
  }

  switch (name) {
    case "thread_id": {
      const o = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const tid =
        typeof o?.thread_id === "string"
          ? o.thread_id
          : typeof json === "string"
            ? json
            : null;
      if (!tid) {
        return null;
      }
      return { kind: "thread_id", thread_id: tid, raw: json };
    }
    case "node_complete":
      return { kind: "node_complete", raw: json };
    case "interrupted":
      return { kind: "interrupted", raw: json };
    case "completed":
      return { kind: "completed", raw: json };
    case "error": {
      const o = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const msg =
        typeof o?.message === "string"
          ? o.message
          : typeof json === "string"
            ? json
            : "未知错误";
      return { kind: "error", message: msg, raw: json };
    }
    default:
      return null;
  }
}

/**
 * `POST /report/generate`，响应为 `text/event-stream`（全流式，非 JSON 信封）。
 */
export async function fetchReportGenerate(
  body: CreateReportTaskBody,
  signal?: AbortSignal
): Promise<Response> {
  const auth = getAuthorizationHeaderValue();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (auth) {
    headers.Authorization = auth;
  }
  return fetch(getReportGenerateUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
}

/**
 * 消费 `POST /report/generate` 的 SSE，产出结构化事件。
 */
export async function* iterateReportGenerate(
  body: CreateReportTaskBody,
  signal?: AbortSignal
): AsyncGenerator<ReportGenerateSseEvent, void, undefined> {
  const res = await fetchReportGenerate(body, signal);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 480) || `报告生成请求失败（${res.status}）`);
  }
  for await (const { event, data } of iterateSseBlocks(res)) {
    const parsed = parseReportGenerateSseEvent(event, data);
    if (parsed) {
      yield parsed;
      continue;
    }
    if (data.trim()) {
      yield { kind: "raw", event, data };
    }
  }
}

export async function resumeReportTask(body: ResumeReportTaskBody): Promise<ReportTaskSnapshot> {
  let envelope: ApiEnvelope<ReportTaskSnapshot>;
  try {
    envelope = await authApi.post<ApiEnvelope<ReportTaskSnapshot>>("report/resume", {
      json: body,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "恢复报告任务失败");
  }
  if (!envelope.data) {
    throw new Error("恢复报告任务失败：响应数据为空");
  }
  return envelope.data;
}

export async function getReportTaskStatus(threadId: string): Promise<ReportTaskSnapshot> {
  let envelope: ApiEnvelope<ReportTaskSnapshot>;
  try {
    envelope = await authApi.get<ApiEnvelope<ReportTaskSnapshot>>(
      `report/status/${encodeURIComponent(threadId)}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询报告状态失败");
  }
  if (!envelope.data) {
    throw new Error("查询报告状态失败：响应数据为空");
  }
  return envelope.data;
}

export async function rollbackReportTask(
  threadId: string,
  targetNode: ReportRollbackTargetNode
): Promise<RollbackReportTaskResult> {
  let envelope: ApiEnvelope<RollbackReportTaskResult>;
  try {
    envelope = await authApi.post<ApiEnvelope<RollbackReportTaskResult>>(
      `report/rollback/${encodeURIComponent(threadId)}/${encodeURIComponent(targetNode)}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "回滚报告任务失败");
  }
  if (!envelope.data) {
    throw new Error("回滚报告任务失败：响应数据为空");
  }
  return envelope.data;
}

export async function openReportTaskStream(threadId: string): Promise<Response> {
  try {
    return await authApi.stream("GET", `report/stream/${encodeURIComponent(threadId)}`, {
      headers: { Accept: "text/event-stream" },
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
}
