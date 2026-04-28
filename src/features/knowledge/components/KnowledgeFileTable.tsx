"use client";

import { Button, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import type { Key } from "react";
import { knowledgeBaseFileColumns } from "@/app/(dashboard)/knowledge/knowledge-file-columns";
import type { KnowledgeBaseFileListItem } from "../types";

interface KnowledgeFileTableProps {
  loading: boolean;
  items: KnowledgeBaseFileListItem[];
  total: number;
  page: number;
  pageSize: number;
  selectedIds: number[];
  onSelectedChange: (keys: number[]) => void;
  onPageChange: (page: number, pageSize: number) => void;
  canIndexFile: (record: KnowledgeBaseFileListItem) => boolean;
  indexingFileId: number | null;
  indexing: boolean;
  onIndexOne: (id: number) => Promise<void>;
}

export function KnowledgeFileTable({
  loading,
  items,
  total,
  page,
  pageSize,
  selectedIds,
  onSelectedChange,
  onPageChange,
  canIndexFile,
  indexingFileId,
  indexing,
  onIndexOne,
}: KnowledgeFileTableProps) {
  const columns: ColumnsType<KnowledgeBaseFileListItem> = useMemo(
    () => [
      ...knowledgeBaseFileColumns,
      {
        title: "操作",
        key: "actions",
        width: 88,
        fixed: "right",
        render: (_: unknown, record: KnowledgeBaseFileListItem) => {
          const canIndex = canIndexFile(record);
          const busy = indexingFileId === record.id;
          const btn = (
            <Button
              type="link"
              size="small"
              className="!px-0"
              loading={busy}
              disabled={indexing || !canIndex}
              onClick={() => void onIndexOne(record.id)}
            >
              入库
            </Button>
          );
          if (canIndex) return btn;
          return (
            <Tooltip title="当前内容已入库完成，无需重复操作">
              <span className="inline-flex">{btn}</span>
            </Tooltip>
          );
        },
      },
    ],
    [canIndexFile, indexing, indexingFileId, onIndexOne]
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedIds,
      onChange: (keys: Key[]) => onSelectedChange(keys.map(Number)),
    }),
    [selectedIds, onSelectedChange]
  );

  return (
    <Table<KnowledgeBaseFileListItem>
      rowKey="id"
      size="small"
      loading={loading}
      columns={columns}
      dataSource={items}
      rowSelection={rowSelection}
      scroll={{ x: 1200 }}
      pagination={{
        current: page,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
      }}
      onChange={(pagination) => {
        onPageChange(pagination.current || 1, pagination.pageSize || 20);
      }}
    />
  );
}
