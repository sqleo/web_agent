"use client";

import { Form, Input, Modal } from "antd";
import type { FormInstance } from "antd";

interface RejectModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: FormInstance;
  submitting: boolean;
  onSubmit: () => Promise<void>;
}

export function RejectModal({
  open,
  setOpen,
  form,
  submitting,
  onSubmit,
}: RejectModalProps) {
  return (
    <Modal
      title="驳回"
      open={open}
      onCancel={() => !submitting && setOpen(false)}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      okText="确认驳回"
      okButtonProps={{ danger: true }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item
          name="review_comment"
          label="驳回原因"
          rules={[
            { required: true, message: "请填写驳回原因" },
            {
              validator: (_, v) => {
                if (v != null && String(v).trim().length < 2) {
                  return Promise.reject(new Error("至少 2 个字"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.TextArea rows={4} placeholder="请说明驳回原因，便于追溯" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
