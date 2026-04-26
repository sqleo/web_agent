"use client";

import type { ReportRuntimeStatus } from "@/api/report-agent";

export type Phase = "init" | "intent" | "research" | "outline" | "write" | "final";

export type ReportTask = {
  localId: string;
  title: string;
  threadId?: string;
  runtimeStatus: ReportRuntimeStatus | "draft";
  phase: Phase;
  query: string;
  progress: number;
  chunksDone: number;
  chunksTotal: number;
  timeline: string[];
  draftText: string;
  outlineText: string;
  intentData?: {
    topic?: string;
    report_type?: string;
    scope?: string;
    time_range?: string;
    depth?: string;
    style_instruction?: string;
    output_format?: string;
    industry?: string;
  };
  interruptMessage?: string;
  interruptNode?: string;
  interruptOptions?: string[];
  updatedAt: number;
};

export type GenerateForm = {
  userQuery: string;
  depth: "lite" | "deep";
  output: "markdown" | "pdf";
  style: "academic" | "business";
  review: "manual" | "auto";
  extra: string;
};

export type OutlineSectionView = {
  title: string;
  bullets: string[];
  tags: string[];
};

export const STEP_ITEMS: Array<{ key: Phase; label: string }> = [
  { key: "intent", label: "意图确认" },
  { key: "research", label: "调研进行" },
  { key: "outline", label: "大纲审核" },
  { key: "write", label: "并行撰写" },
  { key: "final", label: "最终报告" },
];

export const PRESET_TYPES = ["竞争格局分析", "市场规模预测", "技术壁垒研究", "投融资评估", "政策风险扫描"];
export const PRESET_SOURCES = ["内部知识库", "实时网络", "上传文档", "外部 API"];
