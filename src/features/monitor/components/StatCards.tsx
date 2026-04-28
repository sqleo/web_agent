"use client";

import { ApiOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Card, Col, Row, Typography, theme } from "antd";
import type { MonitorOverview } from "../types";

interface StatCardsProps {
  overview: MonitorOverview;
  loading: boolean;
}

function formatSuccessRate(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  if (v >= 0 && v <= 1) return `${(v * 100).toFixed(2)}%`;
  return `${Number(v).toFixed(2)}%`;
}

export function StatCards({ overview, loading }: StatCardsProps) {
  const { token } = theme.useToken();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card variant="borderless" style={{ background: token.colorFillSecondary }} loading={loading}>
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
        <Card variant="borderless" style={{ background: token.colorFillSecondary }} loading={loading}>
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
        <Card variant="borderless" style={{ background: token.colorFillSecondary }} loading={loading}>
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
        <Card variant="borderless" style={{ background: token.colorFillSecondary }} loading={loading}>
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
  );
}
