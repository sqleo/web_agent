"use client";

import { CheckCircleOutlined } from "@ant-design/icons";
import { Tag, Typography } from "antd";
import type { ExecutionLog, ReportItem, ReportStage, ReportStatus } from "../types";

interface AgentHubProps {
  item: ReportItem | null;
}

const stageOrder: ReportStage[] = ["intent", "research", "outline", "writing", "final"];
const stageLabel: Record<ReportStage, string> = {
  intent: "意图",
  research: "调研",
  outline: "大纲",
  writing: "撰写",
  final: "完成",
};

function badgeConfig(status: ReportStatus): { color: string; text: string } {
  if (status === "waiting_review") return { color: "warning", text: "等待审核" };
  if (status === "completed") return { color: "success", text: "已完成" };
  if (status === "failed") return { color: "error", text: "失败" };
  return { color: "processing", text: "运行中" };
}

function logView(log: ExecutionLog): { emoji: string; text: string } | null {
  const payload = log.payload || {};
  if (log.type === "stage" && log.message) return { emoji: "🧭", text: log.message };
  if (log.type === "progress") {
    const done = payload.done;
    const total = payload.total;
    const percent = payload.percent;
    if (typeof done === "number" && typeof total === "number") {
      return { emoji: "📊", text: `进度 ${done}/${total}${typeof percent === "number" ? ` (${percent}%)` : ""}` };
    }
  }
  if (log.type === "source_found") return { emoji: "🔎", text: String(payload.title || log.message || "发现新来源") };
  if (log.type === "outline_ready") return { emoji: "🗂", text: log.message || "大纲已生成" };
  if (log.type === "section_update") return { emoji: "✍️", text: log.message || String(payload.title || "章节更新") };
  if (log.type === "review_update") return { emoji: "✅", text: log.message || "质量审查完成" };
  if (log.type === "interrupt") return { emoji: "🕒", text: log.message || "等待人工审核" };
  if (log.type === "final_report_ready") return { emoji: "📘", text: log.message || "最终报告已生成" };
  if (log.type === "error") return { emoji: "❌", text: log.message || "处理失败" };
  if (log.type === "log" && log.message) return { emoji: "🤖", text: log.message };
  return null;
}

export function AgentHub({ item }: AgentHubProps) {
  if (!item) return null;

  const currentStep = stageOrder.indexOf(item.stage);
  const badge = badgeConfig(item.status);
  const visibleLogs = (item.logs || []).map(logView).filter(Boolean) as Array<{ emoji: string; text: string }>;

  return (
    <div className="flex h-full flex-col bg-[#111827] text-slate-200">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-base text-purple-400" />
          <Typography.Title level={5} className="!m-0 text-slate-200 !text-sm">
            Agent 交互中枢
          </Typography.Title>
        </div>
        <Tag color={badge.color} className="border-none px-2 py-0.5 text-xs">
          {badge.text}
        </Tag>
      </div>

      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {stageOrder.map((stage, idx) => {
          const isPast = idx < currentStep || item.status === "completed";
          const isCurrent = idx === currentStep && item.status !== "completed";
          return (
            <div key={stage} className="flex flex-col items-center flex-1 relative">
              {idx > 0 && (
                <div
                  className={`absolute top-3 left-[-50%] right-[50%] h-[1px] ${
                    isPast || isCurrent ? "bg-blue-500" : "bg-slate-700/50"
                  }`}
                />
              )}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium border border-solid ${
                  isCurrent
                    ? "bg-blue-600 border-blue-600 text-slate-100"
                    : isPast
                    ? "bg-transparent border-blue-500 text-blue-400"
                    : "bg-transparent border-slate-700 text-slate-500"
                }`}
              >
                {isPast ? "✓" : idx + 1}
              </div>
              <span className={`mt-1 text-[11px] ${isCurrent ? "text-slate-200 font-semibold" : "text-slate-500"}`}>
                {stageLabel[stage]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex justify-end">
          <div className="max-w-sm bg-blue-600 text-slate-100 rounded-xl rounded-br-none px-3 py-2 shadow-md">
            <p className="m-0 text-xs leading-relaxed">{item.topic}</p>
          </div>
        </div>

        {visibleLogs.length > 0 ? (
          <div className="flex flex-col gap-3 py-2">
            {visibleLogs.map((log, index) => (
              <div key={`${log.text}-${index}`} className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                <span className="text-sm select-none shrink-0">{log.emoji}</span>
                <span className="leading-relaxed break-all">{log.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
            <span className="text-sm">🧠</span>
            {item.message || "等待任务启动..."}
          </div>
        )}

        {item.status === "waiting_review" && (
          <div className="flex items-center gap-2 text-xs text-amber-500 font-medium pl-2">
            <span className="text-sm select-none shrink-0 animate-pulse">🕒</span>
            {item.interrupt?.message || "等待人工审核..."}
          </div>
        )}
      </div>

      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="relative p-[1px] rounded-[13px] overflow-hidden group w-full transition-all">
          {(item.status === "running" || item.status === "processing") && (
            <div className="absolute inset-0 aurora-border-gradient aurora-border-anim opacity-100" />
          )}
          <textarea
            rows={2}
            readOnly
            placeholder={
              item.status === "running" || item.status === "processing"
                ? "Agent 思考与执行中..."
                : item.status === "waiting_review"
                ? "等待人工干预..."
                : "任务已结束"
            }
            className={`relative bg-[#1E293B] border-none text-slate-100 rounded-xl outline-none p-3 text-xs w-full resize-none z-10 m-0 ${
              item.status === "running" || item.status === "processing" ? "text-blue-300" : "text-slate-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
