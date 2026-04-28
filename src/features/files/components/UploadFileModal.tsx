"use client";

import { Modal, Form, Button, Select, Input, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

interface UploadFileModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  confirmLoading: boolean;
  form: FormInstance<{
    folder_id?: number;
    project_code?: string;
    source?: string;
  }>;
  uploadList: UploadFile[];
  setUploadList: (list: UploadFile[]) => void;
  folderSelectOptions: { label: string; value: number }[];
}

export function UploadFileModal({
  open,
  onCancel,
  onOk,
  confirmLoading,
  form,
  uploadList,
  setUploadList,
  folderSelectOptions,
}: UploadFileModalProps) {
  return (
    <Modal
      title="上传文件"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          source: "manual_upload",
        }}
      >
        <Form.Item label="文件" required>
          <Upload
            maxCount={1}
            beforeUpload={() => false}
            fileList={uploadList}
            onChange={({ fileList }) => setUploadList(fileList)}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="目录" name="folder_id">
          <Select allowClear options={folderSelectOptions} placeholder="不选则上传到根目录" />
        </Form.Item>
        <Form.Item label="项目标识" name="project_code">
          <Input placeholder="可选" />
        </Form.Item>
        <Form.Item label="来源 source" name="source">
          <Input placeholder="默认 manual_upload" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
