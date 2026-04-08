"use client";

import { Empty, Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";

export default function KnowledgePage() {
  return (
    <DashboardPageCard>
      <Typography.Title level={4} className="!mb-4 !mt-0">
        知识库
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="!mb-6">
        管理文档、切片与向量索引，支持检索与 RAG 配置。
      </Typography.Paragraph>
      <Empty description="功能开发中，请在此处接入知识库管理" />
    </DashboardPageCard>
  );
}
