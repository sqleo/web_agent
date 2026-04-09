"use client";

import { Card, Spin, Switch, Table, Typography, message, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type AgentToolRow, getAgentTools, putAgentToolsSettings } from "@/api/agent-tools";
import { DashboardPageCard } from "@/components/dashboard-page-card";

type RowState = AgentToolRow & { key: string };

function resolveToolName(t: AgentToolRow): string {
  if (typeof t.name === "string" && t.name) {
    return t.name;
  }
  const alt = t.tool_name;
  if (typeof alt === "string" && alt) {
    return alt;
  }
  return "";
}

function toEnabledNames(list: RowState[]): string[] {
  return list
    .filter((r) => r.enabled)
    .map((r) => r.name)
    .filter((n): n is string => Boolean(n));
}

export default function AiToolPage() {
  const { token } = theme.useToken();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<RowState[]>([]);
  const rowsRef = useRef<RowState[]>([]);
  rowsRef.current = rows;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAgentTools();
      const next = list.map((t, i) => {
        const name = resolveToolName(t);
        return {
          ...t,
          key: name || `tool-${i}`,
          name,
        };
      });
      setRows(next);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "加载工具列表失败");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistToggle = useCallback(
    async (name: string, checked: boolean) => {
      const prevRows = rowsRef.current;
      const nextRows = prevRows.map((r) =>
        r.name === name ? { ...r, enabled: checked } : r
      );
      const enabledNames = toEnabledNames(nextRows);

      setRows(nextRows);
      setSaving(true);
      try {
        await putAgentToolsSettings({ enabled_tools: enabledNames });
      } catch (e) {
        setRows(prevRows);
        messageApi.error(e instanceof Error ? e.message : "保存失败");
      } finally {
        setSaving(false);
      }
    },
    [messageApi]
  );

  const columns: ColumnsType<RowState> = useMemo(
    () => [
      {
        title: "工具名",
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (text: string) => text || "—",
      },
      {
        title: "说明",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        responsive: ["md"],
        render: (v: unknown) =>
          v === undefined || v === null || v === "" ? "—" : String(v),
      },
      {
        title: "启用",
        key: "enabled",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Switch
            checked={record.enabled}
            disabled={!record.name || loading || saving}
            onChange={(checked) => {
              if (record.name) {
                void persistToggle(record.name, checked);
              }
            }}
          />
        ),
      },
    ],
    [loading, persistToggle, saving]
  );

  return (
    <DashboardPageCard>
      {messageContextHolder}
      <div className="mb-4">
        <Typography.Title level={4} className="!mb-1 !mt-0">
          Agent 工具
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0 text-sm">
          查看已注册工具并配置用户级开关。未保存偏好时默认<strong>全部开启</strong>；切换开关将<strong>立即保存</strong>。
        </Typography.Paragraph>
      </div>

      <Card
        variant="borderless"
        style={{
          background: token.colorFillSecondary,
        }}
      >
        <Spin spinning={loading}>
          <Table<RowState>
            size="middle"
            rowKey="key"
            columns={columns}
            dataSource={rows}
            pagination={false}
            locale={{ emptyText: loading ? "加载中…" : "暂无工具数据" }}
          />
        </Spin>
      </Card>
    </DashboardPageCard>
  );
}
