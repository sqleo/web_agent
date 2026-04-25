import type {
  FileItem,
  FileLifecycleStatus,
  FileParseStatus,
  KnowledgePipelineStatus,
} from "@/api";

/** 文件列表「创建人」：使用后端字段 `uploader_name` */
export function fileCreatorLabel(record: FileItem): string {
  const s = record.uploader_name?.trim();
  return s || "—";
}

const LIFECYCLE_LABEL: Record<FileLifecycleStatus, string> = {
  draft: "草稿",
  reviewed: "已审阅",
  approved: "已批准",
  archived: "已归档",
};

/** 文件业务状态（status） */
export function fileLifecycleLabel(status: FileLifecycleStatus | undefined | null): string {
  if (status == null) return "—";
  return LIFECYCLE_LABEL[status] ?? String(status);
}

const PARSE_LABEL: Record<FileParseStatus, string> = {
  pending: "待解析",
  parsed: "已解析",
};

/** 解析状态 parse_status */
export function fileParseStatusLabel(status: FileParseStatus | undefined | null): string {
  if (status == null) return "—";
  return PARSE_LABEL[status] ?? String(status);
}

export function fileParseStatusTagColor(
  status: FileParseStatus | undefined | null
): "default" | "success" | "warning" {
  switch (status) {
    case "parsed":
      return "success";
    case "pending":
      return "success";
    default:
      return "default";
  }
}

const PIPELINE_LABEL: Record<KnowledgePipelineStatus, string> = {
  pending_md: "待中间稿",
  ready_to_index: "可入库",
  queued: "排队中",
  indexing: "入库中",
  indexed: "已入库",
  failed: "失败",
};

/** 知识库维度 pipeline_status */
export function pipelineStatusLabel(status: KnowledgePipelineStatus | undefined | null): string {
  if (status == null) return "—";
  return PIPELINE_LABEL[status] ?? String(status);
}

export function pipelineStatusTagColor(
  status: KnowledgePipelineStatus | undefined | null
): "default" | "success" | "error" | "warning" {
  switch (status) {
    case "indexed":
      return "success";
    case "queued":
    case "indexing":
      return "success";
    case "failed":
      return "error";
    case "ready_to_index":
      return "warning";
    default:
      return "default";
  }
}
