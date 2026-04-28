"use client";

import { Form, Input, Modal, Select, Spin, Typography } from "antd";
import type { FormInstance } from "antd";
import type { TargetEntityOption } from "../types";

function targetLabel(e: TargetEntityOption): string {
  const name = e.canonical_name?.trim() || e.name?.trim();
  const base = name || `#${e.id}`;
  return e.entity_type ? `${base} · ${e.entity_type}` : base;
}

interface MergeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: FormInstance;
  submitting: boolean;
  onSubmit: () => Promise<void>;
  mergeOptions: TargetEntityOption[];
  mergeSearchLoading: boolean;
  onMergeSearch: (kw: string) => void;
}

export function MergeModal({
  open,
  setOpen,
  form,
  submitting,
  onSubmit,
  mergeOptions,
  mergeSearchLoading,
  onMergeSearch,
}: MergeModalProps) {
  return (
    <Modal
      title="合并到已有正式实体"
      open={open}
      onCancel={() => !submitting && setOpen(false)}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      okText="确认合并"
      cancelButtonProps={{ disabled: submitting }}
      width={520}
    >
      <Typography.Paragraph type="secondary" className="!text-xs">
        仅展示与当前候选同作用域（业务线、知识库、实体类型一致）的正式实体；支持关键词搜索。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item
          name="target_entity_id"
          label="目标实体"
          rules={[{ required: true, message: "请选择目标实体" }]}
        >
          <Select<number>
            showSearch
            allowClear
            placeholder="搜索并选择"
            loading={mergeSearchLoading}
            filterOption={false}
            onSearch={onMergeSearch}
            options={mergeOptions.map((e) => ({
              value: e.id,
              label: targetLabel(e),
            }))}
            notFoundContent={mergeSearchLoading ? <Spin size="small" /> : null}
          />
        </Form.Item>
        <Form.Item name="review_comment" label="备注（可选）">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
