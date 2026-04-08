import type { GlobalLlmSettings, PatchGlobalLlmSettingsBody } from "@/api/llm-settings";

/** 页面行 key → PATCH 字段名 */
export const ROW_KEY_TO_GLOBAL = {
  llm: { vendor: "chat_vendor_id", model: "chat_model" },
  embedding: { vendor: "embedding_vendor_id", model: "embedding_model" },
  vlm: { vendor: "multimodal_vendor_id", model: "multimodal_model" },
  rerank: { vendor: "rerank_vendor_id", model: "rerank_model" },
  asr: { vendor: "asr_vendor_id", model: "asr_model" },
  tts: { vendor: "tts_vendor_id", model: "tts_model" },
} as const;

export type DefaultModelRowKey = keyof typeof ROW_KEY_TO_GLOBAL;

function parseVendorIdSegment(raw: string): number | string {
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  return raw;
}

/** 从全局设置拼 Select 的 value：`vendor_id::model_id` */
export function rowValueFromGlobal(
  settings: GlobalLlmSettings | null | undefined,
  rowKey: string
): string | undefined {
  if (!settings) {
    return undefined;
  }
  const e = ROW_KEY_TO_GLOBAL[rowKey as DefaultModelRowKey];
  if (!e) {
    return undefined;
  }
  const rec = settings as Record<string, unknown>;
  const vid = rec[e.vendor];
  const model = rec[e.model];
  if (vid == null || vid === "" || model == null || model === "") {
    return undefined;
  }
  return `${vid}::${String(model)}`;
}

/** 某一行变更 → PATCH body（清空时传 null） */
export function patchBodyForRow(rowKey: string, value: string | null): PatchGlobalLlmSettingsBody {
  const e = ROW_KEY_TO_GLOBAL[rowKey as DefaultModelRowKey];
  if (!e) {
    return {};
  }
  if (value == null || value === "") {
    return {
      [e.vendor]: null,
      [e.model]: null,
    } as PatchGlobalLlmSettingsBody;
  }
  const idx = value.indexOf("::");
  if (idx === -1) {
    return {};
  }
  const vendorRaw = value.slice(0, idx);
  const model = value.slice(idx + 2);
  return {
    [e.vendor]: parseVendorIdSegment(vendorRaw),
    [e.model]: model,
  } as PatchGlobalLlmSettingsBody;
}

/** 将全局设置映射为各行的 Select value */
export function defaultsFromGlobal(settings: GlobalLlmSettings | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!settings) {
    return out;
  }
  for (const key of Object.keys(ROW_KEY_TO_GLOBAL)) {
    const v = rowValueFromGlobal(settings, key);
    if (v) {
      out[key] = v;
    }
  }
  return out;
}
