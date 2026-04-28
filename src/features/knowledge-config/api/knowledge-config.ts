import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";
import type {
  GetMetadataFieldsQuery,
  MetadataField,
  MetadataFieldAlias,
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

export async function getMetadataFields(
  query: GetMetadataFieldsQuery = {}
): Promise<{ items: MetadataField[]; total: number }> {
  try {
    const envelope = await http
      .get("metadata-fields", {
        searchParams: pickDefined({
          status: query.status,
          biz_code: query.biz_code,
          knowledge_base_id: query.knowledge_base_id,
        } as Record<string, unknown>),
      })
      .json<ApiEnvelope<{ items: MetadataField[]; total: number }>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询字段列表失败");
    }
    const d = envelope.data;
    return {
      items: d?.items ?? [],
      total: d?.total ?? d?.items?.length ?? 0,
    };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询字段列表失败");
  }
}

export async function createMetadataField(
  body: Partial<MetadataField> & { aliases?: Partial<MetadataFieldAlias>[] }
): Promise<MetadataField> {
  try {
    const envelope = await http
      .post("metadata-fields", {
        json: body,
      })
      .json<ApiEnvelope<MetadataField>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "创建字段失败");
    }
    if (!envelope.data) {
      throw new Error("返回数据为空");
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("创建字段失败");
  }
}

export async function patchMetadataField(
  id: number,
  body: Partial<MetadataField>
): Promise<MetadataField> {
  try {
    const envelope = await http
      .patch(`metadata-fields/${encodeURIComponent(String(id))}`, {
        json: body,
      })
      .json<ApiEnvelope<MetadataField>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "更新字段失败");
    }
    if (!envelope.data) {
      throw new Error("返回数据为空");
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("更新字段失败");
  }
}

export async function deleteMetadataField(id: number): Promise<void> {
  try {
    const envelope = await http
      .delete(`metadata-fields/${encodeURIComponent(String(id))}`)
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "删除字段失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("删除字段失败");
  }
}

export async function createMetadataFieldAlias(
  fieldId: number,
  body: Partial<MetadataFieldAlias>
): Promise<MetadataFieldAlias> {
  try {
    const envelope = await http
      .post(`metadata-fields/${encodeURIComponent(String(fieldId))}/aliases`, {
        json: body,
      })
      .json<ApiEnvelope<MetadataFieldAlias>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "创建别名失败");
    }
    if (!envelope.data) {
      throw new Error("返回数据为空");
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("创建别名失败");
  }
}

export async function patchMetadataFieldAlias(
  id: number,
  body: Partial<MetadataFieldAlias>
): Promise<MetadataFieldAlias> {
  try {
    const envelope = await http
      .patch(`metadata-fields/aliases/${encodeURIComponent(String(id))}`, {
        json: body,
      })
      .json<ApiEnvelope<MetadataFieldAlias>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "更新别名失败");
    }
    if (!envelope.data) {
      throw new Error("返回数据为空");
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("更新别名失败");
  }
}

export async function deleteMetadataFieldAlias(id: number): Promise<void> {
  try {
    const envelope = await http
      .delete(`metadata-fields/aliases/${encodeURIComponent(String(id))}`)
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "删除别名失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("删除别名失败");
  }
}
