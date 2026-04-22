import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope } from "./types";

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

/** 同步接口 `POST /agent/graph-service/chat` 返回结构 */
export type GraphServiceChatResponse = {
  reply: string;
  thread_id: string;
};

export type PostGraphServiceChatBody = {
  message: string;
  /** 首轮可不传 */
  thread_id?: string | null;
};

/**
 * 智能 Graph 同步对话。
 * POST /agent/graph-service/chat
 *
 * 后端 `assistant_id` 固定为 `graph_service`；不暴露 `enabled_tools`（不经路由工具开关）。
 */
export async function postGraphServiceChat(
  body: PostGraphServiceChatBody
): Promise<GraphServiceChatResponse> {
  let envelope: ApiEnvelope<GraphServiceChatResponse>;
  try {
    envelope = await authApi.post<ApiEnvelope<GraphServiceChatResponse>>(
      "agent/graph-service/chat",
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "对话失败");
  }
  if (!envelope.data) {
    throw new Error("对话失败：响应数据为空");
  }
  return envelope.data;
}
