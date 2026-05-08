"use client";

import { CheckSquareOutlined, FilePdfOutlined } from "@ant-design/icons";
import { App, Button, Tabs, Typography } from "antd";
import { useCallback, useRef, useState } from "react";
import { MarkdownProse } from "@/features/chat/components/markdown-prose";
import { exportReportHtmlToPdf } from "../utils/export-report-pdf";
import type { ReportItem, ReportSection, ReportStage, ReportStatus } from "../types";

interface RightConfigPanelProps {
  item: ReportItem | null;
  onConfirm: () => void;
}

const tabs = [
  { key: "intent", label: "意图确认" },
  { key: "research", label: "调研进行" },
  { key: "outline", label: "大纲审核" },
  { key: "writing", label: "并行撰写" },
  { key: "final", label: "最终报告" },
];

function statusBadge(status: ReportStatus): { text: string; className: string } {
  if (status === "waiting_review") {
    return { text: "等待审核", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
  }
  if (status === "completed") {
    return { text: "已完成", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
  }
  if (status === "failed") {
    return { text: "失败", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
  }
  return { text: "运行中", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" };
}

function titleForStage(stage: ReportStage): string {
  return {
    intent: "意图确认",
    research: "调研进行中",
    outline: "大纲审核",
    writing: "并行撰写",
    final: "最终报告",
  }[stage];
}

function sectionBadge(section: ReportSection) {
  if (section.score) {
    if (section.score >= 8) {
      return { text: `质量 ${section.score}/10 ✓`, className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    }
    return { text: `⚠ 评分 ${section.score}，重写中...`, className: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  }
  if (section.status === "writing") return { text: "撰写中...", className: "bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse" };
  if (section.status === "revising") return { text: "重写中...", className: "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse" };
  if (section.status === "reviewing" || section.status === "reviewed") return { text: "审核中...", className: "bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse" };
  return null;
}

/** 已与最终 Markdown 一并落库且未失败，即视为可导出（与历史列表「成功」一致） */
function canExportFinalReportPdf(item: ReportItem): boolean {
  if (item.stage !== "final") return false;
  if (item.status === "failed" || item.status === "cancelled") return false;
  return Boolean(item.finalReport?.markdown?.trim());
}

export function RightConfigPanel({ item, onConfirm }: RightConfigPanelProps) {
  const { message } = App.useApp();
  const finalReportRef = useRef<HTMLDivElement>(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    const el = finalReportRef.current;
    if (!item || !el) {
      void message.warning("暂无可导出的报告内容");
      return;
    }
    setPdfExporting(true);
    try {
      await exportReportHtmlToPdf(el, item.topic);
      void message.success("PDF 已生成并开始下载");
    } catch {
      void message.error("导出 PDF 失败，请重试");
    } finally {
      setPdfExporting(false);
    }
  }, [item, message]);

  if (!item) return null;

  const badge = statusBadge(item.status);
  const activeKey = item.stage;
  const stageTitle = titleForStage(item.stage);
  const showPdfExport = canExportFinalReportPdf(item);

  return (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-200">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <CheckSquareOutlined className="text-lg text-blue-400" />
          <Typography.Title level={5} className="!m-0 text-slate-200">
            {stageTitle}
          </Typography.Title>
        </div>
        <span className={`rounded px-2 py-0.5 text-xs ${badge.className}`}>{badge.text}</span>
      </div>

      <div className="px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Tabs activeKey={activeKey} items={tabs} className="report-config-tabs" style={{ marginBottom: -1 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <div className="h-full min-h-0 overflow-y-auto overscroll-y-contain p-6">
        {item.stage === "intent" && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/60 rounded-xl p-4 border border-solid border-slate-800/80">
              <Typography.Text type="secondary" className="text-xs block mb-3 text-slate-400">
                ● 意图识别结果 · 点击补充缺失项
              </Typography.Text>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-600/20 text-blue-300 border border-solid border-blue-500/30 rounded-full px-3 py-1 text-xs">
                  主题: {item.intentData?.topic || item.topic}
                </span>
                <span className="bg-purple-600/20 text-purple-300 border border-solid border-purple-500/30 rounded-full px-3 py-1 text-xs">
                  行业: {item.intentData?.industry || "待补充"}
                </span>
                <span className="bg-amber-600/20 text-amber-300 border border-solid border-amber-500/30 rounded-full px-3 py-1 text-xs">
                  深度: {item.intentData?.depth || "待补充"}
                </span>
                <span className="bg-emerald-600/20 text-emerald-300 border border-solid border-emerald-500/30 rounded-full px-3 py-1 text-xs">
                  格式: {item.intentData?.output_format || "Markdown"}
                </span>
                {(item.intentMissingFields || []).map((field) => (
                  <span
                    key={field}
                    className="bg-rose-500/10 text-rose-300 border border-dashed border-rose-500/40 rounded-full px-3 py-1 text-xs"
                  >
                    + 补充 {field}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-solid border-slate-800/50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">分析深度</span>
                <span className="text-sm font-medium text-blue-400">{item.intentData?.depth || "深度分析"}</span>
              </div>
              <div className="bg-slate-900/40 border border-solid border-slate-800/50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">输出格式</span>
                <span className="text-sm font-medium text-purple-400">{item.intentData?.output_format || "PDF"}</span>
              </div>
              <div className="bg-slate-900/40 border border-solid border-slate-800/50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">语言风格</span>
                <span className="text-sm font-medium text-emerald-400">{item.intentData?.style_instruction || "专业咨询风格"}</span>
              </div>
              <div className="bg-slate-900/40 border border-solid border-slate-800/50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">行业范畴</span>
                <span className="text-sm font-medium text-amber-400">{item.intentData?.industry || "待识别"}</span>
              </div>
            </div>
          </div>
        )}

        {item.stage === "research" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>已发现 {item.sources.length} 条来源</span>
              <span>{item.metrics?.progress_percent || 0}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${item.metrics?.progress_percent || 0}%` }}
              />
            </div>
            {item.sources.map((source) => (
              <div key={source.source_id} className="bg-slate-900/30 border border-solid border-slate-800/50 p-3 rounded-xl flex items-start gap-3">
                <span className="text-slate-500 text-xs mt-0.5 select-none shrink-0">📄</span>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs font-medium text-slate-200 break-all">{source.title}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-3">{source.summary}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {item.stage === "outline" && (
          <div className="flex flex-col gap-4">
            {item.outline.map((section, idx) => (
              <div key={section.section_id} className="group relative bg-[#1E293B] border border-solid border-slate-700 hover:border-blue-500/50 p-4 rounded-xl flex flex-col gap-3 transition-colors">
                {/* Right Hover Actions */}
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <span className="cursor-pointer text-slate-400 hover:text-blue-400 text-xs">✏️ 编辑</span>
                  <span className="cursor-pointer text-slate-400 hover:text-purple-400 text-xs">↺ 重写</span>
                  <span className="cursor-pointer text-slate-400 hover:text-rose-400 text-xs">✕ 删除</span>
                </div>
                
                <div className="flex items-center gap-3 pr-24">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg aurora-border-gradient text-white font-bold text-xs shadow-md">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-100 cursor-text hover:bg-slate-800 px-1 rounded transition-colors">{section.title}</span>
                </div>
                <ul className="pl-10 list-disc text-slate-400 text-xs flex flex-col gap-2 m-0">
                  {section.key_points.map((point) => (
                    <li key={point} className="leading-relaxed">{point}</li>
                  ))}
                </ul>
                <div className="pl-10 flex flex-wrap gap-2 mt-2">
                  {section.evidence_keys.map((key) => (
                    <span key={key} className="bg-blue-900/30 text-blue-300 border border-solid border-blue-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium">
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {item.stage === "writing" && (
          <div className="flex flex-col gap-6">
            {item.sections.map((section) => {
              const badge = sectionBadge(section);
              const isPending = section.status === "pending";
              return (
                <div key={section.section_id} className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-100 flex-1">{section.title}</span>
                    {badge && (
                      <span className={`border rounded-full px-2 py-0.5 text-[10px] shadow-sm ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                  {isPending ? (
                    <div className="border-l-2 border-slate-800 pl-4 py-2">
                      <div className="h-2 w-3/4 bg-slate-800 rounded mb-2" />
                      <div className="h-2 w-1/2 bg-slate-800 rounded" />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300 leading-relaxed border-l-2 border-blue-500/50 pl-4 py-1 relative">
                      {section.content || "..."}
                      {section.status === "writing" && (
                        <span className="inline-block w-1 h-3 bg-blue-400 ml-1 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {item.stage === "final" && (
          <div ref={finalReportRef} className="flex flex-col gap-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-blue-300 mb-2">深度研究报告</div>
              <div className="text-lg font-semibold text-slate-100">{item.topic}</div>
              <div className="text-xs text-slate-400 mt-2">
                {item.finalReport?.chapter_count || 0} 章 · {item.finalReport?.word_count || 0} 字 · 引用 {item.finalReport?.citation_count || 0} 处
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-slate-300">
              {item.finalReport?.markdown ? (
                <MarkdownProse markdown={item.finalReport.markdown} />
              ) : (
                "最终报告内容为空"
              )}
            </div>
          </div>
        )}
          </div>

          {showPdfExport && (
            <div className="pointer-events-none absolute inset-y-6 right-4 z-[100] flex items-center">
              <Button
                type="primary"
                shape="round"
                icon={<FilePdfOutlined />}
                loading={pdfExporting}
                onClick={() => void handleExportPdf()}
                className="pointer-events-auto shadow-lg shadow-black/50"
              >
                导出 PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {item.status === "waiting_review" && item.stage === "outline" && (
        <div className="px-6 py-4 flex items-center justify-between gap-3 bg-[#0F172A] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 sticky bottom-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-slate-400 text-xs">大纲已就绪 · 可直接点击章节文本编辑</span>
          <div className="flex items-center gap-3">
            <Button className="border border-solid border-slate-700 bg-transparent text-slate-300 hover:text-white hover:border-rose-500 text-xs px-4 h-9 rounded-xl transition-colors">
              不满意，重新规划
            </Button>
            <div className="relative p-[1px] rounded-[13px] overflow-hidden group">
              <div className="absolute inset-0 aurora-border-gradient aurora-border-anim opacity-100" />
              <Button type="primary" onClick={onConfirm} className="relative bg-[#1E293B] border-none hover:bg-transparent font-medium text-xs px-5 h-9 rounded-xl z-10 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                批准大纲，开始撰写
              </Button>
            </div>
          </div>
        </div>
      )}

      {item.status === "waiting_review" && item.stage === "intent" && (
        <div className="px-6 py-4 flex items-center justify-between gap-3 bg-[#0F172A] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 sticky bottom-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-slate-400 text-xs">意图识别完成 · 请确认参数或补充缺失项</span>
          <div className="flex items-center gap-3">
            <Button className="border border-solid border-slate-700 bg-transparent text-slate-300 hover:text-white text-xs px-4 h-9 rounded-xl transition-colors">
              修改命题
            </Button>
            <div className="relative p-[1px] rounded-[13px] overflow-hidden group">
              <div className="absolute inset-0 aurora-border-gradient aurora-border-anim opacity-100" />
              <Button type="primary" onClick={onConfirm} className="relative bg-[#1E293B] border-none hover:bg-transparent font-medium text-xs px-5 h-9 rounded-xl z-10 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                确认，开始调研
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
