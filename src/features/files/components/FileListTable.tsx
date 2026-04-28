"use client";

import { Button, Card, Popconfirm, Space, Table, Tag, Tooltip, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import type { FileItem } from "../types";
import {
  fileCreatorLabel,
  fileLifecycleLabel,
  fileParseStatusLabel,
  fileParseStatusTagColor,
} from "@/lib/file-item-display";

interface FileListTableProps {
  items: FileItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPaginationChange: (page: number, pageSize: number) => void;
  deletingId: number | null;
  parsingId: number | null;
  reuploadingId: number | null;
  handleDeleteFile: (id: number) => void;
  handleParseFile: (id: number) => void;
  handleReuploadFile: (record: FileItem, file: File) => void;
}

function formatSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return "-";
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes / 1024;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[idx]}`;
}

export function FileListTable({
  items,
  loading,
  total,
  page,
  pageSize,
  onPaginationChange,
  deletingId,
  parsingId,
  reuploadingId,
  handleDeleteFile,
  handleParseFile,
  handleReuploadFile,
}: FileListTableProps) {
  const columns: ColumnsType<FileItem> = useMemo(
    () => [
      {
        title: "文件名",
        dataIndex: "file_name",
        key: "file_name",
        ellipsis: true,
      },
      {
        title: "解析",
        dataIndex: "parse_status",
        key: "parse_status",
        width: 96,
        responsive: ["md"],
        render: (v: FileItem["parse_status"]) => (
          <Tag color={fileParseStatusTagColor(v)}>{fileParseStatusLabel(v)}</Tag>
        ),
      },
      {
        title: "内容版本",
        dataIndex: "content_semver",
        key: "content_semver",
        width: 96,
        responsive: ["sm"],
        render: (v: string) => v || "—",
      },
      {
        title: "后缀",
        dataIndex: "file_ext",
        key: "file_ext",
        width: 90,
        responsive: ["md"],
      },
      {
        title: "大小",
        dataIndex: "size_bytes",
        key: "size_bytes",
        width: 100,
        align: "right",
        responsive: ["sm"],
        render: (v: number) => formatSize(v),
      },
      {
        title: "项目",
        dataIndex: "project_code",
        key: "project_code",
        width: 140,
        responsive: ["lg"],
        render: (v: string | null) => v || "-",
      },
      {
        title: "业务状态",
        dataIndex: "status",
        key: "status",
        width: 88,
        responsive: ["md"],
        render: (v: FileItem["status"]) => fileLifecycleLabel(v),
      },
      {
        title: "创建人",
        key: "creator",
        width: 110,
        responsive: ["md"],
        ellipsis: true,
        render: (_: unknown, record: FileItem) => fileCreatorLabel(record),
      },
      {
        title: "创建时间",
        dataIndex: "created_at",
        key: "created_at",
        width: 160,
        responsive: ["xl"],
        render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
      },
      {
        title: "操作",
        key: "actions",
        width: 236,
        fixed: "right",
        render: (_: unknown, record: FileItem) => {
          const canParse = record.parse_status !== "parsed";
          const parseBtn = (
            <Button
              type="link"
              size="small"
              className="!px-0"
              loading={parsingId === record.id}
              disabled={deletingId === record.id || !canParse}
              onClick={() => void handleParseFile(record.id)}
            >
              解析
            </Button>
          );
          return (
            <Space size="small" wrap>
              {canParse ? (
                parseBtn
              ) : (
                <Tooltip title="已生成中间 Markdown，如需重新解析请先覆盖上传该文件">
                  <span className="inline-flex">{parseBtn}</span>
                </Tooltip>
              )}
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  void handleReuploadFile(record, file);
                  return false;
                }}
              >
                <Button
                  type="link"
                  size="small"
                  className="!px-0"
                  loading={reuploadingId === record.id}
                  disabled={deletingId === record.id || parsingId === record.id}
                >
                  更新文件
                </Button>
              </Upload>
              <Popconfirm
                title="确认删除该文件？"
                description="软删除后列表中将不再显示。"
                okText="删除"
                cancelText="取消"
                onConfirm={() => void handleDeleteFile(record.id)}
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  className="!px-0"
                  loading={deletingId === record.id}
                  disabled={parsingId === record.id}
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [deletingId, handleDeleteFile, handleParseFile, handleReuploadFile, parsingId, reuploadingId]
  );

  return (
    <Card size="small" title="文件列表" className="min-w-0">
      <Table<FileItem>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        onChange={(pagination) => {
          onPaginationChange(pagination.current || 1, pagination.pageSize || 20);
        }}
      />
    </Card>
  );
}
