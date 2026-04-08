import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope } from "./types";

/** GET /llm/settings/global 返回的完成度（字段名以后端为准） */
export type GlobalLlmCompletion = Record<string, boolean | undefined>;

export type GlobalLlmSettings = {
  chat_vendor_id?: number | string | null;
  chat_model?: string | null;
  embedding_vendor_id?: number | string | null;
  embedding_model?: string | null;
  multimodal_vendor_id?: number | string | null;
  multimodal_model?: string | null;
  rerank_vendor_id?: number | string | null;
  rerank_model?: string | null;
  asr_vendor_id?: number | string | null;
  asr_model?: string | null;
  tts_vendor_id?: number | string | null;
  tts_model?: string | null;
  completion?: GlobalLlmCompletion;
  is_complete?: boolean;
};

/** GET /llm/settings/available-models 单条模型（不传 capability 时列表中每条带 capability） */
export type AvailableModelEntry = {
  vendor_id: number | string;
  vendor_code?: string;
  vendor_name: string;
  model_id: string;
  model_name?: string;
  capability: string;
  logo_url?: string | null;
};

export type PatchGlobalLlmSettingsBody = Partial<{
  chat_vendor_id: number | string | null;
  chat_model: string | null;
  embedding_vendor_id: number | string | null;
  embedding_model: string | null;
  multimodal_vendor_id: number | string | null;
  multimodal_model: string | null;
  rerank_vendor_id: number | string | null;
  rerank_model: string | null;
  asr_vendor_id: number | string | null;
  asr_model: string | null;
  tts_vendor_id: number | string | null;
  tts_model: string | null;
}>;

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

/** 获取当前用户全局默认模型配置与完成度 */
export async function getGlobalLlmSettings(): Promise<GlobalLlmSettings> {
  let envelope: ApiEnvelope<GlobalLlmSettings>;
  try {
    envelope = await authApi.get<ApiEnvelope<GlobalLlmSettings>>("llm/settings/global");
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "获取全局模型设置失败");
  }
  return envelope.data ?? {};
}

/** 更新全局默认模型（字段均可选；清空时可传 null） */
export async function patchGlobalLlmSettings(
  body: PatchGlobalLlmSettingsBody
): Promise<GlobalLlmSettings> {
  let envelope: ApiEnvelope<GlobalLlmSettings>;
  try {
    envelope = await authApi.patch<ApiEnvelope<GlobalLlmSettings>>("llm/settings/global", {
      json: body,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "更新全局模型设置失败");
  }
  return envelope.data ?? {};
}

/**
 * 当前用户已安装且模板必填已齐的厂商，在各能力下的可选模型。
 * GET /llm/settings/available-models
 * @param capability 可选，按能力筛选（大小写不敏感）：LLM / Embedding / Rerank / VLM / ASR / TTS / Moderation
 */
export async function getAvailableSettingsModels(
  capability?: string
): Promise<AvailableModelEntry[]> {
  const params = new URLSearchParams();
  if (capability?.trim()) {
    params.set("capability", capability.trim());
  }
  const qs = params.toString();
  const url = qs
    ? `llm/settings/available-models?${qs}`
    : "llm/settings/available-models";

  let envelope: ApiEnvelope<AvailableModelEntry[]>;
  try {
    envelope = await authApi.get<ApiEnvelope<AvailableModelEntry[]>>(url);
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询可选模型失败");
  }
  return envelope.data ?? [];
}
