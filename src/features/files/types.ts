import type { FileItem, FileFolderTreeNode, FileListData, FileLifecycleStatus } from "@/api/types";

export type { FileItem, FileFolderTreeNode, FileListData, FileLifecycleStatus };

export const DUPLICATE_UPLOAD_CONFLICT_CODE = 40901;

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

export type UploadFileResult = {
  item: FileItem | null;
  didAutoReupload?: boolean;
};

export type ParseFileMdResult = {
  content_semver?: string;
  parse_status?: string;
  parsed_md_storage_key: string;
  parsed_md_url: string;
};
