import type { Vendor, PatchVendorConfigBody } from "@/api/types";

export type { Vendor, PatchVendorConfigBody };

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
