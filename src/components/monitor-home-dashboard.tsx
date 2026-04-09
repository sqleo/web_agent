"use client";

import { Area, Column, Line, Pie } from "@ant-design/charts";
import {
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Card, Col, Empty, Row, Segmented, Spin, Table, Tag, Typography, message, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type MonitorErrorItem,
  type MonitorModelStat,
  type MonitorOverview,
  type MonitorPeriod,
  type MonitorRequestRow,
  type MonitorTrendPoint,
  getMonitorErrors,
  getMonitorModels,
  getMonitorOverview,
  getMonitorRecentRequests,
  getMonitorTrendLatency,
  getMonitorTrendRequests,
  getMonitorTrendSuccessRate,
  getMonitorTrendTokens,
} from "@/api/monitor";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { mapTrendPointsForAxis } from "@/lib/monitor-chart-time";

const PERIOD_OPTIONS: { label: string; value: MonitorPeriod }[] = [
  { label: "实时", value: "realtime" },
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
];

const CHART_H = 300;

const TOKEN_CATEGORY_LABEL: Record<string, string> = {
  input_cache_hit: "输入缓存命中",
  input_cache_miss: "输入缓存未命中",
  output_tokens: "输出 Tokens",
};
const TOKEN_CATEGORY_COLOR: Record<string, string> = {
  输入缓存命中: "#52c41a",
  输入缓存未命中: "#faad14",
  "输出 Tokens": "#1677ff",
};

function formatSuccessRate(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  if (v >= 0 && v <= 1) return `${(v * 100).toFixed(2)}%`;
  return `${Number(v).toFixed(2)}%`;
}

function modelChartData(stats: MonitorModelStat[]) {
  const rows: { model: string; metric: string; value: number }[] = [];
  for (const m of stats) {
    rows.push(
      { model: m.model, metric: "请求数", value: m.requests },
      { model: m.model, metric: "Tokens", value: m.tokens }
    );
  }
  return rows;
}

export function MonitorHomeDashboard() {
  const { token } = theme.useToken();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [period, setPeriod] = useState<MonitorPeriod>("day");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<MonitorOverview>({});
  const [reqTrend, setReqTrend] = useState<MonitorTrendPoint[]>([]);
  const [tokenTrend, setTokenTrend] = useState<MonitorTrendPoint[]>([]);
  const [latencyTrend, setLatencyTrend] = useState<MonitorTrendPoint[]>([]);
  const [successTrend, setSuccessTrend] = useState<MonitorTrendPoint[]>([]);
  const [errors, setErrors] = useState<MonitorErrorItem[]>([]);
  const [models, setModels] = useState<MonitorModelStat[]>([]);
  const [recent, setRecent] = useState<MonitorRequestRow[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        getMonitorOverview(),
        getMonitorTrendRequests(period),
        getMonitorTrendTokens(period),
        getMonitorTrendLatency(period),
        getMonitorTrendSuccessRate(period),
        getMonitorErrors(),
        getMonitorModels(),
        getMonitorRecentRequests(20),
      ]);

      const warnPartial = settled.some((s) => s.status === "rejected");
      if (warnPartial) {
        messageApi.warning("部分监控数据加载失败，请检查网络或接口");
      }

      if (settled[0].status === "fulfilled") setOverview(settled[0].value);
      if (settled[1].status === "fulfilled") setReqTrend(settled[1].value);
      if (settled[2].status === "fulfilled") setTokenTrend(settled[2].value);
      if (settled[3].status === "fulfilled") setLatencyTrend(settled[3].value);
      if (settled[4].status === "fulfilled") setSuccessTrend(settled[4].value);
      if (settled[5].status === "fulfilled") setErrors(settled[5].value);
      if (settled[6].status === "fulfilled") setModels(settled[6].value);
      if (settled[7].status === "fulfilled") setRecent(settled[7].value);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "加载监控数据失败");
    } finally {
      setLoading(false);
    }
  }, [messageApi, period]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const modelColumnData = useMemo(() => modelChartData(models), [models]);

  const reqTrendAxis = useMemo(
    () => mapTrendPointsForAxis(reqTrend, period),
    [reqTrend, period]
  );
  const tokenTrendAxis = useMemo(
    () =>
      mapTrendPointsForAxis(tokenTrend, period).map((p) => ({
        ...p,
        category: TOKEN_CATEGORY_LABEL[p.category] ?? p.category,
      })),
    [tokenTrend, period]
  );
  const latencyTrendAxis = useMemo(
    () => mapTrendPointsForAxis(latencyTrend, period),
    [latencyTrend, period]
  );
  const successTrendAxis = useMemo(
    () => mapTrendPointsForAxis(successTrend, period),
    [successTrend, period]
  );

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
    <DashboardPageCard>
      {messageContextHolder}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Typography.Title level={4} className="!mb-0 !mt-0 !font-semibold">
          监控概览
        </Typography.Title>
        <Segmented<MonitorPeriod>
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(v) => setPeriod(v)}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" style={{ background: token.colorFillSecondary }}>
              <Typography.Text type="secondary" className="text-xs">
                总请求
              </Typography.Text>
              <div className="mt-1 flex items-baseline gap-2">
                <Typography.Title level={3} className="!m-0 !font-semibold">
                  {overview.total_requests ?? "—"}
                </Typography.Title>
                <ApiOutlined style={{ color: token.colorPrimary }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" style={{ background: token.colorFillSecondary }}>
              <Typography.Text type="secondary" className="text-xs">
                总 Tokens
              </Typography.Text>
              <div className="mt-1 flex items-baseline gap-2">
                <Typography.Title level={3} className="!m-0 !font-semibold">
                  {overview.total_tokens ?? "—"}
                </Typography.Title>
                <ThunderboltOutlined style={{ color: token.colorWarning }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" style={{ background: token.colorFillSecondary }}>
              <Typography.Text type="secondary" className="text-xs">
                成功率
              </Typography.Text>
              <div className="mt-1 flex items-baseline gap-2">
                <Typography.Title level={3} className="!m-0 !font-semibold">
                  {formatSuccessRate(overview.success_rate as number | undefined)}
                </Typography.Title>
                <CheckCircleOutlined style={{ color: token.colorSuccess }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" style={{ background: token.colorFillSecondary }}>
              <Typography.Text type="secondary" className="text-xs">
                平均延迟
              </Typography.Text>
              <div className="mt-1 flex items-baseline gap-2">
                <Typography.Title level={3} className="!m-0 !font-semibold">
                  {overview.avg_latency_ms !== undefined && overview.avg_latency_ms !== null
                    ? `${overview.avg_latency_ms} ms`
                    : "—"}
                </Typography.Title>
                <ClockCircleOutlined style={{ color: token.colorInfo }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Typography.Text type="secondary" className="mb-3 mt-6 block text-xs">
          时间范围：{PERIOD_OPTIONS.find((p) => p.value === period)?.label}（粒度见接口说明）
        </Typography.Text>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="请求量趋势" variant="borderless" style={{ background: token.colorFillSecondary }}>
              {reqTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <Line
                  data={reqTrendAxis}
                  xField="date"
                  yField="value"
                  seriesField="category"
                  height={CHART_H}
                  autoFit
                  legend={{ position: "top" }}
                  color={[token.colorPrimary, token.colorSuccess, token.colorWarning]}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Token 用量（堆叠）" variant="borderless" style={{ background: token.colorFillSecondary }}>
              {tokenTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <Area
                  data={tokenTrendAxis}
                  xField="date"
                  yField="value"
                  seriesField="category"
                  stack
                  height={CHART_H}
                  autoFit
                  legend={{ position: "top" }}
                  color={(datum: { category?: string }) =>
                    TOKEN_CATEGORY_COLOR[datum.category ?? ""] ?? "#8c8c8c"
                  }
                />
              )}
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="延迟趋势" variant="borderless" style={{ background: token.colorFillSecondary }}>
              {latencyTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <Line
                  data={latencyTrendAxis}
                  xField="date"
                  yField="value"
                  seriesField="category"
                  height={CHART_H}
                  autoFit
                  legend={{ position: "top" }}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="成功率趋势" variant="borderless" style={{ background: token.colorFillSecondary }}>
              {successTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <Line
                  data={successTrendAxis}
                  xField="date"
                  yField="value"
                  seriesField="category"
                  height={CHART_H}
                  autoFit
                  legend={{ position: "top" }}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="错误类型分布" variant="borderless" style={{ background: token.colorFillSecondary }}>
              {errors.length === 0 ? (
                <Empty description="暂无错误数据" />
              ) : (
                <Pie
                  data={errors}
                  angleField="value"
                  colorField="type"
                  height={CHART_H}
                  autoFit
                  label={{
                    text: (d: MonitorErrorItem) => `${d.type}: ${d.value}`,
                    style: { fontSize: 11 },
                  }}
                  tooltip={{ title: "type", items: [{ field: "value" }] }}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title="模型维度（请求 / Tokens）" variant="borderless" style={{ background: token.colorFillSecondary }}>
              {modelColumnData.length === 0 ? (
                <Empty description="暂无模型数据" />
              ) : (
                <Column
                  data={modelColumnData}
                  xField="model"
                  yField="value"
                  seriesField="metric"
                  group
                  height={CHART_H}
                  autoFit
                  legend={{ position: "top" }}
                />
              )}
            </Card>
          </Col>
        </Row>

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
      </Spin>
    </DashboardPageCard>
  );
}
