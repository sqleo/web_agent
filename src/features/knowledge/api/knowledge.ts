import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";
import type {
  CreateKnowledgeBaseBody,
  GetKnowledgeBaseFilesQuery,
  GetKnowledgeBasesQuery,
  KnowledgeBase,
  KnowledgeBaseBatchFilesBody,
  KnowledgeBaseBatchFilesResult,
  KnowledgeBaseFilesListData,
  KnowledgeBaseListData,
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

export async function getKnowledgeBases(query: GetKnowledgeBasesQuery = {}): Promise<KnowledgeBaseListData> {
  const pageSize = query.page_size ?? 20;
  try {
    const envelope = await http
      .get("knowledge-bases", {
        searchParams: pickDefined({
          page: query.page ?? 1,
          page_size: pageSize,
        }),
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询知识库列表失败");
    }
    return normalizeKnowledgeBaseList(envelope.data, pageSize);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询知识库列表失败");
  }
}

export async function createKnowledgeBase(body: CreateKnowledgeBaseBody): Promise<KnowledgeBase | null> {
  try {
    const envelope = await http
      .post("knowledge-bases", {
        json: body,
      })
      .json<ApiEnvelope<KnowledgeBase | null>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "新建知识库失败");
    }
    return envelope.data ?? null;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("新建知识库失败");
  }
}

export async function addKnowledgeBaseFiles(
  kbId: number,
  body: KnowledgeBaseBatchFilesBody
): Promise<KnowledgeBaseBatchFilesResult> {
  try {
    const envelope = await http
      .post(`knowledge-bases/${encodeURIComponent(String(kbId))}/files/add`, {
        json: body,
      })
      .json<ApiEnvelope<KnowledgeBaseBatchFilesResult>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "加入文件失败");
    }
    const d = envelope.data;
    return {
      affected_file_ids: d?.affected_file_ids ?? [],
      skipped_file_ids: d?.skipped_file_ids ?? [],
    };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("加入文件失败");
  }
}

export async function removeKnowledgeBaseFiles(
  kbId: number,
  body: KnowledgeBaseBatchFilesBody
): Promise<KnowledgeBaseBatchFilesResult> {
  try {
    const envelope = await http
      .post(`knowledge-bases/${encodeURIComponent(String(kbId))}/files/remove`, {
        json: body,
      })
      .json<ApiEnvelope<KnowledgeBaseBatchFilesResult>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "移出文件失败");
    }
    const d = envelope.data;
    return {
      affected_file_ids: d?.affected_file_ids ?? [],
      skipped_file_ids: d?.skipped_file_ids ?? [],
    };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("移出文件失败");
  }
}

export async function indexKnowledgeBaseFile(kbId: number, fileId: number): Promise<void> {
  try {
    const envelope = await http
      .post(`knowledge-bases/${encodeURIComponent(String(kbId))}/files/${encodeURIComponent(String(fileId))}/index`)
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "入库失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("入库失败");
  }
}

export async function indexKnowledgeBaseFiles(
  kbId: number,
  body: KnowledgeBaseBatchFilesBody
): Promise<void> {
  for (const fileId of body.file_ids) {
    await indexKnowledgeBaseFile(kbId, fileId);
  }
}

export async function getKnowledgeBaseFiles(
  kbId: number,
  query: GetKnowledgeBaseFilesQuery = {}
): Promise<KnowledgeBaseFilesListData> {
  try {
    const envelope = await http
      .get(`knowledge-bases/${encodeURIComponent(String(kbId))}/files`, {
        searchParams: pickDefined({
          page: query.page ?? 1,
          page_size: query.page_size ?? 20,
        }),
      })
      .json<ApiEnvelope<KnowledgeBaseFilesListData>>();

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
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询知识库文件失败");
  }
}
