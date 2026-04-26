"use client";

import { getAuthorizationHeaderValue } from "@/api/auth-storage";
import { API_VERSION, getApiVersionedBase } from "@/lib/api-base";

export type ReportGenerateBody = {
  user_query: string;
  thread_id?: string;
};

export type ReportResumeAction = "confirm" | "revise";

export type ReportResumeBody = {
  thread_id: string;
  action: ReportResumeAction;
  updates?: { outline?: unknown[] };
  metadata?: { node_name?: string };
};

export type ReportRuntimeStatus = "running" | "interrupted" | "completed";

export type ReportStatusResponse = {
  status: ReportRuntimeStatus;
  current_node?: string;
  state?: Record<string, unknown>;
};

function buildApiUrl(path: string): string {
  const base = getApiVersionedBase();
  if (base) {
    return `${base}${path}`;
  }
  return `/${API_VERSION}${path}`;
}

function ensureAuthHeader(): string {
  const value = getAuthorizationHeaderValue();
  if (!value) {
    throw new Error("请先登录");
  }
  return value;
}

async function parseMaybeEnvelope<T>(res: Response): Promise<T> {
  const data = (await res.json()) as
    | T
    | {
        code?: number;
        message?: string;
        data?: T;
      };
  if (typeof data === "object" && data !== null && "code" in data) {
    const code = data.code ?? -1;
    if (code !== 0) {
      throw new Error(data.message || "请求失败");
    }
    if (!("data" in data)) {
      throw new Error("请求失败：响应数据为空");
    }
    return data.data as T;
  }
  return data as T;
}

export async function createReportGenerateStream(
  body: ReportGenerateBody,
  signal?: AbortSignal
): Promise<Response> {
  const auth = ensureAuthHeader();
  const res = await fetch(buildApiUrl("/report/generate"), {
    method: "POST",
    headers: {
      Authorization: auth,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 280) || `请求失败（${res.status}）`);
  }
  return res;
}

export async function createReportResumeStream(
  body: ReportResumeBody,
  signal?: AbortSignal
): Promise<Response> {
  const auth = ensureAuthHeader();
  const res = await fetch(buildApiUrl("/report/resume"), {
    method: "POST",
    headers: {
      Authorization: auth,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 280) || `请求失败（${res.status}）`);
  }
  return res;
}

export async function getReportStatus(threadId: string): Promise<ReportStatusResponse> {
  const auth = ensureAuthHeader();
  const res = await fetch(
    buildApiUrl(`/report/status/${encodeURIComponent(threadId)}`),
    {
      method: "GET",
      headers: { Authorization: auth },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 280) || `请求失败（${res.status}）`);
  }
  return parseMaybeEnvelope<ReportStatusResponse>(res);
}

export async function rollbackReportToNode(
  threadId: string,
  targetNode: string
): Promise<{ message?: string }> {
  const auth = ensureAuthHeader();
  const res = await fetch(
    buildApiUrl(
      `/report/rollback/${encodeURIComponent(threadId)}/${encodeURIComponent(targetNode)}`
    ),
    {
      method: "POST",
      headers: { Authorization: auth },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 280) || `请求失败（${res.status}）`);
  }
  return parseMaybeEnvelope<{ message?: string }>(res);
}
