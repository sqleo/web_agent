"use client";

import { CheckSquareOutlined } from "@ant-design/icons";
import { Button, Tabs, Typography } from "antd";
import type { ReportItem } from "../types";

interface RightConfigPanelProps {
  item: ReportItem | null;
  onConfirm: () => void;
}

export function RightConfigPanel({ item, onConfirm }: RightConfigPanelProps) {
  if (!item) return null;

  const tabsItems = [
    { key: "intent", label: "意图确认" },
    { key: "research", label: "调研进行" },
    { key: "outline", label: "大纲审核" },
    { key: "writing", label: "并行撰写" },
    { key: "final", label: "最终报告" },
  ];

  let activeTab = "intent";
  if (item.phase === "intent") activeTab = "intent";
  else if (item.phase === "planning" || item.phase === "research") activeTab = "research";
  else if (item.phase === "outline") activeTab = "outline";
  else if (item.phase === "writing") activeTab = "writing";

  if (item.isInterrupted && item.outlineData) {
    activeTab = "outline";
  }

  // --- Outline View ---
  if (activeTab === "outline" && item.outlineData) {
    return (
      <div className="flex h-full flex-col bg-[#0f172a] text-slate-200">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <CheckSquareOutlined className="text-lg text-blue-400" />
            <Typography.Title level={5} className="!m-0 text-slate-200">
              大纲审核
            </Typography.Title>
          </div>
          <span className="bg-amber-500/10 text-amber-500 border border-solid border-amber-500/20 rounded px-2 py-0.5 text-xs">
            等待审核
          </span>
        </div>

        <div className="px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Tabs
            activeKey={activeTab}
            items={tabsItems}
            className="report-config-tabs"
            style={{ marginBottom: -1 }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {Array.isArray(item.outlineData) && item.outlineData.map((section: any, idx: number) => (
            <div
              key={section.section_id || idx}
              className="bg-slate-900/40 border border-solid border-slate-800/80 p-4 rounded-xl flex flex-col gap-3 relative hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {section.title}
                </span>
              </div>
              <ul className="pl-9 list-disc text-slate-400 text-xs flex flex-col gap-1.5 m-0">
                {section.key_points && section.key_points.map((pt: string, pIdx: number) => (
                  <li key={pIdx}>{pt}</li>
                ))}
              </ul>
              {section.evidence_keys && (
                <div className="pl-9 flex flex-wrap gap-2 mt-1">
                  {section.evidence_keys.map((key: string) => (
                    <span key={key} className="bg-slate-800/80 text-slate-400 border border-solid border-slate-700/50 rounded px-2 py-0.5 text-[10px]">
                      {key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(11, 15, 25, 0.5)" }}
        >
          <span className="text-slate-500 text-xs">
            {Array.isArray(item.outlineData) ? item.outlineData.length : 0} 章节已就绪 · 可直接编辑
          </span>
          <div className="flex items-center gap-3">
            <Button className="border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white text-xs px-3">
              不满意，重新规划
            </Button>
            <Button
              type="primary"
              onClick={onConfirm}
              className="bg-blue-600 border-none hover:bg-blue-500 font-medium text-xs px-4 py-1 h-8 rounded-lg"
            >
              批准大纲，开始撰写
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Research/Discovery View ---
  if (activeTab === "research") {
    const researchLogs = item.logs?.filter(l => 
      l.type === "kb_search" || l.type === "web_search" || l.type === "data_query" || (l.type === "task" && l.phase === "research")
    ) || [];

    return (
      <div className="flex h-full flex-col bg-[#0f172a] text-slate-200">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <CheckSquareOutlined className="text-lg text-blue-400" />
            <Typography.Title level={5} className="!m-0 text-slate-200">
              调研进行中
            </Typography.Title>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-solid border-emerald-500/20 rounded px-2 py-0.5 text-xs animate-pulse">
            运行中
          </span>
        </div>

        <div className="px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Tabs
            activeKey={activeTab}
            items={tabsItems}
            className="report-config-tabs"
            style={{ marginBottom: -1 }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>已发现 {researchLogs.length} 条来源</span>
            <span>置信度 91%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-500 w-4/5 animate-pulse rounded-full" />
          </div>

          {researchLogs.map((log, idx) => {
            const title = log.message || (log as any).description || "数据获取中";
            return (
              <div key={idx} className="bg-slate-900/30 border border-solid border-slate-800/50 p-3 rounded-xl flex items-start gap-3">
                <span className="text-slate-500 text-xs mt-0.5 select-none shrink-0">📄</span>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs font-medium text-slate-200 break-all">{title}</span>
                  {(log as any).result && (
                    <span className="text-[10px] text-slate-500 line-clamp-2">{(log as any).result}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Default: Intent View ---
  return (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-200">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <CheckSquareOutlined className="text-lg text-blue-400" />
          <Typography.Title level={5} className="!m-0 text-slate-200">
            意图确认
          </Typography.Title>
        </div>
        <Button size="small" ghost className="border-blue-500/40 text-blue-400 text-xs px-3">
          意图识别
        </Button>
      </div>

      <div className="px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Tabs
          activeKey={activeTab}
          items={tabsItems}
          className="report-config-tabs"
          style={{ marginBottom: -1 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="bg-slate-900/60 rounded-xl p-4 border border-solid border-slate-800/80">
          <Typography.Text type="secondary" className="text-xs block mb-3 text-slate-400">
            ● 意图识别结果 · 点击补充缺失项
          </Typography.Text>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-600/20 text-blue-300 border border-solid border-blue-500/30 rounded-full px-3 py-1 text-xs">
              主题: {item.intentData?.topic || item.topic}
            </span>
            <span className="bg-purple-600/20 text-purple-300 border border-solid border-purple-500/30 rounded-full px-3 py-1 text-xs">
              行业: {item.intentData?.industry || "互联网/IT"}
            </span>
            <span className="bg-amber-600/20 text-amber-300 border border-solid border-amber-500/30 rounded-full px-3 py-1 text-xs">
              深度: {item.intentData?.depth || "4-6章"}
            </span>
            <span className="bg-emerald-600/20 text-emerald-300 border border-solid border-emerald-500/30 rounded-full px-3 py-1 text-xs">
              格式: {item.intentData?.output_format || "Markdown"}
            </span>
          </div>
        </div>

        <Typography.Text type="secondary" className="text-xs text-slate-500">
          以下参数已自动设置，可调整：
        </Typography.Text>

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
            <span className="text-sm font-medium text-amber-400">{item.intentData?.industry || "互联网/科技"}</span>
          </div>
        </div>
      </div>

      {item.isInterrupted && (
        <div
          className="px-6 py-4 flex items-center justify-end gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Button className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white">
            修改命题
          </Button>
          <Button
            type="primary"
            onClick={onConfirm}
            className="bg-blue-600 border-none hover:bg-blue-500 font-medium px-6"
          >
            确认，开始调研
          </Button>
        </div>
      )}
    </div>
  );
}
