"use client";

import { Modal, Form, Input, Select } from "antd";
import type { FormInstance } from "antd";

interface CreateFolderModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  confirmLoading: boolean;
  form: FormInstance<{
    name: string;
    parent_folder_id?: number;
    project_code?: string;
    description?: string;
  }>;
  folderSelectOptions: { label: string; value: number }[];
}

export function CreateFolderModal({
  open,
  onCancel,
  onOk,
  confirmLoading,
  form,
  folderSelectOptions,
}: CreateFolderModalProps) {
  return (
    <Modal
      title="新建文件夹"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      destroyOnHidden
    >
      <Form layout="vertical" form={form}>
        <Form.Item label="名称" name="name" rules={[{ required: true, message: "请输入文件夹名称" }]}>
          <Input placeholder="例如：需求文档" />
        </Form.Item>
        <Form.Item label="父级文件夹" name="parent_folder_id">
          <Select allowClear options={folderSelectOptions} placeholder="不选则创建在根目录" />
        </Form.Item>
        <Form.Item label="项目标识" name="project_code">
          <Input placeholder="可选" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea placeholder="可选" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
