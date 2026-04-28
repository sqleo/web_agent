"use client";

import { Modal, Form, Input, Typography } from "antd";
import type { FormInstance } from "antd";

interface CreateKnowledgeBaseModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  confirmLoading: boolean;
  form: FormInstance<{
    name: string;
    description?: string;
    thumbnail_url?: string;
  }>;
}

export function CreateKnowledgeBaseModal({
  open,
  onCancel,
  onOk,
  confirmLoading,
  form,
}: CreateKnowledgeBaseModalProps) {
  return (
    <Modal
      title="新建知识库"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="创建"
      confirmLoading={confirmLoading}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
        <Typography.Text code>POST /knowledge-bases</Typography.Text>
      </Typography.Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
          <Input placeholder="知识库名称" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="可选" />
        </Form.Item>
        <Form.Item name="thumbnail_url" label="缩略图 URL">
          <Input placeholder="可选，将显示在卡片封面" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
