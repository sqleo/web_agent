import type { PatchVendorConfigBody, VendorConfigField } from "@/api/types";

/** 能力标签（UI）→ 后端 model_type 常用取值 */
const CAPABILITY_TO_MODEL_TYPE: Record<string, string> = {
  LLM: "chat",
  Embedding: "embedding",
  VLM: "multimodal",
  Rerank: "rerank",
  TTS: "tts",
  ASR: "asr",
  Moderation: "moderation",
  OCR: "ocr",
};

const MODEL_TYPE_TO_CAPABILITY: Record<string, string> = {
  chat: "LLM",
  embedding: "Embedding",
  multimodal: "VLM",
  rerank: "Rerank",
  tts: "TTS",
  asr: "ASR",
  moderation: "Moderation",
  ocr: "OCR",
};

export function capabilityFromDefaultModelType(
  defaultModelType: string,
  capabilities: string[]
): string {
  const cap = MODEL_TYPE_TO_CAPABILITY[defaultModelType.toLowerCase()];
  if (cap && capabilities.includes(cap)) {
    return cap;
  }
  return capabilities[0] ?? "LLM";
}

export function modelTypeFromCapability(capability: string): string {
  return CAPABILITY_TO_MODEL_TYPE[capability] ?? capability.toLowerCase();
}

/** 将表单扁平值按 storage 拆成 column 与 extra，并组装 PATCH body */
export function buildPatchVendorBody(
  values: Record<string, string | undefined>,
  fields: VendorConfigField[]
): PatchVendorConfigBody {
  const body: PatchVendorConfigBody = {};
  const extra: Record<string, unknown> = {};

  for (const f of fields) {
    const v = values[f.key];
    if (v === undefined || v === "") {
      continue;
    }

    if (f.storage === "column") {
      switch (f.key) {
        case "api_key":
          body.api_key = v;
          break;
        case "base_url":
          body.base_url = v;
          break;
        case "api_secret":
          body.api_secret = v;
          break;
        case "organization":
          body.organization = v;
          break;
        case "name":
          body.name = v;
          break;
        default:
          (body as Record<string, unknown>)[f.key] = v;
      }
    } else {
      extra[f.key] = v;
    }
  }

  if (Object.keys(extra).length > 0) {
    body.extra_config = extra;
  }

  return body;
}
