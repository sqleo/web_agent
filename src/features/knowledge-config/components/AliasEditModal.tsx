"use client";

import { QuestionCircleOutlined } from "@ant-design/icons";
import { Form, Input, InputNumber, Modal, Select, Tooltip } from "antd";
import type { FormInstance } from "antd";
import type { MetadataFieldAlias } from "../types";

const MATCH_MODES = ["exact", "contains", "regex"] as const;

function FieldLabel({ text, tip }: { text: string; tip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {text}
      <Tooltip title={tip} placement="topLeft">
        <QuestionCircleOutlined className="cursor-help text-[0.85em] text-[var(--ant-color-text-secondary)]" />
      </Tooltip>
    </span>
  );
}

interface AliasEditModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  aliasEditing: MetadataFieldAlias | null;
  form: FormInstance;
  submitting: boolean;
  onSubmit: () => Promise<void>;
}

export function AliasEditModal({
  open,
  setOpen,
  aliasEditing,
  form,
  submitting,
  onSubmit,
}: AliasEditModalProps) {
  return (
    <Modal
      title={aliasEditing ? "编辑别名" : "新增别名"}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item
          name="alias_text"
          label={
            <FieldLabel
              text="alias_text"
              tip="文档里与「该字段」对应的标题/标签原文，用于在正文中定位并抽取其后的值。"
            />
          }
          rules={[{ required: true, message: "必填" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="match_mode"
          label={
            <FieldLabel
              text="match_mode"
              tip="exact：完全相等；contains：包含子串；regex：正则匹配，需写合法表达式。"
            />
          }
          rules={[{ required: true }]}
        >
          <Select options={MATCH_MODES.map((m) => ({ value: m }))} />
        </Form.Item>
        <Form.Item
          name="priority"
          label={
            <FieldLabel
              text="优先级"
              tip="同一字段下多条别名时的匹配顺序，数值越大越优先。"
            />
          }
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item
          name="status"
          label={<FieldLabel text="状态" tip="该别名是否参与匹配与抽取。" />}
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 1, label: "启用" },
              { value: 0, label: "禁用" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
