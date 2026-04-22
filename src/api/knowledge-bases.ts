import { HTTPError } from "@/https";
import { authApi } from "./client";
import type {
  ApiEnvelope,
  CreateKnowledgeBaseBody,
  KnowledgeBase,
  KnowledgeBaseBatchFilesBody,
  KnowledgeBaseBatchFilesResult,
  KnowledgeBaseFileOperateRequest,
  KnowledgeBaseFilesListData,
  KnowledgeBaseListData,
} from "./types";

export type GetKnowledgeBasesQuery = {
  page?: number;
  page_size?: number;
};

export type GetKnowledgeBaseFilesQuery = {
  page?: number;
  page_size?: number;
};

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

function normalizeKnowledgeBaseList(raw: unknown, fallbackPageSize: number): KnowledgeBaseListData {
  if (Array.isArray(raw)) {
    const items = raw as KnowledgeBase[];
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
    ) as KnowledgeBase[];
    const total = typeof r.total === "number" ? r.total : items.length;
    const page = typeof r.page === "number" ? r.page : 1;
    const page_size = typeof r.page_size === "number" ? r.page_size : fallbackPageSize;
    return { items, total, page, page_size };
  }
  return { items: [], total: 0, page: 1, page_size: fallbackPageSize };
}

/** GET /knowledge-bases */
export async function getKnowledgeBases(query: GetKnowledgeBasesQuery = {}): Promise<KnowledgeBaseListData> {
  const pageSize = query.page_size ?? 20;
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.get<ApiEnvelope<unknown>>("knowledge-bases", {
      searchParams: pickDefined({
        page: query.page ?? 1,
        page_size: pageSize,
      }),
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询知识库列表失败");
  }
  return normalizeKnowledgeBaseList(envelope.data, pageSize);
}

/** POST /knowledge-bases */
export async function createKnowledgeBase(body: CreateKnowledgeBaseBody): Promise<KnowledgeBase | null> {
  let envelope: ApiEnvelope<KnowledgeBase | null>;
  try {
    envelope = await authApi.post<ApiEnvelope<KnowledgeBase | null>>("knowledge-bases", {
      json: body,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "新建知识库失败");
  }
  return envelope.data ?? null;
}

/** POST /knowledge-bases/{kb_id}/files/add */
export async function addKnowledgeBaseFiles(
  kbId: number,
  body: KnowledgeBaseBatchFilesBody
): Promise<KnowledgeBaseBatchFilesResult> {
  let envelope: ApiEnvelope<KnowledgeBaseBatchFilesResult>;
  try {
    envelope = await authApi.post<ApiEnvelope<KnowledgeBaseBatchFilesResult>>(
      `knowledge-bases/${encodeURIComponent(String(kbId))}/files/add`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "加入文件失败");
  }
  const d = envelope.data;
  return {
    affected_file_ids: d?.affected_file_ids ?? [],
    skipped_file_ids: d?.skipped_file_ids ?? [],
  };
}

/** POST /knowledge-bases/{kb_id}/files/remove */
export async function removeKnowledgeBaseFiles(
  kbId: number,
  body: KnowledgeBaseBatchFilesBody
): Promise<KnowledgeBaseBatchFilesResult> {
  let envelope: ApiEnvelope<KnowledgeBaseBatchFilesResult>;
  try {
    envelope = await authApi.post<ApiEnvelope<KnowledgeBaseBatchFilesResult>>(
      `knowledge-bases/${encodeURIComponent(String(kbId))}/files/remove`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "移出文件失败");
  }
  const d = envelope.data;
  return {
    affected_file_ids: d?.affected_file_ids ?? [],
    skipped_file_ids: d?.skipped_file_ids ?? [],
  };
}

/** POST /knowledge-bases/{kb_id}/files/{file_id}/index — 202 Accepted，入队入库 */
export async function indexKnowledgeBaseFile(kbId: number, fileId: number): Promise<void> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.post<ApiEnvelope<unknown>>(
      `knowledge-bases/${encodeURIComponent(String(kbId))}/files/${encodeURIComponent(String(fileId))}/index`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "入库失败");
  }
}

/** 对多个 file_id 依次请求单文件入库接口 */
export async function indexKnowledgeBaseFiles(
  kbId: number,
  body: KnowledgeBaseFileOperateRequest
): Promise<void> {
  for (const fileId of body.file_ids) {
    await indexKnowledgeBaseFile(kbId, fileId);
  }
}

/** GET /knowledge-bases/{kb_id}/files */
export async function getKnowledgeBaseFiles(
  kbId: number,
  query: GetKnowledgeBaseFilesQuery = {}
): Promise<KnowledgeBaseFilesListData> {
  let envelope: ApiEnvelope<KnowledgeBaseFilesListData>;
  try {
    envelope = await authApi.get<ApiEnvelope<KnowledgeBaseFilesListData>>(
      `knowledge-bases/${encodeURIComponent(String(kbId))}/files`,
      {
        searchParams: pickDefined({
          page: query.page ?? 1,
          page_size: query.page_size ?? 20,
        }),
      }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询知识库文件失败");
  }
  const d = envelope.data;
  return {
    knowledge_base_id: d?.knowledge_base_id ?? kbId,
    total: d?.total ?? 0,
    page: d?.page ?? 1,
    page_size: d?.page_size ?? 20,
    items: d?.items ?? [],
  };
}
