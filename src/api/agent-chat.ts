import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope } from "./types";

export type DeleteChatThreadData = {
  thread_id: string;
  message: string;
};

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
 * 删除 LangGraph 对话线程。
 * DELETE /agent/chat/{thread_id}
 */
export async function deleteAgentChatThread(threadId: string): Promise<DeleteChatThreadData> {
  let envelope: ApiEnvelope<DeleteChatThreadData>;
  try {
    envelope = await authApi.del<ApiEnvelope<DeleteChatThreadData>>(
      `agent/chat/${encodeURIComponent(threadId)}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "删除对话失败");
  }
  if (!envelope.data) {
    throw new Error("删除对话失败：响应数据为空");
  }
  return envelope.data;
}

export type PauseAgentChatData = {
  thread_id: string;
  status: string;
  checkpoint_id: string | null;
  message: string;
};

/**
 * 暂停生成。
 * POST /agent/chat/{thread_id}/pause
 */
export async function pauseAgentChat(
  threadId: string,
  body?: { reason?: string }
): Promise<PauseAgentChatData> {
  let envelope: ApiEnvelope<PauseAgentChatData>;
  try {
    envelope = await authApi.post<ApiEnvelope<PauseAgentChatData>>(
      `agent/chat/${encodeURIComponent(threadId)}/pause`,
      { json: body ?? {} }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "暂停生成失败");
  }
  if (!envelope.data) {
    throw new Error("暂停生成失败：响应数据为空");
  }
  return envelope.data;
}

export type ResumeAgentChatBody = {
  resume_value?: { action?: string; [k: string]: unknown };
};

export type ResumeAgentChatData = {
  thread_id: string;
  status: string;
  message: string;
};

/**
 * 继续生成（从中断点恢复）。
 * POST /agent/chat/{thread_id}/resume
 */
export async function resumeAgentChat(
  threadId: string,
  body?: ResumeAgentChatBody
): Promise<ResumeAgentChatData> {
  let envelope: ApiEnvelope<ResumeAgentChatData>;
  try {
    envelope = await authApi.post<ApiEnvelope<ResumeAgentChatData>>(
      `agent/chat/${encodeURIComponent(threadId)}/resume`,
      { json: body ?? {} }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "继续生成失败");
  }
  if (!envelope.data) {
    throw new Error("继续生成失败：响应数据为空");
  }
  return envelope.data;
}

export type ChatCheckpointItem = {
  checkpoint_id: string;
  timestamp: string;
  content_preview: string;
  node: string;
  metadata?: Record<string, unknown>;
};

export type AgentChatHistoryData = {
  thread_id: string;
  total: number;
  checkpoints: ChatCheckpointItem[];
};

/**
 * 获取历史 checkpoint（时间旅行）。
 * GET /agent/chat/{thread_id}/history
 */
export async function getAgentChatHistory(threadId: string): Promise<AgentChatHistoryData> {
  let envelope: ApiEnvelope<AgentChatHistoryData>;
  try {
    envelope = await authApi.get<ApiEnvelope<AgentChatHistoryData>>(
      `agent/chat/${encodeURIComponent(threadId)}/history`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "获取 checkpoint 历史失败");
  }
  if (!envelope.data) {
    throw new Error("获取 checkpoint 历史失败：响应数据为空");
  }
  return envelope.data;
}

export type TravelAgentChatBody = {
  checkpoint_id: string;
  mode: "fork" | "replay";
  new_input?: string;
};

export type TravelAgentChatData = {
  thread_id: string;
  new_thread_id?: string;
  checkpoint_id: string;
  mode: string;
  message: string;
};

/**
 * 时间旅行（fork 推荐：会返回新 thread_id）。
 * POST /agent/chat/{thread_id}/travel
 */
export async function travelAgentChat(
  threadId: string,
  body: TravelAgentChatBody
): Promise<TravelAgentChatData> {
  let envelope: ApiEnvelope<TravelAgentChatData>;
  try {
    envelope = await authApi.post<ApiEnvelope<TravelAgentChatData>>(
      `agent/chat/${encodeURIComponent(threadId)}/travel`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "时间旅行失败");
  }
  if (!envelope.data) {
    throw new Error("时间旅行失败：响应数据为空");
  }
  return envelope.data;
}
