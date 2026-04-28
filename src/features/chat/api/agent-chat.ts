import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";
import type {
  DeleteAgentChatThreadVariant,
  DeleteChatThreadData,
  PauseAgentChatData,
  ResumeAgentChatBody,
  ResumeAgentChatData,
  AgentChatHistoryData,
  TravelAgentChatBody,
  TravelAgentChatData,
} from "../types";

async function unwrap<T>(promise: Promise<ApiEnvelope<T>>, fallbackMsg: string): Promise<T> {
  try {
    const envelope = await promise;
    if (envelope.code !== 0) {
      throw new Error(envelope.message || fallbackMsg);
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(fallbackMsg);
  }
}

export async function deleteAgentChatThread(
  threadId: string,
  variant: DeleteAgentChatThreadVariant = "default"
): Promise<DeleteChatThreadData> {
  const path =
    variant === "graph-service"
      ? `agent/graph-service/chat/${encodeURIComponent(threadId)}`
      : `agent/chat/${encodeURIComponent(threadId)}`;

  return unwrap(
    http.delete(path).json<ApiEnvelope<DeleteChatThreadData>>(),
    "删除对话失败"
  );
}

export async function pauseAgentChat(
  threadId: string,
  body?: { reason?: string }
): Promise<PauseAgentChatData> {
  return unwrap(
    http
      .post(`agent/chat/${encodeURIComponent(threadId)}/pause`, {
        json: body ?? {},
      })
      .json<ApiEnvelope<PauseAgentChatData>>(),
    "暂停生成失败"
  );
}

export async function resumeAgentChat(
  threadId: string,
  body?: ResumeAgentChatBody
): Promise<ResumeAgentChatData> {
  return unwrap(
    http
      .post(`agent/chat/${encodeURIComponent(threadId)}/resume`, {
        json: body ?? {},
      })
      .json<ApiEnvelope<ResumeAgentChatData>>(),
    "继续生成失败"
  );
}

export async function getAgentChatHistory(threadId: string): Promise<AgentChatHistoryData> {
  return unwrap(
    http.get(`agent/chat/${encodeURIComponent(threadId)}/history`).json<ApiEnvelope<AgentChatHistoryData>>(),
    "获取 checkpoint 历史失败"
  );
}

export async function travelAgentChat(
  threadId: string,
  body: TravelAgentChatBody
): Promise<TravelAgentChatData> {
  return unwrap(
    http
      .post(`agent/chat/${encodeURIComponent(threadId)}/travel`, {
        json: body,
      })
      .json<ApiEnvelope<TravelAgentChatData>>(),
    "时间旅行失败"
  );
}
