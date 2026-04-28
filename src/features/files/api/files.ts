import { http } from "@/lib/http";
import { HTTPError } from "ky";
import type { ApiEnvelope } from "@/api/types";
import type {
  CreateFolderBody,
  FileFolderTreeNode,
  FileItem,
  FileListData,
  GetFilesQuery,
  GetFolderTreeQuery,
  ParseFileMdResult,
  UploadFileBody,
  UploadFileResult,
} from "../types";
import { DUPLICATE_UPLOAD_CONFLICT_CODE } from "../types";

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

function normalizeTreeData(raw: unknown): FileFolderTreeNode[] {
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
  try {
    const envelope = await http
      .get("files", {
        searchParams: pickDefined({
          page: query.page ?? 1,
          page_size: query.page_size ?? 20,
          status: query.status,
          project_code: query.project_code,
        }),
      })
      .json<ApiEnvelope<FileListData>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询文件列表失败");
    }
    return {
      total: envelope.data?.total ?? 0,
      page: envelope.data?.page ?? 1,
      page_size: envelope.data?.page_size ?? 20,
      items: envelope.data?.items ?? [],
    };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询文件列表失败");
  }
}

export async function createFolder(body: CreateFolderBody): Promise<FileFolderTreeNode | null> {
  try {
    const envelope = await http
      .post("files/folders", {
        json: body,
      })
      .json<ApiEnvelope<FileFolderTreeNode | null>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "新建文件夹失败");
    }
    return envelope.data ?? null;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("新建文件夹失败");
  }
}

export async function getFolderTree(query: GetFolderTreeQuery = {}): Promise<FileFolderTreeNode[]> {
  try {
    const envelope = await http
      .get("files/folders/tree", {
        searchParams: pickDefined(query),
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询文件夹树失败");
    }
    return normalizeTreeData(envelope.data);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询文件夹树失败");
  }
}

function buildUploadFormData(body: UploadFileBody): FormData {
  const formData = new FormData();
  formData.append("file", body.file);
  if (body.folder_id !== undefined) {
    formData.append("folder_id", String(body.folder_id));
  }
  if (body.project_code) {
    formData.append("project_code", body.project_code);
  }
  formData.append("source", body.source || "manual_upload");
  return formData;
}

export async function reuploadFile(fileId: number, body: UploadFileBody): Promise<FileItem | null> {
  const formData = buildUploadFormData(body);
  try {
    const envelope = await http
      .put(`files/${encodeURIComponent(String(fileId))}/reupload`, {
        body: formData,
      })
      .json<ApiEnvelope<FileItem | null>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "更新文件失败");
    }
    return envelope.data ?? null;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("更新文件失败");
  }
}

export async function uploadFile(body: UploadFileBody): Promise<UploadFileResult> {
  const formData = buildUploadFormData(body);

  try {
    const envelope = await http
      .post("files/upload", {
        body: formData,
      })
      .json<ApiEnvelope<FileItem | null>>();

    if (envelope.code !== 0) {
      if (envelope.code === DUPLICATE_UPLOAD_CONFLICT_CODE) {
        const raw = envelope.data as any;
        if (raw && typeof raw.file_id === "number") {
          const item = await reuploadFile(raw.file_id, body);
          return { item, didAutoReupload: true };
        }
      }
      throw new Error(envelope.message || "上传文件失败");
    }
    return { item: envelope.data ?? null };
  } catch (e) {
    if (e instanceof HTTPError && e.response.status === 409) {
      try {
        const fail = (await e.response.json()) as ApiEnvelope<any>;
        if (fail.code === DUPLICATE_UPLOAD_CONFLICT_CODE) {
          const fid = fail.data?.file_id;
          if (typeof fid === "number") {
            const item = await reuploadFile(fid, body);
            return { item, didAutoReupload: true };
          }
        }
      } catch {
        // ignore json parse error
      }
    }
    if (e instanceof Error) throw e;
    throw new Error("上传文件失败");
  }
}

export async function parseFileMd(fileId: number): Promise<ParseFileMdResult> {
  try {
    const envelope = await http
      .post(`files/${encodeURIComponent(String(fileId))}/parse-md`)
      .json<ApiEnvelope<ParseFileMdResult>>();

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
  } catch (e) {
    if (e instanceof HTTPError) {
      const status = e.response.status;
      if (status === 415) throw new Error("仅支持 Markdown 文件");
      if (status === 422) throw new Error("源文件不在磁盘，无法解析");
    }
    if (e instanceof Error) throw e;
    throw new Error("解析失败");
  }
}

export async function deleteFile(fileId: number): Promise<void> {
  try {
    const envelope = await http
      .delete(`files/${encodeURIComponent(String(fileId))}`)
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "删除文件失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("删除文件失败");
  }
}
