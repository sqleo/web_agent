"use client";

import { Card, Col, Progress, Row, Statistic, Typography, theme } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";

export default function HomeDashboardPage() {
  const { token } = theme.useToken();

  return (
    <DashboardPageCard>
      <Typography.Title level={4} className="!mb-6 !mt-0 !font-semibold">
        数据概览
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{ background: token.colorFillSecondary }}
          >
            <Statistic title="Token 使用量（本月）" value={128400} suffix="tokens" />
            <Typography.Text type="secondary" className="mt-2 block text-xs">
              较上月 +12.4%
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{ background: token.colorFillSecondary }}
          >
            <Statistic title="召回率" value={92.6} suffix="%" precision={1} />
            <Progress
              percent={92.6}
              showInfo={false}
              strokeColor={token.colorPrimary}
              className="mt-3"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{ background: token.colorFillSecondary }}
          >
            <Statistic title="平均响应延迟" value={186} suffix="ms" />
            <Typography.Text type="secondary" className="mt-2 block text-xs">
              P95 320ms
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            style={{ background: token.colorFillSecondary }}
          >
            <Statistic title="活跃会话" value={48} />
            <Typography.Text type="secondary" className="mt-2 block text-xs">
              今日对话轮次 1.2k
            </Typography.Text>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card
            title="调用成功率"
            variant="borderless"
            style={{ background: token.colorFillSecondary }}
          >
            <Statistic value={99.2} suffix="%" precision={1} />
            <Typography.Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              近 7 日 API 成功调用占比，失败主要为超时重试。
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="知识命中"
            variant="borderless"
            style={{ background: token.colorFillSecondary }}
          >
            <Statistic value={76} suffix="%" />
            <Typography.Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              检索阶段命中用户问题的片段占比（示例指标，可对接真实埋点）。
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </DashboardPageCard>
  );
}
