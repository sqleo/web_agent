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
  const inProgress = items.filter((item) => item.status === "running" || item.status === "waiting_review");
  const history = items.filter((item) => item.status !== "running" && item.status !== "waiting_review");

  return (
    <div
      className="flex h-full flex-col gap-6 p-4 text-slate-200"
      style={{ background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Logo Area */}
      <div className="flex flex-col gap-1 px-2 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg aurora-border-gradient aurora-border-anim text-white font-bold text-lg">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-100">AgentLab</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 pl-10 font-semibold">
          智能报告工作台
        </span>
      </div>

      <div className="relative p-[1px] rounded-xl overflow-hidden group w-full">
        <div className="absolute inset-0 aurora-border-gradient aurora-border-anim opacity-80" />
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={onAddNew}
          className="relative h-11 w-full text-sm font-medium border-none flex items-center justify-center gap-2 m-0 bg-[#1e293b]/90 text-[#93c5fd] hover:text-white hover:bg-[#1e293b] backdrop-blur-md rounded-[10px] z-10 transition-colors"
        >
          新建报告
        </Button>
      </div>

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
                    item.status === "completed"
                      ? "bg-emerald-500"
                      : item.status === "failed"
                      ? "bg-rose-500"
                      : "bg-slate-600"
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
