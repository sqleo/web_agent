"use client";

import { CheckCircleOutlined } from "@ant-design/icons";
import { Avatar, Tag, Typography } from "antd";
import type { ReportItem } from "../types";

interface AgentHubProps {
  item: ReportItem | null;
}

export function AgentHub({ item }: AgentHubProps) {
  if (!item) return null;

  const steps = ["意图", "规划", "调研", "大纲", "撰写"];
  // Mock current step based on progress
  const currentStep = item.status === "success" ? 5 : 1;

  return (
    <div className="flex h-full flex-col bg-[#111827] text-slate-200">
      {/* Top Header */}
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
        <Tag color="success" className="bg-emerald-500/10 text-emerald-400 border-none px-2 py-0.5 text-xs">
          ● 运行中
        </Tag>
      </div>

      {/* Progress Line */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isPast = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={step} className="flex flex-col items-center flex-1 relative">
              {/* Connecting line */}
              {idx > 0 && (
                <div
                  className={`absolute top-3 left-[-50%] right-[50%] h-[1px] ${
                    stepNum <= currentStep ? "bg-blue-500" : "bg-slate-700/50"
                  }`}
                />
              )}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium border border-solid transition-all ${
                  isCurrent
                    ? "bg-blue-600 border-blue-600 text-slate-100 shadow-md shadow-blue-500/20"
                    : isPast
                    ? "bg-transparent border-blue-500 text-blue-400"
                    : "bg-transparent border-slate-700 text-slate-500"
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`mt-1 text-[11px] font-medium ${
                  isCurrent
                    ? "text-slate-200 font-semibold"
                    : isPast
                    ? "text-blue-400/80"
                    : "text-slate-500"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat Conversation */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-sm bg-blue-600 text-slate-100 rounded-xl rounded-br-none px-3 py-2 shadow-md">
            <p className="m-0 text-xs leading-relaxed">
              分析 {item.topic}，深度报告
            </p>
          </div>
        </div>

        {/* Execution Logs Inline List */}
        {(() => {
          if (!item.logs || item.logs.length === 0) return null;

          const normalizedLogs: Array<{ emoji: string; text: string; count: number }> = [];
          
          item.logs.forEach((log) => {
            let emoji = "🤖";
            let text = log.message || (log as any).description || log.state || (log as any).result || "";

            if (log.type === "phase") {
              if (log.phase === "intent") emoji = "🧠";
              else if (log.phase === "planning" || log.phase === "research" || log.phase === "outline") emoji = "📋";
              else emoji = "📋";
            } else if (log.type === "task") {
              if ((log as any).tool === "kb_search" || (log as any).source === "kb_search") emoji = "🔎";
              else if ((log as any).tool === "web_search" || (log as any).source === "web_search") emoji = "🌐";
              else emoji = "🌐";
            } else if (log.type === "kb_search") {
              emoji = "🔎";
            } else if (log.type === "web_search") {
              emoji = "🌐";
            } else if (log.type === "data_query") {
              emoji = "📊";
            } else if (log.type === "metric") {
              emoji = "📊";
              if (log.metric_name) {
                text = `${log.metric_name}: ${log.value}`;
              } else if ((log as any).done !== undefined) {
                text = `进度: ${(log as any).done}/${(log as any).total} (${(log as any).coverage}%)`;
              }
            } else if (log.type === "interrupted") {
              emoji = "🕒";
              text = "等待人工审核大纲...";
            } else if (log.type === "error") {
              emoji = "❌";
            }

            if (log.type === "node" && (log.state === "completed" || log.state === "running")) {
              return;
            }

            if (!text) return;

            // 如果是进度指示，直接更新最后一条已存在的进度行（或者直接排重）
            const isProgress = text.startsWith("进度:");
            if (isProgress) {
              const lastProgressIdx = normalizedLogs.findIndex(l => l.text.startsWith("进度:"));
              if (lastProgressIdx !== -1) {
                normalizedLogs[lastProgressIdx].text = text;
                return;
              }
            }

            // 对连续完全相同的日志做归一化
            const lastLog = normalizedLogs[normalizedLogs.length - 1];
            if (lastLog && lastLog.text === text && lastLog.emoji === emoji) {
              lastLog.count += 1;
            } else {
              normalizedLogs.push({ emoji, text, count: 1 });
            }
          });

          return (
            <div className="flex flex-col gap-3 py-2">
              {normalizedLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-400 animate-fadeIn pl-2">
                  <span className="text-sm select-none shrink-0">{log.emoji}</span>
                  <span className="leading-relaxed break-all">
                    {log.text}
                    {log.count > 1 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] select-none">
                        x{log.count}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Thinking State */}
        {item.status === "generating" && !item.isInterrupted && (!item.logs || item.logs.length === 0) && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
            <span className="text-sm">🧠</span>
            正在解析意图...
          </div>
        )}

        {item.isInterrupted && (
          <div className="flex items-center gap-2 text-xs text-amber-500 font-medium pl-2">
            <span className="text-sm select-none shrink-0 animate-pulse">🕒</span>
            等待人工审核...
          </div>
        )}
      </div>
    </div>
  );
}
