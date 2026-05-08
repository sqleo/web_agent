"use client";

import { Card, Progress, Steps, Typography } from "antd";
import type { ReportItem } from "../types";

interface ReportProgressProps {
  item: ReportItem;
}

export function ReportProgress({ item }: ReportProgressProps) {
  if (!item.progress) return null;
  const { progress } = item;

  return (
    <Card size="small" variant="borderless" className="bg-[var(--bg3)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Typography.Text type="secondary" className="text-xs block mb-1">
            当前阶段
          </Typography.Text>
          <Typography.Title level={5} className="!m-0 text-blue-500">
            {progress.current_step}
          </Typography.Title>
        </div>
        <Progress
          type="circle"
          percent={progress.percent}
          size={50}
          strokeColor="var(--ant-color-primary)"
        />
      </div>

      <Steps
        direction="vertical"
        size="small"
        current={progress.steps.findIndex((s) => s.status === "process" || s.status === "finish")}
        items={progress.steps.map((step) => ({
          title: step.name,
          status: step.status,
        }))}
      />
    </Card>
  );
}
