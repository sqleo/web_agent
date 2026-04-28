import type { FileUploadItem } from "@/api/types";

export type { FileUploadItem };

export type KnowledgePipelineStatus =
  | "pending_md"
  | "ready_to_index"
  | "queued"
  | "indexing"
  | "indexed"
  | "failed";

export type KnowledgeBase = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
};

export type CreateKnowledgeBaseBody = {
  name: string;
  code?: string;
  description?: string;
  thumbnail_url?: string;
};

export type KnowledgeBaseBatchFilesBody = {
  file_ids: number[];
};

export type KnowledgeBaseFileOperateRequest = KnowledgeBaseBatchFilesBody;

export type KnowledgeBaseBatchFilesResult = {
  affected_file_ids: number[];
  skipped_file_ids: number[];
};

export type KnowledgeBaseFileListItem = FileUploadItem & {
  kb_file_id: number;
  pipeline_status: KnowledgePipelineStatus;
  pipeline_error?: string | null;
  indexed_at?: string | null;
  chunk_count?: number | null;
  indexed_content_semver?: string | null;
  has_newer_content?: boolean;
};

export type KnowledgeBaseFilesListData = {
  knowledge_base_id: number;
  total: number;
  page: number;
  page_size: number;
  items: KnowledgeBaseFileListItem[];
};

export type KnowledgeBaseListData = {
  items: KnowledgeBase[];
  total: number;
  page: number;
  page_size: number;
};

export type GetKnowledgeBasesQuery = {
  page?: number;
  page_size?: number;
};

export type GetKnowledgeBaseFilesQuery = {
  page?: number;
  page_size?: number;
};
