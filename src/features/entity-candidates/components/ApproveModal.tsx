"use client";

import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space, Typography } from "antd";
import type { FormInstance } from "antd";

interface ApproveModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: FormInstance;
  submitting: boolean;
  onSubmit: () => Promise<void>;
}

export function ApproveModal({
  open,
  setOpen,
  form,
  submitting,
  onSubmit,
}: ApproveModalProps) {
  return (
    <Modal
      title="通过 — 生成 / 归并正式实体"
      open={open}
      onCancel={() => !submitting && setOpen(false)}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      okText="确认通过"
      cancelButtonProps={{ disabled: submitting }}
      width={560}
    >
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item
          name="canonical_name"
          label="标准名 canonical_name"
          rules={[{ required: true, message: "必填" }]}
        >
          <Input placeholder="正式实体标准名" />
        </Form.Item>
        <Form.Item
          name="entity_type"
          label="实体类型 entity_type"
          rules={[{ required: true, message: "必填" }]}
        >
          <Input placeholder="类型标识" />
        </Form.Item>
        <Form.List name="aliases">
          {(fields, { add, remove }) => (
            <>
              <Typography.Text type="secondary" className="mb-2 block text-xs">
                别名将去重、去首尾空白后提交
              </Typography.Text>
              {fields.map((field, index) => (
                <Space key={field.key} className="mb-2 w-full" align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, "text"]}
                    rules={[{ required: true, message: "填写别名或删除该行" }]}
                    className="mb-0 flex-1"
                  >
                    <Input placeholder={`别名 ${index + 1}`} />
                  </Form.Item>
                  {fields.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  ) : null}
                </Space>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({ text: "" })}
              >
                添加别名
              </Button>
            </>
          )}
        </Form.List>
        <Form.Item name="review_comment" label="备注（可选）">
          <Input.TextArea rows={2} placeholder="审核说明" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
