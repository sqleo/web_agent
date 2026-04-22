import { HTTPError } from "@/https";
import { authApi } from "./client";
import type {
  ApiEnvelope,
  ApproveEntityCandidateBody,
  EntityCandidate,
  EntityCandidateListData,
  MergeEntityCandidateBody,
  RejectEntityCandidateBody,
  TargetEntityOption,
} from "./types";

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

function normalizeEntityCandidateList(raw: unknown, fallbackPageSize: number): EntityCandidateListData {
  if (Array.isArray(raw)) {
    const items = raw as EntityCandidate[];
    return {
      items,
      total: items.length,
      page: 1,
      page_size: items.length || fallbackPageSize,
    };
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const items = (
      Array.isArray(r.items) ? r.items : Array.isArray(r.list) ? r.list : []
    ) as EntityCandidate[];
    const total = typeof r.total === "number" ? r.total : items.length;
    const page = typeof r.page === "number" ? r.page : 1;
    const page_size = typeof r.page_size === "number" ? r.page_size : fallbackPageSize;
    return { items, total, page, page_size };
  }
  return { items: [], total: 0, page: 1, page_size: fallbackPageSize };
}

export type GetEntityCandidatesQuery = {
  page?: number;
  page_size?: number;
  status?: string;
  biz_code?: string;
  knowledge_base_id?: number;
  file_id?: number;
  keyword?: string;
};

/** GET /entity-candidates */
export async function getEntityCandidates(
  query: GetEntityCandidatesQuery = {}
): Promise<EntityCandidateListData> {
  const pageSize = query.page_size ?? 20;
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.get<ApiEnvelope<unknown>>("entity-candidates", {
      searchParams: pickDefined({
        page: query.page ?? 1,
        page_size: pageSize,
        status: query.status,
        biz_code: query.biz_code,
        knowledge_base_id: query.knowledge_base_id,
        file_id: query.file_id,
        keyword: query.keyword,
      }),
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询候选实体失败");
  }
  return normalizeEntityCandidateList(envelope.data, pageSize);
}

/** POST /entity-candidates/{id}/approve */
export async function approveEntityCandidate(
  id: number,
  body: ApproveEntityCandidateBody
): Promise<unknown> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.post<ApiEnvelope<unknown>>(
      `entity-candidates/${encodeURIComponent(String(id))}/approve`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "审核通过失败");
  }
  return envelope.data;
}

/** POST /entity-candidates/{id}/reject */
export async function rejectEntityCandidate(
  id: number,
  body: RejectEntityCandidateBody
): Promise<unknown> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.post<ApiEnvelope<unknown>>(
      `entity-candidates/${encodeURIComponent(String(id))}/reject`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "驳回失败");
  }
  return envelope.data;
}

/** POST /entity-candidates/{id}/merge */
export async function mergeEntityCandidate(
  id: number,
  body: MergeEntityCandidateBody
): Promise<unknown> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.post<ApiEnvelope<unknown>>(
      `entity-candidates/${encodeURIComponent(String(id))}/merge`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "合并失败");
  }
  return envelope.data;
}

export type GetTargetEntitiesQuery = {
  biz_code?: string;
  knowledge_base_id?: number;
  entity_type?: string;
  keyword?: string;
  limit?: number;
};

function normalizeTargetEntities(raw: unknown): TargetEntityOption[] {
  if (Array.isArray(raw)) {
    return raw as TargetEntityOption[];
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const arr = r.items ?? r.list ?? r.data;
    if (Array.isArray(arr)) {
      return arr as TargetEntityOption[];
    }
  }
  return [];
}

/** GET /entity-candidates/target-entities */
export async function getTargetEntitiesForMerge(
  query: GetTargetEntitiesQuery = {}
): Promise<TargetEntityOption[]> {
  const limit = query.limit ?? 50;
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.get<ApiEnvelope<unknown>>("entity-candidates/target-entities", {
      searchParams: pickDefined({
        biz_code: query.biz_code,
        knowledge_base_id: query.knowledge_base_id,
        entity_type: query.entity_type,
        keyword: query.keyword,
        limit,
      }),
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询目标实体失败");
  }
  return normalizeTargetEntities(envelope.data);
}
