"use client";

import {
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMetadataField,
  createMetadataFieldAlias,
  deleteMetadataField,
  deleteMetadataFieldAlias,
  getKnowledgeBases,
  getMetadataFields,
  patchMetadataField,
  patchMetadataFieldAlias,
  type GetMetadataFieldsQuery,
  type KnowledgeBase,
  type MetadataField,
  type MetadataFieldAlias,
  type MetadataMatchMode,
} from "@/api";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { MarkdownProse } from "@/app/(dashboard)/chat/markdown-prose";

type ScopeMode = "global" | "biz" | "kb";

const VALUE_TYPES = ["text", "number", "list", "date"] as const;
const EXTRACT_MODES = ["field", "section"] as const;
const MATCH_MODES = ["exact", "contains", "regex"] as const;

/** 表单项标签 + 悬停说明（解析含义） */
function FieldLabel({ text, tip }: { text: string; tip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {text}
      <Tooltip title={tip} placement="topLeft">
        <QuestionCircleOutlined
          className="cursor-help text-[0.85em] text-[var(--ant-color-text-secondary)]"
          tabIndex={0}
          aria-label={tip}
        />
      </Tooltip>
    </span>
  );
}

function scopeToQuery(
  mode: ScopeMode,
  bizCode: string,
  kbId: number | undefined,
  status: 0 | 1 | undefined
): GetMetadataFieldsQuery {
  const q: GetMetadataFieldsQuery = {};
  if (status !== undefined) {
    q.status = status;
  }
  if (mode === "global") {
    return q;
  }
  if (mode === "biz") {
    const t = bizCode.trim();
    if (t) q.biz_code = t;
    return q;
  }
  if (kbId != null) {
    q.knowledge_base_id = kbId;
  }
  return q;
}

function scopeReady(mode: ScopeMode, bizCode: string, kbId: number | undefined): boolean {
  if (mode === "biz") {
    return bizCode.trim().length > 0;
  }
  if (mode === "kb") {
    return kbId != null;
  }
  return true;
}

export default function KnowledgeConfigPage() {
  const [messageApi, messageContextHolder] = message.useMessage();

  const [scopeMode, setScopeMode] = useState<ScopeMode>("kb");
  const [bizCode, setBizCode] = useState("");
  const [kbId, setKbId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<0 | 1 | undefined>(1);

  const [kbOptions, setKbOptions] = useState<KnowledgeBase[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState<MetadataField[]>([]);
  const [total, setTotal] = useState(0);

  const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
  const [apiMd, setApiMd] = useState("");
  const [apiMdLoading, setApiMdLoading] = useState(false);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldEditing, setFieldEditing] = useState<MetadataField | null>(null);
  const [fieldForm] = Form.useForm<{
    field_key: string;
    field_name: string;
    value_type: (typeof VALUE_TYPES)[number];
    extract_mode: (typeof EXTRACT_MODES)[number];
    status: number;
    priority: number;
    aliases?: { alias_text: string; match_mode: MetadataMatchMode; status: number; priority: number }[];
  }>();
  const [fieldSubmitting, setFieldSubmitting] = useState(false);

  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [aliasFieldId, setAliasFieldId] = useState<number | null>(null);
  const [aliasEditing, setAliasEditing] = useState<MetadataFieldAlias | null>(null);
  const [aliasForm] = Form.useForm<{
    alias_text: string;
    match_mode: MetadataMatchMode;
    status: number;
    priority: number;
  }>();
  const [aliasSubmitting, setAliasSubmitting] = useState(false);

  const listQuery = useMemo(
    () => scopeToQuery(scopeMode, bizCode, kbId, statusFilter),
    [scopeMode, bizCode, kbId, statusFilter]
  );

  const canQuery = useMemo(() => scopeReady(scopeMode, bizCode, kbId), [scopeMode, bizCode, kbId]);

  useEffect(() => {
    let cancelled = false;
    setKbLoading(true);
    void getKnowledgeBases({ page: 1, page_size: 200 })
      .then((data) => {
        if (!cancelled) {
          setKbOptions(data.items);
          if (kbId == null && data.items.length > 0) {
            setKbId(data.items[0].id);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          messageApi.error(e instanceof Error ? e.message : "加载知识库列表失败");
        }
      })
      .finally(() => {
        if (!cancelled) setKbLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [messageApi]);

  const loadList = useCallback(async () => {
    if (!canQuery) {
      setRows([]);
      setTotal(0);
      return;
    }
    setListLoading(true);
    try {
      const data = await getMetadataFields(listQuery);
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "加载失败");
      setRows([]);
      setTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [canQuery, listQuery, messageApi]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openApiDrawer = () => {
    setApiDrawerOpen(true);
    if (apiMd) return;
    setApiMdLoading(true);
    void fetch("/knowledge-config/api.md")
      .then((r) => {
        if (!r.ok) throw new Error(`加载文档失败（${r.status}）`);
        return r.text();
      })
      .then((t) => setApiMd(t))
      .catch((e) => messageApi.error(e instanceof Error ? e.message : "加载文档失败"))
      .finally(() => setApiMdLoading(false));
  };

  const openCreateField = () => {
    if (!canQuery) {
      messageApi.warning(
        scopeMode === "biz" ? "请先填写业务编码" : scopeMode === "kb" ? "请先选择知识库" : "请选择作用域"
      );
      return;
    }
    setFieldEditing(null);
    fieldForm.resetFields();
    fieldForm.setFieldsValue({
      value_type: "text",
      extract_mode: "field",
      status: 1,
      priority: 10,
      aliases: [{ alias_text: "", match_mode: "exact", status: 1, priority: 10 }],
    });
    setFieldModalOpen(true);
  };

  const openEditField = (row: MetadataField) => {
    setFieldEditing(row);
    fieldForm.setFieldsValue({
      field_key: row.field_key,
      field_name: row.field_name,
      value_type: row.value_type,
      extract_mode: row.extract_mode,
      status: row.status,
      priority: row.priority,
    });
    setFieldModalOpen(true);
  };

  const submitField = async () => {
    try {
      const v = await fieldForm.validateFields();
      setFieldSubmitting(true);
      if (fieldEditing) {
        await patchMetadataField(fieldEditing.id, {
          field_name: v.field_name,
          priority: v.priority,
          status: v.status,
        });
        messageApi.success("已更新字段");
      } else {
        const bodyScope: { biz_code?: string; knowledge_base_id?: number } = {};
        if (scopeMode === "biz") {
          bodyScope.biz_code = bizCode.trim();
        } else if (scopeMode === "kb" && kbId != null) {
          bodyScope.knowledge_base_id = kbId;
        }
        const aliases = (v.aliases ?? [])
          .filter((a) => a.alias_text?.trim())
          .map((a) => ({
            alias_text: a.alias_text.trim(),
            match_mode: a.match_mode,
            status: a.status,
            priority: a.priority,
          }));
        await createMetadataField({
          ...bodyScope,
          field_key: v.field_key.trim(),
          field_name: v.field_name.trim(),
          value_type: v.value_type,
          extract_mode: v.extract_mode,
          status: v.status,
          priority: v.priority,
          aliases,
        });
        messageApi.success("已新建字段");
      }
      setFieldModalOpen(false);
      await loadList();
    } catch (e) {
      if (e instanceof Error) messageApi.error(e.message);
    } finally {
      setFieldSubmitting(false);
    }
  };

  const handleDeleteField = async (id: number) => {
    try {
      await deleteMetadataField(id);
      messageApi.success("已删除字段");
      await loadList();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "删除失败");
    }
  };

  const openCreateAlias = (fieldId: number) => {
    setAliasFieldId(fieldId);
    setAliasEditing(null);
    aliasForm.resetFields();
    aliasForm.setFieldsValue({
      match_mode: "exact",
      status: 1,
      priority: 10,
    });
    setAliasModalOpen(true);
  };

  const openEditAlias = (fieldId: number, a: MetadataFieldAlias) => {
    setAliasFieldId(fieldId);
    setAliasEditing(a);
    aliasForm.setFieldsValue({
      alias_text: a.alias_text,
      match_mode: a.match_mode,
      status: a.status,
      priority: a.priority,
    });
    setAliasModalOpen(true);
  };

  const submitAlias = async () => {
    if (aliasFieldId == null) return;
    try {
      const v = await aliasForm.validateFields();
      setAliasSubmitting(true);
      if (aliasEditing) {
        await patchMetadataFieldAlias(aliasEditing.id, {
          alias_text: v.alias_text.trim(),
          match_mode: v.match_mode,
          status: v.status,
          priority: v.priority,
        });
        messageApi.success("已更新别名");
      } else {
        await createMetadataFieldAlias(aliasFieldId, {
          alias_text: v.alias_text.trim(),
          match_mode: v.match_mode,
          status: v.status,
          priority: v.priority,
        });
        messageApi.success("已新增别名");
      }
      setAliasModalOpen(false);
      await loadList();
    } catch (e) {
      if (e instanceof Error) messageApi.error(e.message);
    } finally {
      setAliasSubmitting(false);
    }
  };

  const handleDeleteAlias = async (aliasId: number) => {
    try {
      await deleteMetadataFieldAlias(aliasId);
      messageApi.success("已删除别名");
      await loadList();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "删除失败");
    }
  };

  const columns: ColumnsType<MetadataField> = [
    { title: "field_key", dataIndex: "field_key", width: 160, ellipsis: true },
    { title: "字段名", dataIndex: "field_name", width: 140, ellipsis: true },
    {
      title: "值类型",
      dataIndex: "value_type",
      width: 88,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: "抽取",
      dataIndex: "extract_mode",
      width: 96,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    { title: "优先级", dataIndex: "priority", width: 80 },
    {
      title: "状态",
      dataIndex: "status",
      width: 80,
      render: (s: number) => (s === 1 ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, row) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditField(row)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该字段及全部别名？" onConfirm={() => void handleDeleteField(row.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DashboardPageCard>
      {messageContextHolder}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography.Title level={4} className="!mb-1 !mt-0 flex items-center gap-2">
            <BookOutlined />
            知识库配置
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0">
            管理 metadata 抽取字段与别名；作用域与后端约定一致（全局 / 业务 / 知识库）。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<FileTextOutlined />} onClick={openApiDrawer}>
            查看 API 文档
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadList()} disabled={!canQuery}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateField}>
            新建字段
          </Button>
        </Space>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--ant-color-text-secondary)]">作用域</span>
        <Select<ScopeMode>
          value={scopeMode}
          onChange={(m) => setScopeMode(m)}
          style={{ width: 120 }}
          options={[
            { value: "global", label: "全局" },
            { value: "biz", label: "业务" },
            { value: "kb", label: "知识库" },
          ]}
        />
        {scopeMode === "biz" && (
          <Input
            placeholder="业务编码 biz_code"
            value={bizCode}
            onChange={(e) => setBizCode(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        )}
        {scopeMode === "kb" && (
          <Select<number>
            placeholder="选择知识库"
            loading={kbLoading}
            value={kbId}
            onChange={setKbId}
            style={{ minWidth: 220 }}
            options={kbOptions.map((k) => ({ value: k.id, label: k.name || `知识库 #${k.id}` }))}
            showSearch
            optionFilterProp="label"
          />
        )}
        <span className="text-sm text-[var(--ant-color-text-secondary)]">状态</span>
        <Select<0 | 1 | "all">
          value={statusFilter === undefined ? "all" : statusFilter}
          onChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
          style={{ width: 100 }}
          options={[
            { value: "all", label: "全部" },
            { value: 1, label: "启用" },
            { value: 0, label: "禁用" },
          ]}
        />
        {!canQuery && (
          <Typography.Text type="warning">
            {scopeMode === "biz" ? "请填写业务编码后加载" : "请选择知识库后加载"}
          </Typography.Text>
        )}
        {canQuery && (
          <Typography.Text type="secondary">
            共 {total} 条
          </Typography.Text>
        )}
      </div>

      <Spin spinning={listLoading}>
        <Table<MetadataField>
          rowKey="id"
          size="small"
          scroll={{ x: 960 }}
          columns={columns}
          dataSource={canQuery ? rows : []}
          pagination={false}
          locale={{
            emptyText: !canQuery ? "请先完成作用域条件" : "暂无字段配置",
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="px-2 py-1">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Typography.Text strong>别名</Typography.Text>
                  <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => openCreateAlias(record.id)}>
                    添加别名
                  </Button>
                </div>
                <Table<MetadataFieldAlias>
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={record.aliases ?? []}
                  columns={[
                    { title: "alias_text", dataIndex: "alias_text" },
                    {
                      title: "match_mode",
                      dataIndex: "match_mode",
                      width: 110,
                      render: (t: string) => <Tag>{t}</Tag>,
                    },
                    { title: "优先级", dataIndex: "priority", width: 80 },
                    {
                      title: "状态",
                      dataIndex: "status",
                      width: 72,
                      render: (s: number) => (s === 1 ? "启用" : "禁用"),
                    },
                    {
                      title: "操作",
                      key: "a",
                      width: 140,
                      render: (_, a) => (
                        <Space size="small">
                          <Button
                            type="link"
                            size="small"
                            onClick={() => openEditAlias(record.id, a)}
                          >
                            编辑
                          </Button>
                          <Popconfirm title="删除该别名？" onConfirm={() => void handleDeleteAlias(a.id)}>
                            <Button type="link" size="small" danger>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          }}
        />
      </Spin>

      <Modal
        title={fieldEditing ? "编辑字段" : "新建字段"}
        open={fieldModalOpen}
        onCancel={() => setFieldModalOpen(false)}
        onOk={() => void submitField()}
        confirmLoading={fieldSubmitting}
        width={fieldEditing ? 480 : 640}
        destroyOnHidden
      >
        <Form form={fieldForm} layout="vertical" className="mt-2">
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
                          <Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>
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
                  <Button type="dashed" onClick={() => add({ match_mode: "exact", status: 1, priority: 20 })} block icon={<PlusOutlined />}>
                    添加别名行
                  </Button>
                </>
              )}
            </Form.List>
          )}
        </Form>
      </Modal>

      <Modal
        title={aliasEditing ? "编辑别名" : "新增别名"}
        open={aliasModalOpen}
        onCancel={() => setAliasModalOpen(false)}
        onOk={() => void submitAlias()}
        confirmLoading={aliasSubmitting}
        destroyOnHidden
      >
        <Form form={aliasForm} layout="vertical" className="mt-2">
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

      <Drawer
        title="Metadata 字段 API 说明"
        width={560}
        open={apiDrawerOpen}
        onClose={() => setApiDrawerOpen(false)}
        styles={{ body: { paddingTop: 12 } }}
      >
        <Spin spinning={apiMdLoading}>
          {apiMd ? <MarkdownProse markdown={apiMd} /> : !apiMdLoading ? <Typography.Text type="secondary">暂无内容</Typography.Text> : null}
        </Spin>
      </Drawer>
    </DashboardPageCard>
  );
}
