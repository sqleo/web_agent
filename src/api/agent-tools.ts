import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope } from "./types";

/** GET /agent/tools 单条工具 */
export type AgentToolRow = {
  /** 工具名（与保存时的 enabled_tools 一致） */
  name?: string;
  tool_name?: string;
  /** 当前是否启用（与用户保存的偏好一致） */
  enabled: boolean;
  description?: string;
  [key: string]: unknown;
};

export type AgentToolsSettingsBody = {
  /** 当前用户启用的工具名列表；`null` 删除已保存偏好、恢复默认全开；`[]` 全部禁用 */
  enabled_tools: string[] | null;
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

async function unwrap<T>(promise: Promise<ApiEnvelope<T>>, fallbackMsg: string): Promise<T> {
  let envelope: ApiEnvelope<T>;
  try {
    envelope = await promise;
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || fallbackMsg);
  }
  return envelope.data as T;
}

/**
 * 全部注册工具及每项是否启用（未保存偏好时后端一般为全开）。
 * GET /agent/tools
 */
export async function getAgentTools(): Promise<AgentToolRow[]> {
  const d = await unwrap(authApi.get<ApiEnvelope<AgentToolRow[]>>("agent/tools"), "获取工具列表失败");
  return Array.isArray(d) ? d : [];
}

/**
 * 保存用户级工具开关。
 * PUT /agent/tools/settings
 */
export async function putAgentToolsSettings(body: AgentToolsSettingsBody): Promise<void> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.put<ApiEnvelope<unknown>>("agent/tools/settings", {
      json: body,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "保存工具设置失败");
  }
}
