"use client";

import { Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";

export default function SettingsPage() {
  return (
    <DashboardPageCard>
      <Typography.Title level={4} className="!mb-2 !mt-0">
        账户设置
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="!mb-0">
        在此配置账户与偏好（占位页，可接入表单与接口）。
      </Typography.Paragraph>
    </DashboardPageCard>
  );
}
