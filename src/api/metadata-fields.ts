import { HTTPError } from "@/https";
import { authApi } from "./client";
import type {
  ApiEnvelope,
  CreateMetadataFieldBody,
  CreateMetadataFieldAliasBody,
  MetadataField,
  MetadataFieldAlias,
  MetadataFieldsListData,
  PatchMetadataFieldAliasBody,
  PatchMetadataFieldBody,
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

export type GetMetadataFieldsQuery = {
  knowledge_base_id?: number;
  biz_code?: string;
  status?: 0 | 1;
};

/** GET /metadata-fields */
export async function getMetadataFields(
  query: GetMetadataFieldsQuery = {}
): Promise<MetadataFieldsListData> {
  let envelope: ApiEnvelope<MetadataFieldsListData>;
  try {
    envelope = await authApi.get<ApiEnvelope<MetadataFieldsListData>>("metadata-fields", {
      searchParams: pickDefined({
        knowledge_base_id: query.knowledge_base_id,
        biz_code: query.biz_code,
        status: query.status,
      }),
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询 metadata 字段失败");
  }
  const d = envelope.data;
  return {
    total: d?.total ?? 0,
    items: d?.items ?? [],
  };
}

/** POST /metadata-fields */
export async function createMetadataField(body: CreateMetadataFieldBody): Promise<MetadataField | null> {
  let envelope: ApiEnvelope<MetadataField | null>;
  try {
    envelope = await authApi.post<ApiEnvelope<MetadataField | null>>("metadata-fields", {
      json: body,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "新建字段失败");
  }
  return envelope.data ?? null;
}

/** PATCH /metadata-fields/{field_id} */
export async function patchMetadataField(
  fieldId: number,
  body: PatchMetadataFieldBody
): Promise<MetadataField | null> {
  let envelope: ApiEnvelope<MetadataField | null>;
  try {
    envelope = await authApi.patch<ApiEnvelope<MetadataField | null>>(
      `metadata-fields/${encodeURIComponent(String(fieldId))}`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "更新字段失败");
  }
  return envelope.data ?? null;
}

/** DELETE /metadata-fields/{field_id} */
export async function deleteMetadataField(fieldId: number): Promise<void> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.del<ApiEnvelope<unknown>>(
      `metadata-fields/${encodeURIComponent(String(fieldId))}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "删除字段失败");
  }
}

/** GET /metadata-fields/{field_id}/aliases */
export async function getMetadataFieldAliases(fieldId: number): Promise<MetadataFieldAlias[]> {
  let envelope: ApiEnvelope<{ items?: MetadataFieldAlias[] } | MetadataFieldAlias[]>;
  try {
    envelope = await authApi.get<
      ApiEnvelope<{ items?: MetadataFieldAlias[] } | MetadataFieldAlias[]>
    >(`metadata-fields/${encodeURIComponent(String(fieldId))}/aliases`);
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询别名失败");
  }
  const raw = envelope.data;
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    return raw.items;
  }
  return [];
}

/** POST /metadata-fields/{field_id}/aliases */
export async function createMetadataFieldAlias(
  fieldId: number,
  body: CreateMetadataFieldAliasBody
): Promise<MetadataFieldAlias | null> {
  let envelope: ApiEnvelope<MetadataFieldAlias | null>;
  try {
    envelope = await authApi.post<ApiEnvelope<MetadataFieldAlias | null>>(
      `metadata-fields/${encodeURIComponent(String(fieldId))}/aliases`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "新增别名失败");
  }
  return envelope.data ?? null;
}

/** PATCH /metadata-fields/aliases/{alias_id} */
export async function patchMetadataFieldAlias(
  aliasId: number,
  body: PatchMetadataFieldAliasBody
): Promise<MetadataFieldAlias | null> {
  let envelope: ApiEnvelope<MetadataFieldAlias | null>;
  try {
    envelope = await authApi.patch<ApiEnvelope<MetadataFieldAlias | null>>(
      `metadata-fields/aliases/${encodeURIComponent(String(aliasId))}`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "更新别名失败");
  }
  return envelope.data ?? null;
}

/** DELETE /metadata-fields/aliases/{alias_id} */
export async function deleteMetadataFieldAlias(aliasId: number): Promise<void> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.del<ApiEnvelope<unknown>>(
      `metadata-fields/aliases/${encodeURIComponent(String(aliasId))}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "删除别名失败");
  }
}
