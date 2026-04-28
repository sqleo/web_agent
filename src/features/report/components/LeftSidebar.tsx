"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import type { ReportItem } from "../types";

interface LeftSidebarProps {
  items: ReportItem[];
  selectedId?: string;
  onSelect: (item: ReportItem) => void;
  onAddNew: () => void;
  isCreating: boolean;
}

export function LeftSidebar({
  items,
  selectedId,
  onSelect,
  onAddNew,
  isCreating,
}: LeftSidebarProps) {
  const inProgress = items.filter((item) => item.status === "generating");
  const history = items.filter((item) => item.status !== "generating");

  return (
    <div
      className="flex h-full flex-col gap-6 p-4 text-slate-200"
      style={{ background: "#111827", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAddNew}
        className="h-12 w-full text-base font-medium"
        style={{
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.4)",
          color: "#93c5fd",
        }}
      >
        新建报告
      </Button>

      <div className="flex flex-col gap-2">
        <Typography.Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          进行中
        </Typography.Text>
        {inProgress.length === 0 ? (
          <Typography.Text type="secondary" className="px-3 text-xs italic">
            暂无进行中的报告
          </Typography.Text>
        ) : (
          inProgress.map((item) => {
            const isSelected = item.id === selectedId && !isCreating;
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-slate-800/40 ${
                  isSelected
                    ? "bg-blue-600/20 font-medium text-blue-300 border-l-4 border-l-blue-500"
                    : "text-slate-400"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="truncate text-sm">{item.topic}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <Typography.Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          历史报告
        </Typography.Text>
        {history.length === 0 ? (
          <Typography.Text type="secondary" className="px-3 text-xs italic">
            暂无历史报告
          </Typography.Text>
        ) : (
          history.map((item) => {
            const isSelected = item.id === selectedId && !isCreating;
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-slate-800/40 ${
                  isSelected
                    ? "bg-slate-800 font-medium text-slate-200 border-l-4 border-l-slate-400"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.status === "success" ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                />
                <span className="truncate text-sm">{item.topic}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
