"use client";

import { Card, Empty, Typography } from "antd";
import { MarkdownProse } from "@/features/chat/components/markdown-prose";
import type { ReportItem } from "../types";
import { ReportProgress } from "./ReportProgress";

interface ReportViewerProps {
  item: ReportItem | null;
}

export function ReportViewer({ item }: ReportViewerProps) {
  if (!item) {
    return (
      <Card size="small" variant="borderless" className="h-full flex items-center justify-center">
        <Empty description="请选择或生成一份研报" />
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={item.topic}
      variant="borderless"
      className="h-full overflow-auto"
    >
      {item.subtitle ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Typography.Text code className="text-xs">
            {item.subtitle}
          </Typography.Text>
        </div>
      ) : null}

      {item.status === "running" || item.status === "waiting_review" ? (
        <div className="max-w-md mx-auto mt-8">
          <ReportProgress item={item} />
        </div>
      ) : item.finalReport?.markdown ? (
        <div className="bg-[var(--bg)] p-4 rounded-lg border border-solid border-[var(--border)]">
          <MarkdownProse markdown={item.finalReport.markdown} />
        </div>
      ) : (
        <Empty description="研报生成失败或内容为空" />
      )}
    </Card>
  );
}
