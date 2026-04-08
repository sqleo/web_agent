"use client";

import { Empty, Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";

export default function AiToolPage() {
  return (
    <DashboardPageCard>
      <Typography.Title level={4} className="!mb-4 !mt-0">
        AI tool
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="!mb-6">
        聚合工具调用、插件与工作流编排。
      </Typography.Paragraph>
      <Empty description="功能开发中，请在此处接入 AI 工具能力" />
    </DashboardPageCard>
  );
}
