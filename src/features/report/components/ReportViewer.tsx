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
      <div className="mb-4 flex flex-wrap gap-2">
        {item.keywords?.map((k) => (
          <Typography.Text code key={k} className="text-xs">
            {k}
          </Typography.Text>
        ))}
      </div>

      {item.status === "generating" ? (
        <div className="max-w-md mx-auto mt-8">
          <ReportProgress item={item} />
        </div>
      ) : item.status === "success" && item.content ? (
        <div className="bg-[var(--bg)] p-4 rounded-lg border border-solid border-[var(--border)]">
          <MarkdownProse markdown={item.content} />
        </div>
      ) : (
        <Empty description="研报生成失败或内容为空" />
      )}
    </Card>
  );
}
