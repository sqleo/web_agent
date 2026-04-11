import { Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { FileUploadItem, KnowledgeBaseFileListItem } from "@/api";
import {
  fileCreatorLabel,
  fileLifecycleLabel,
  fileParseStatusLabel,
  fileParseStatusTagColor,
  pipelineStatusLabel,
  pipelineStatusTagColor,
} from "@/lib/file-item-display";

export function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) return "-";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes / 1024;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[idx]}`;
}

/** 知识库内文件列表：含流水线状态、版本提示 */
export const knowledgeBaseFileColumns: ColumnsType<KnowledgeBaseFileListItem> = [
  { title: "ID", dataIndex: "id", key: "id", width: 72 },
  { title: "文件名", dataIndex: "file_name", key: "file_name", ellipsis: true },
  {
    title: "大小",
    dataIndex: "size_bytes",
    key: "size_bytes",
    width: 100,
    align: "right",
    render: (v: number) => formatFileSize(v),
  },
  {
    title: "业务状态",
    dataIndex: "status",
    key: "status",
    width: 88,
    render: (v: FileUploadItem["status"]) => fileLifecycleLabel(v),
  },
  {
    title: "解析",
    dataIndex: "parse_status",
    key: "parse_status",
    width: 88,
    render: (v: FileUploadItem["parse_status"]) => (
      <Tag color={fileParseStatusTagColor(v)}>{fileParseStatusLabel(v)}</Tag>
    ),
  },
  {
    title: "入库流水线",
    dataIndex: "pipeline_status",
    key: "pipeline_status",
    width: 112,
    render: (v: KnowledgeBaseFileListItem["pipeline_status"], record: KnowledgeBaseFileListItem) => {
      const err = record.pipeline_error?.trim();
      const tag = (
        <Tag color={pipelineStatusTagColor(v)}>{pipelineStatusLabel(v)}</Tag>
      );
      if (err && v === "failed") {
        return (
          <Tooltip title={err}>
            <span>{tag}</span>
          </Tooltip>
        );
      }
      return tag;
    },
  },
  {
    title: "版本",
    key: "semver_hint",
    width: 160,
    render: (_: unknown, record: KnowledgeBaseFileListItem) => {
      const cur = record.content_semver ?? "—";
      const idx = record.indexed_content_semver ?? null;
      const newer = record.has_newer_content;
      return (
        <div className="flex flex-col gap-0.5 text-xs leading-tight">
          <span>
            <Typography.Text type="secondary">内容</Typography.Text> {cur}
          </span>
          {idx != null && (
            <span>
              <Typography.Text type="secondary">已入库</Typography.Text> {idx}
            </span>
          )}
          {newer ? (
            <Tag color="warning" className="!m-0 !text-[11px]">
              有新版本待入库
            </Tag>
          ) : null}
        </div>
      );
    },
  },
  {
    title: "创建人",
    key: "creator",
    width: 110,
    ellipsis: true,
    render: (_: unknown, record: KnowledgeBaseFileListItem) => fileCreatorLabel(record),
  },
  {
    title: "创建时间",
    dataIndex: "created_at",
    key: "created_at",
    width: 170,
    render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

/** 从文件库加入弹窗：文件池列表（无 pipeline） */
export const knowledgeFilePoolColumns: ColumnsType<FileUploadItem> = [
  { title: "ID", dataIndex: "id", key: "id", width: 72 },
  { title: "文件名", dataIndex: "file_name", key: "file_name", ellipsis: true },
  {
    title: "大小",
    dataIndex: "size_bytes",
    key: "size_bytes",
    width: 100,
    align: "right",
    render: (v: number) => formatFileSize(v),
  },
  {
    title: "业务状态",
    dataIndex: "status",
    key: "status",
    width: 88,
    render: (v: FileUploadItem["status"]) => fileLifecycleLabel(v),
  },
  {
    title: "解析",
    dataIndex: "parse_status",
    key: "parse_status",
    width: 88,
    render: (v: FileUploadItem["parse_status"]) => (
      <Tag color={fileParseStatusTagColor(v)}>{fileParseStatusLabel(v)}</Tag>
    ),
  },
  {
    title: "内容版本",
    dataIndex: "content_semver",
    key: "content_semver",
    width: 96,
    render: (v: string) => v || "—",
  },
  {
    title: "创建人",
    key: "creator",
    width: 110,
    ellipsis: true,
    render: (_: unknown, record: FileUploadItem) => fileCreatorLabel(record),
  },
  {
    title: "创建时间",
    dataIndex: "created_at",
    key: "created_at",
    width: 170,
    render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
  },
];
