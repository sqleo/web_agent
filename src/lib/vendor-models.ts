import type { AvailableModelEntry } from "@/api/llm-settings";

/** 左侧「设置默认模型」行 key → 与后端 capabilities 对齐 */
export const ROW_KEY_TO_CAPABILITY: Record<string, string> = {
  llm: "LLM",
  embedding: "Embedding",
  vlm: "VLM",
  asr: "ASR",
  rerank: "Rerank",
  tts: "TTS",
};

/** 将 GET /llm/settings/available-models 的扁平列表按厂商分组为 Select options（value：`vendor_id::model_id`） */
export function buildGroupedOptionsFromAvailable(
  entries: AvailableModelEntry[],
  capability: string
): { label: string; options: { label: string; value: string }[] }[] {
  const want = capability.trim().toLowerCase();
  const filtered = entries.filter((e) => e.capability.trim().toLowerCase() === want);

  const byVendor = new Map<
    string,
    { label: string; options: { label: string; value: string }[]; seen: Set<string> }
  >();

  for (const e of filtered) {
    const vid = String(e.vendor_id);
    const value = `${String(e.vendor_id)}::${e.model_id}`;
    let g = byVendor.get(vid);
    if (!g) {
      g = { label: e.vendor_name, options: [], seen: new Set<string>() };
      byVendor.set(vid, g);
    }
    if (g.seen.has(value)) {
      continue;
    }
    g.seen.add(value);
    g.options.push({
      label: e.model_name ?? e.model_id,
      value,
    });
  }

  return Array.from(byVendor.values())
    .map(({ label, options }) => ({ label, options }))
    .filter((g) => g.options.length > 0);
}
