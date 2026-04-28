import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";
import type {
  EntityCandidate,
  GetEntityCandidatesQuery,
  TargetEntityOption,
} from "../types";

function pickDefined<T extends Record<string, unknown>>(obj: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") {
      continue;
    }
    out[k] = String(v);
  }
  return out;
}

export async function getEntityCandidates(
  query: GetEntityCandidatesQuery = {}
): Promise<{ items: EntityCandidate[]; total: number }> {
  try {
    const envelope = await http
      .get("entity-candidates", {
        searchParams: pickDefined({
          page: query.page ?? 1,
          page_size: query.page_size ?? 20,
          status: query.status,
          biz_code: query.biz_code,
          knowledge_base_id: query.knowledge_base_id,
          file_id: query.file_id,
          keyword: query.keyword,
        } as Record<string, unknown>),
      })
      .json<ApiEnvelope<{ items: EntityCandidate[]; total: number }>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询候选实体失败");
    }
    return (
      envelope.data ?? {
        items: [],
        total: 0,
      }
    );
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询候选实体失败");
  }
}

export async function approveEntityCandidate(
  id: number,
  body: {
    canonical_name: string;
    entity_type: string;
    aliases: string[];
    review_comment?: string;
  }
): Promise<void> {
  try {
    const envelope = await http
      .post(`entity-candidates/${encodeURIComponent(String(id))}/approve`, {
        json: body,
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "通过候选实体失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("通过候选实体失败");
  }
}

export async function rejectEntityCandidate(
  id: number,
  body: { review_comment: string }
): Promise<void> {
  try {
    const envelope = await http
      .post(`entity-candidates/${encodeURIComponent(String(id))}/reject`, {
        json: body,
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "驳回候选实体失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("驳回候选实体失败");
  }
}

export async function mergeEntityCandidate(
  id: number,
  body: { target_entity_id: number; review_comment?: string }
): Promise<void> {
  try {
    const envelope = await http
      .post(`entity-candidates/${encodeURIComponent(String(id))}/merge`, {
        json: body,
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "合并候选实体失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("合并候选实体失败");
  }
}

export async function getTargetEntitiesForMerge(
  query: {
    biz_code?: string;
    knowledge_base_id?: number;
    entity_type?: string;
    keyword?: string;
    limit?: number;
  } = {}
): Promise<TargetEntityOption[]> {
  try {
    const envelope = await http
      .get("entity-candidates/target-entities", {
        searchParams: pickDefined({
          biz_code: query.biz_code,
          knowledge_base_id: query.knowledge_base_id,
          entity_type: query.entity_type,
          keyword: query.keyword,
          limit: query.limit,
        } as Record<string, unknown>),
      })
      .json<ApiEnvelope<TargetEntityOption[]>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询目标实体失败");
    }
    return envelope.data ?? [];
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询目标实体失败");
  }
}
