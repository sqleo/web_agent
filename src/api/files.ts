import { HTTPError } from "@/https";
import { authApi } from "./client";
import type {
  ApiEnvelope,
  FileFolderTreeNode,
  FileItem,
  FileListData,
  FileLifecycleStatus,
  ParseFileMdResult,
} from "./types";

export type GetFilesQuery = {
  page?: number;
  page_size?: number;
  status?: FileLifecycleStatus;
  project_code?: string;
};

export type CreateFolderBody = {
  name: string;
  parent_folder_id?: number;
  project_code?: string;
  description?: string;
};

export type GetFolderTreeQuery = {
  project_code?: string;
};

export type UploadFileBody = {
  file: File;
  folder_id?: number;
  project_code?: string;
  source?: string;
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

function normalizeTreeData(
  raw: unknown
): FileFolderTreeNode[] {
  if (Array.isArray(raw)) {
    return raw as FileFolderTreeNode[];
  }
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as FileFolderTreeNode[];
    }
    if (Array.isArray(rec.list)) {
      return rec.list as FileFolderTreeNode[];
    }
  }
  return [];
}

export async function getFiles(query: GetFilesQuery = {}): Promise<FileListData> {
  let envelope: ApiEnvelope<FileListData>;
  try {
    envelope = await authApi.get<ApiEnvelope<FileListData>>("files", {
      searchParams: pickDefined({
        page: query.page ?? 1,
        page_size: query.page_size ?? 20,
        status: query.status,
        project_code: query.project_code,
      }),
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询文件列表失败");
  }
  return {
    total: envelope.data?.total ?? 0,
    page: envelope.data?.page ?? 1,
    page_size: envelope.data?.page_size ?? 20,
    items: envelope.data?.items ?? [],
  };
}

export async function createFolder(body: CreateFolderBody): Promise<FileFolderTreeNode | null> {
  let envelope: ApiEnvelope<FileFolderTreeNode | null>;
  try {
    envelope = await authApi.post<ApiEnvelope<FileFolderTreeNode | null>>("files/folders", {
      json: body,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "新建文件夹失败");
  }
  return envelope.data ?? null;
}

export async function getFolderTree(query: GetFolderTreeQuery = {}): Promise<FileFolderTreeNode[]> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.get<ApiEnvelope<unknown>>("files/folders/tree", {
      searchParams: pickDefined(query),
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询文件夹树失败");
  }
  return normalizeTreeData(envelope.data);
}

export async function uploadFile(body: UploadFileBody): Promise<FileItem | null> {
  const formData = new FormData();
  formData.append("file", body.file);
  if (body.folder_id !== undefined) {
    formData.append("folder_id", String(body.folder_id));
  }
  if (body.project_code) {
    formData.append("project_code", body.project_code);
  }
  formData.append("source", body.source || "manual_upload");

  let envelope: ApiEnvelope<FileItem | null>;
  try {
    envelope = await authApi.post<ApiEnvelope<FileItem | null>>("files/upload", {
      body: formData,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "上传文件失败");
  }
  return envelope.data ?? null;
}

/** POST /files/{file_id}/parse-md（需登录）。非 Markdown：415；源文件不在磁盘：422 */
export async function parseFileMd(fileId: number): Promise<ParseFileMdResult> {
  let envelope: ApiEnvelope<ParseFileMdResult>;
  try {
    envelope = await authApi.post<ApiEnvelope<ParseFileMdResult>>(
      `files/${encodeURIComponent(String(fileId))}/parse-md`,
      { json: {} }
    );
  } catch (e) {
    if (e instanceof HTTPError) {
      const status = e.response.status;
      const msg = await toReadableMessage(e);
      if (status === 415) throw new Error(msg || "仅支持 Markdown 文件");
      if (status === 422) throw new Error(msg || "源文件不在磁盘，无法解析");
      throw new Error(msg);
    }
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "解析失败");
  }
  const d = envelope.data;
  if (!d?.parsed_md_url) {
    throw new Error("解析成功但未返回地址");
  }
  return {
    content_semver: d.content_semver,
    parse_status: d.parse_status,
    parsed_md_storage_key: d.parsed_md_storage_key ?? "",
    parsed_md_url: d.parsed_md_url,
  };
}

/** DELETE /files/{file_id}（软删除，需登录） */
export async function deleteFile(fileId: number): Promise<void> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.del<ApiEnvelope<unknown>>(
      `files/${encodeURIComponent(String(fileId))}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "删除文件失败");
  }
}
