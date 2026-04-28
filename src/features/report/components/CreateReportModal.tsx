"use client";

import { Form, Input, Modal, Select } from "antd";
import type { CreateReportBody } from "../types";

interface CreateReportModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateReportBody) => Promise<void>;
  confirmLoading: boolean;
}

export function CreateReportModal({
  open,
  onCancel,
  onSubmit,
  confirmLoading,
}: CreateReportModalProps) {
  const [form] = Form.useForm<CreateReportBody>();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (e) {
      // 表单验证失败
    }
  };

  return (
    <Modal
      title="生成智能研报"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText="开始生成"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ model_id: "gpt-4o" }}
        className="mt-4"
      >
        <Form.Item
          label="研报主题"
          name="topic"
          rules={[{ required: true, message: "请输入研报主题" }]}
        >
          <Input placeholder="例如：2026年全球新能源汽车产业发展趋势报告" />
        </Form.Item>

        <Form.Item
          label="核心关键词"
          name="keywords"
          tooltip="输入关键词后按回车分割"
        >
          <Select mode="tags" placeholder="添加关键词" tokenSeparators={[",", "，"]} />
        </Form.Item>

        <Form.Item label="首选底座模型" name="model_id">
          <Select
            options={[
              { value: "gpt-4o", label: "GPT-4o (性能最佳)" },
              { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
              { value: "deepseek-v3", label: "DeepSeek V3 (性价比)" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
