"use client";

import { Card, Table, Tag, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import type { MonitorRequestRow } from "../types";

interface RecentRequestsTableProps {
  recent: MonitorRequestRow[];
}

export function RecentRequestsTable({ recent }: RecentRequestsTableProps) {
  const { token } = theme.useToken();

  const requestTableColumns: ColumnsType<MonitorRequestRow> = useMemo(
    () => [
      { title: "请求 ID", dataIndex: "request_id", key: "request_id", ellipsis: true, width: 220 },
      { title: "模型", dataIndex: "model", key: "model", width: 160, ellipsis: true },
      {
        title: "输入 Tokens",
        dataIndex: "input_tokens",
        key: "input_tokens",
        width: 110,
        render: (v: unknown) => (v === undefined || v === null ? "—" : String(v)),
      },
      {
        title: "输出 Tokens",
        dataIndex: "output_tokens",
        key: "output_tokens",
        width: 110,
        render: (v: unknown) => (v === undefined || v === null ? "—" : String(v)),
      },
      {
        title: "延迟 (ms)",
        dataIndex: "latency_ms",
        key: "latency_ms",
        width: 100,
        render: (v: unknown) => (v === undefined || v === null ? "—" : String(v)),
      },
      {
        title: "成功",
        dataIndex: "success",
        key: "success",
        width: 72,
        render: (v: unknown) =>
          v === undefined ? (
            "—"
          ) : (
            <Tag color={v ? "success" : "error"}>{v ? "是" : "否"}</Tag>
          ),
      },
      {
        title: "时间",
        dataIndex: "created_at",
        key: "created_at",
        ellipsis: true,
        render: (v: unknown) => (v === undefined || v === null ? "—" : String(v)),
      },
    ],
    []
  );

  return (
    <Card
      title="最近请求"
      variant="borderless"
      className="mt-4"
      style={{ background: token.colorFillSecondary }}
    >
      <Table<MonitorRequestRow>
        size="small"
        rowKey={(r) => r.request_id}
        columns={requestTableColumns}
        dataSource={recent}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 900 }}
      />
    </Card>
  );
}
