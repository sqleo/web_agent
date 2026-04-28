"use client";

import { MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Tooltip, Typography } from "antd";
import type { FormInstance } from "antd";
import type { MetadataField } from "../types";

const VALUE_TYPES = ["text", "number", "list", "date"] as const;
const EXTRACT_MODES = ["field", "section"] as const;
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

interface FieldEditModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  fieldEditing: MetadataField | null;
  form: FormInstance;
  submitting: boolean;
  onSubmit: () => Promise<void>;
}

export function FieldEditModal({
  open,
  setOpen,
  fieldEditing,
  form,
  submitting,
  onSubmit,
}: FieldEditModalProps) {
  return (
    <Modal
      title={fieldEditing ? "编辑字段" : "新建字段"}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      width={fieldEditing ? 480 : 640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-2">
        {!fieldEditing && (
          <>
            <Form.Item
              name="field_key"
              label={
                <FieldLabel
                  text="field_key"
                  tip="入库后写入结构化 metadata 的键名，建议 snake_case，便于程序读取与后续检索。"
                />
              }
              rules={[{ required: true, message: "必填" }]}
            >
              <Input placeholder="snake_case，如 product_name" />
            </Form.Item>
            <Form.Item
              name="value_type"
              label={
                <FieldLabel
                  text="value_type"
                  tip="抽取结果的语义类型：text 文本、number 数字、list 列表、date 日期，供解析与校验使用。"
                />
              }
              rules={[{ required: true }]}
            >
              <Select options={VALUE_TYPES.map((x) => ({ value: x }))} />
            </Form.Item>
            <Form.Item
              name="extract_mode"
              label={
                <FieldLabel
                  text="extract_mode"
                  tip="field：从键值对/字段行抽取；section：从整段文本块中抽取，按文档结构选择。"
                />
              }
              rules={[{ required: true }]}
            >
              <Select options={EXTRACT_MODES.map((x) => ({ value: x }))} />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="field_name"
          label={
            <FieldLabel
              text="字段显示名"
              tip="界面与日志中展示给用户的名称，可与 field_key 不同，不参与程序键名。"
            />
          }
          rules={[{ required: true, message: "必填" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="priority"
          label={
            <FieldLabel
              text="优先级"
              tip="同作用域下多条规则时的排序权重，数值越大越优先匹配（具体以后端约定为准）。"
            />
          }
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item
          name="status"
          label={
            <FieldLabel text="状态" tip="1：启用，参与 metadata 抽取；0：禁用，忽略该字段配置。" />
          }
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 1, label: "启用" },
              { value: 0, label: "禁用" },
            ]}
          />
        </Form.Item>
        {!fieldEditing && (
          <Form.List name="aliases">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    className="mb-3 rounded-lg border border-[var(--ant-color-border-secondary)] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Typography.Text strong>别名 {index + 1}</Typography.Text>
                      {fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          移除
                        </Button>
                      ) : null}
                    </div>
                    <Form.Item
                      {...field}
                      name={[field.name, "alias_text"]}
                      label={
                        <FieldLabel
                          text="alias_text"
                          tip="文档里与「该字段」对应的标题/标签原文，用于在正文中定位并抽取其后的值。"
                        />
                      }
                    >
                      <Input placeholder="与文档中的标题文案对应" />
                    </Form.Item>
                    <Space className="w-full" size="middle" wrap>
                      <Form.Item
                        {...field}
                        name={[field.name, "match_mode"]}
                        label={
                          <FieldLabel
                            text="match_mode"
                            tip="exact：完全相等；contains：包含子串；regex：正则匹配，需写合法表达式。"
                          />
                        }
                        className="mb-0 flex-1 min-w-[140px]"
                      >
                        <Select options={MATCH_MODES.map((m) => ({ value: m }))} />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "status"]}
                        label={<FieldLabel text="状态" tip="该别名是否参与匹配与抽取。" />}
                        className="mb-0 w-[100px]"
                      >
                        <Select
                          options={[
                            { value: 1, label: "启用" },
                            { value: 0, label: "禁用" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "priority"]}
                        label={
                          <FieldLabel
                            text="优先级"
                            tip="同一字段下多条别名时的匹配顺序，数值越大越优先。"
                          />
                        }
                        className="mb-0 w-[100px]"
                      >
                        <InputNumber min={0} className="w-full" />
                      </Form.Item>
                    </Space>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ match_mode: "exact", status: 1, priority: 20 })}
                  block
                  icon={<PlusOutlined />}
                >
                  添加别名行
                </Button>
              </>
            )}
          </Form.List>
        )}
      </Form>
    </Modal>
  );
}
