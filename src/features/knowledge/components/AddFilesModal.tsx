"use client";

import { Modal, Table, Typography } from "antd";
import type { Key } from "react";
import { useMemo } from "react";
import { knowledgeFilePoolColumns } from "@/app/(dashboard)/knowledge/knowledge-file-columns";
import type { FileUploadItem } from "../types";

const POOL_ROW_DISABLED_TITLE =
  "请先在「文件管理」中完成解析（parse-md）后再加入知识库";

interface AddFilesModalProps {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  items: FileUploadItem[];
  total: number;
  page: number;
  pageSize: number;
  selectedIds: number[];
  onSelectedChange: (keys: number[]) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onOk: () => Promise<void>;
  submitting: boolean;
}

export function AddFilesModal({
  open,
  onCancel,
  loading,
  items,
  total,
  page,
  pageSize,
  selectedIds,
  onSelectedChange,
  onPageChange,
  onOk,
  submitting,
}: AddFilesModalProps) {
  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedIds,
      onChange: (keys: Key[]) => onSelectedChange(keys.map(Number)),
      getCheckboxProps: (record: FileUploadItem) => {
        const parsed = record.parse_status === "parsed";
        return {
          disabled: !parsed,
          title: !parsed ? POOL_ROW_DISABLED_TITLE : undefined,
        };
      },
    }),
    [selectedIds, onSelectedChange]
  );

  return (
    <Modal
      title="从文件库加入知识库"
      open={open}
      width={900}
      onCancel={onCancel}
      okText="加入选中"
      okButtonProps={{ loading: submitting, disabled: selectedIds.length === 0 }}
      onOk={() => void onOk()}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
        数据来源 <Typography.Text code>GET /files</Typography.Text>
      </Typography.Paragraph>
      <Table<FileUploadItem>
        rowKey="id"
        size="small"
        loading={loading}
        columns={knowledgeFilePoolColumns}
        dataSource={items}
        rowSelection={rowSelection}
        onRow={(record) => ({
          title: record.parse_status !== "parsed" ? POOL_ROW_DISABLED_TITLE : undefined,
        } as React.HTMLAttributes<any>)}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
        }}
        onChange={(pagination) => {
          onPageChange(pagination.current || 1, pagination.pageSize || 10);
        }}
      />
    </Modal>
  );
}
