"use client";

import { MinusCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  approveEntityCandidate,
  getEntityCandidates,
  getKnowledgeBases,
  getTargetEntitiesForMerge,
  mergeEntityCandidate,
  rejectEntityCandidate,
  type EntityCandidate,
  type EntityCandidateStatus,
  type GetEntityCandidatesQuery,
  type KnowledgeBase,
  type TargetEntityOption,
} from "@/api";
import { DashboardPageCard } from "@/components/dashboard-page-card";

const STATUS_OPTIONS: { value: EntityCandidateStatus; label: string }[] = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "merged", label: "已合并" },
];

function statusTag(status: string) {
  const s = status as EntityCandidateStatus;
  switch (s) {
    case "pending":
      return <Tag color="orange">待审核</Tag>;
    case "approved":
      return <Tag color="green">已通过</Tag>;
    case "rejected":
      return (
        <Tag
          style={{
            color: "#a8071a",
            background: "#fff2f0",
            borderColor: "#ffccc7",
          }}
        >
          已驳回
        </Tag>
      );
    case "merged":
      return <Tag color="blue">已合并</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
}

function formatConfidence(c: number | undefined): string {
  if (c == null || Number.isNaN(c)) return "—";
  if (c >= 0 && c <= 1) {
    return `${Math.round(c * 10000) / 100}%`;
  }
  return String(c);
}

function normalizeAliasList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const t = s?.trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function evidenceToText(ev: unknown): string {
  if (ev == null) return "—";
  if (typeof ev === "string") return ev;
  try {
    return JSON.stringify(ev, null, 2);
  } catch {
    return String(ev);
  }
}

function targetLabel(e: TargetEntityOption): string {
  const name = e.canonical_name?.trim() || e.name?.trim();
  const base = name || `#${e.id}`;
  return e.entity_type ? `${base} · ${e.entity_type}` : base;
}

export default function EntityCandidatesPage() {
  const [messageApi, messageContextHolder] = message.useMessage();

  const [filterForm] = Form.useForm<{
    status?: EntityCandidateStatus;
    biz_code?: string;
    knowledge_base_id?: number;
    file_id?: number;
    keyword?: string;
  }>();

  const [applied, setApplied] = useState<GetEntityCandidatesQuery>({
    page: 1,
    page_size: 20,
    status: "pending",
  });

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EntityCandidate[]>([]);
  const [total, setTotal] = useState(0);

  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<EntityCandidate | null>(null);

  const [approveForm] = Form.useForm<{
    canonical_name: string;
    entity_type: string;
    aliases: { text: string }[];
    review_comment?: string;
  }>();
  const [rejectForm] = Form.useForm<{ review_comment: string }>();
  const [mergeForm] = Form.useForm<{ target_entity_id: number; review_comment?: string }>();

  const [submitApprove, setSubmitApprove] = useState(false);
  const [submitReject, setSubmitReject] = useState(false);
  const [submitMerge, setSubmitMerge] = useState(false);

  const [mergeOptions, setMergeOptions] = useState<TargetEntityOption[]>([]);
  const [mergeSearchLoading, setMergeSearchLoading] = useState(false);
  const mergeSearchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadKb = useCallback(() => {
    setKbLoading(true);
    void getKnowledgeBases({ page: 1, page_size: 200 })
      .then((d) => setKbList(d.items))
      .catch((e) => messageApi.error(e instanceof Error ? e.message : "加载知识库失败"))
      .finally(() => setKbLoading(false));
  }, [messageApi]);

  useEffect(() => {
    loadKb();
  }, [loadKb]);

  useEffect(() => {
    return () => {
      if (mergeSearchTimer.current) {
        clearTimeout(mergeSearchTimer.current);
      }
    };
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntityCandidates(applied);
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "加载失败");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [applied, messageApi]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleSearch = async () => {
    const v = await filterForm.validateFields().catch(() => null);
    if (!v) return;
    setApplied({
      page: 1,
      page_size: applied.page_size ?? 20,
      status: v.status ?? "pending",
      biz_code: v.biz_code?.trim() || undefined,
      knowledge_base_id: v.knowledge_base_id,
      file_id: v.file_id,
      keyword: v.keyword?.trim() || undefined,
    });
  };

  const handleReset = () => {
    filterForm.setFieldsValue({
      status: "pending",
      biz_code: undefined,
      knowledge_base_id: undefined,
      file_id: undefined,
      keyword: undefined,
    });
    setApplied({
      page: 1,
      page_size: 20,
      status: "pending",
    });
  };

  const openApprove = (c: EntityCandidate) => {
    setActiveCandidate(c);
    approveForm.resetFields();
    approveForm.setFieldsValue({
      canonical_name: c.candidate_text,
      entity_type: c.entity_type,
      aliases: [{ text: c.candidate_text }],
      review_comment: undefined,
    });
    setApproveOpen(true);
  };

  const openReject = (c: EntityCandidate) => {
    setActiveCandidate(c);
    rejectForm.resetFields();
    setRejectOpen(true);
  };

  const fetchMergeTargets = useCallback(
    (c: EntityCandidate | null, keyword: string) => {
      if (!c) return;
      setMergeSearchLoading(true);
      void getTargetEntitiesForMerge({
        biz_code: c.biz_code ?? undefined,
        knowledge_base_id: c.knowledge_base_id ?? undefined,
        entity_type: c.entity_type,
        keyword: keyword.trim() || undefined,
        limit: 50,
      })
        .then((list) => setMergeOptions(list))
        .catch((e) => {
          messageApi.error(e instanceof Error ? e.message : "加载目标实体失败");
          setMergeOptions([]);
        })
        .finally(() => setMergeSearchLoading(false));
    },
    [messageApi]
  );

  const openMerge = (c: EntityCandidate) => {
    setActiveCandidate(c);
    mergeForm.resetFields();
    setMergeOptions([]);
    setMergeOpen(true);
    fetchMergeTargets(c, "");
  };

  const onMergeSearch = (kw: string) => {
    if (mergeSearchTimer.current) {
      clearTimeout(mergeSearchTimer.current);
    }
    mergeSearchTimer.current = setTimeout(() => {
      fetchMergeTargets(activeCandidate, kw);
    }, 320);
  };

  const submitApproveOk = async () => {
    if (!activeCandidate) return;
    try {
      const v = await approveForm.validateFields();
      const aliasStrings = normalizeAliasList(v.aliases.map((a) => a.text));
      if (aliasStrings.length === 0) {
        messageApi.error("请至少填写一个有效别名");
        return;
      }
      setSubmitApprove(true);
      await approveEntityCandidate(activeCandidate.id, {
        canonical_name: v.canonical_name.trim(),
        entity_type: v.entity_type.trim(),
        aliases: aliasStrings,
        review_comment: v.review_comment?.trim() || undefined,
      });
      messageApi.success("已通过并生成/归并实体");
      setApproveOpen(false);
      await loadList();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      messageApi.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitApprove(false);
    }
  };

  const submitRejectOk = async () => {
    if (!activeCandidate) return;
    try {
      const v = await rejectForm.validateFields();
      setSubmitReject(true);
      await rejectEntityCandidate(activeCandidate.id, {
        review_comment: v.review_comment.trim(),
      });
      messageApi.success("已驳回");
      setRejectOpen(false);
      await loadList();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      messageApi.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitReject(false);
    }
  };

  const submitMergeOk = async () => {
    if (!activeCandidate) return;
    try {
      const v = await mergeForm.validateFields();
      setSubmitMerge(true);
      await mergeEntityCandidate(activeCandidate.id, {
        target_entity_id: v.target_entity_id,
        review_comment: v.review_comment?.trim() || undefined,
      });
      messageApi.success("已合并到目标实体");
      setMergeOpen(false);
      await loadList();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      messageApi.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitMerge(false);
    }
  };

  const columns: ColumnsType<EntityCandidate> = [
    {
      title: "候选词",
      dataIndex: "candidate_text",
      width: 180,
      ellipsis: true,
    },
    { title: "实体类型", dataIndex: "entity_type", width: 120, ellipsis: true },
    {
      title: "频次",
      dataIndex: "frequency",
      width: 80,
      render: (n: number | undefined) => (n != null ? n : "—"),
    },
    {
      title: "置信度",
      dataIndex: "confidence",
      width: 88,
      render: (_: unknown, r: EntityCandidate) => formatConfidence(r.confidence),
    },
    {
      title: "业务线",
      dataIndex: "biz_code",
      width: 110,
      ellipsis: true,
      render: (t: string | null | undefined) => t ?? "—",
    },
    {
      title: "知识库 ID",
      dataIndex: "knowledge_base_id",
      width: 100,
      render: (id: number | null | undefined) => (id != null ? id : "—"),
    },
    {
      title: "来源文件",
      dataIndex: "file_id",
      width: 96,
      render: (id: number | null | undefined) => (id != null ? id : "—"),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (s: string) => statusTag(s),
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      width: 172,
      ellipsis: true,
    },
    {
      title: "操作",
      key: "op",
      width: 220,
      fixed: "right",
      render: (_, c) => (
        <Space size="small" wrap className="max-w-[220px]" onClick={(e) => e.stopPropagation()}>
          <Button
            type="primary"
            size="small"
            disabled={c.status !== "pending"}
            onClick={() => openApprove(c)}
          >
            通过
          </Button>
          <Button size="small" disabled={c.status !== "pending"} onClick={() => openMerge(c)}>
            合并
          </Button>
          <Button danger size="small" disabled={c.status !== "pending"} onClick={() => openReject(c)}>
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardPageCard>
      {messageContextHolder}
      <div className="mb-4">
        <Typography.Title level={4} className="!mb-1 !mt-0">
          候选实体审核
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0">
          面向运营与审核：批量处理候选实体，支持通过、驳回、合并至已有正式实体；操作后状态可追溯。
        </Typography.Paragraph>
      </div>

      <Card
        size="small"
        className="sticky top-0 z-20 mb-4 shadow-sm"
        styles={{ body: { paddingBottom: 12 } }}
      >
        <Form
          form={filterForm}
          layout="inline"
          className="flex flex-wrap gap-x-3 gap-y-2"
          initialValues={{
            status: "pending" as EntityCandidateStatus,
          }}
        >
          <Form.Item name="status" label="状态">
            <Select<EntityCandidateStatus> style={{ width: 132 }} options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="biz_code" label="业务线">
            <Input allowClear placeholder="biz_code" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="knowledge_base_id" label="知识库">
            <Select<number>
              allowClear
              showSearch
              optionFilterProp="label"
              loading={kbLoading}
              placeholder="选择知识库"
              style={{ width: 200 }}
              options={kbList.map((k) => ({
                value: k.id,
                label: k.name || `#${k.id}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="file_id" label="来源文件">
            <InputNumber min={1} placeholder="file_id" className="!w-[120px]" controls={false} />
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input allowClear placeholder="匹配候选词" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => void handleSearch()}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={() => void loadList()}>
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Spin spinning={loading}>
        <Table<EntityCandidate>
          rowKey="id"
          size="small"
          scroll={{ x: 1280 }}
          columns={columns}
          dataSource={rows}
          locale={{
            emptyText: (
              <Empty
                description="暂无候选实体。请先完成文档入库以生成候选。"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div className="max-w-4xl rounded-lg bg-[var(--ant-color-fill-quaternary)] px-4 py-3">
                <Descriptions column={1} size="small" labelStyle={{ width: 120 }}>
                  <Descriptions.Item label="证据 / evidence">
                    <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                      {evidenceToText(record.evidence)}
                    </pre>
                  </Descriptions.Item>
                  <Descriptions.Item label="审核备注">{record.review_comment ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="审核人">{record.reviewer ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="归并实体 ID">
                    {record.approved_entity_id != null ? record.approved_entity_id : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="来源文件 ID">{record.file_id != null ? record.file_id : "—"}</Descriptions.Item>
                </Descriptions>
              </div>
            ),
          }}
          pagination={{
            current: applied.page,
            pageSize: applied.page_size,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, page_size) => {
              setApplied((q) => ({ ...q, page, page_size: page_size ?? q.page_size }));
            },
          }}
        />
      </Spin>

      <Modal
        title="通过 — 生成 / 归并正式实体"
        open={approveOpen}
        onCancel={() => !submitApprove && setApproveOpen(false)}
        onOk={() => void submitApproveOk()}
        confirmLoading={submitApprove}
        okText="确认通过"
        cancelButtonProps={{ disabled: submitApprove }}
        width={560}
      >
        <Form form={approveForm} layout="vertical" className="mt-2">
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
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                    ) : null}
                  </Space>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ text: "" })}>
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

      <Modal
        title="驳回"
        open={rejectOpen}
        onCancel={() => !submitReject && setRejectOpen(false)}
        onOk={() => void submitRejectOk()}
        confirmLoading={submitReject}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        cancelButtonProps={{ disabled: submitReject }}
      >
        <Form form={rejectForm} layout="vertical" className="mt-2">
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

      <Modal
        title="合并到已有正式实体"
        open={mergeOpen}
        onCancel={() => !submitMerge && setMergeOpen(false)}
        onOk={() => void submitMergeOk()}
        confirmLoading={submitMerge}
        okText="确认合并"
        cancelButtonProps={{ disabled: submitMerge }}
        width={520}
      >
        <Typography.Paragraph type="secondary" className="!text-xs">
          仅展示与当前候选同作用域（业务线、知识库、实体类型一致）的正式实体；支持关键词搜索。
        </Typography.Paragraph>
        <Form form={mergeForm} layout="vertical" className="mt-2">
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
    </DashboardPageCard>
  );
}
