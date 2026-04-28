"use client";

import { Button, Descriptions, Empty, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { EntityCandidate, EntityCandidateStatus } from "../types";

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

function evidenceToText(ev: unknown): string {
  if (ev == null) return "—";
  if (typeof ev === "string") return ev;
  try {
    return JSON.stringify(ev, null, 2);
  } catch {
    return String(ev);
  }
}

interface CandidatesTableProps {
  rows: EntityCandidate[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPaginationChange: (page: number, pageSize: number) => void;
  openApprove: (c: EntityCandidate) => void;
  openReject: (c: EntityCandidate) => void;
  openMerge: (c: EntityCandidate) => void;
}

export function CandidatesTable({
  rows,
  loading,
  total,
  page,
  pageSize,
  onPaginationChange,
  openApprove,
  openReject,
  openMerge,
}: CandidatesTableProps) {
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
    <Table<EntityCandidate>
      rowKey="id"
      size="small"
      scroll={{ x: 1280 }}
      columns={columns}
      dataSource={rows}
      loading={loading}
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
        current: page,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (t) => `共 ${t} 条`,
        onChange: onPaginationChange,
      }}
    />
  );
}
