import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";

export type AgentToolRow = {
  name?: string;
  tool_name?: string;
  enabled: boolean;
  description?: string;
  [key: string]: unknown;
};

export type AgentToolsSettingsBody = {
  enabled_tools: string[] | null;
};

export async function getAgentTools(): Promise<AgentToolRow[]> {
  try {
    const envelope = await http
      .get("agent/tools")
      .json<ApiEnvelope<AgentToolRow[]>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "获取工具列表失败");
    }
    return envelope.data ?? [];
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("获取工具列表失败");
  }
}

export async function putAgentToolsSettings(body: AgentToolsSettingsBody): Promise<void> {
  try {
    const envelope = await http
      .put("agent/tools/settings", {
        json: body,
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "保存工具设置失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("保存工具设置失败");
  }
}
