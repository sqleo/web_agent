import { http } from "@/lib/http";
import { getApiVersionedBase } from "@/lib/api-base";
import type { ReportItem, CreateReportBody, GenerateReportPayload, GenerateReportResponse } from "../types";

export function getStreamUrl(thread_id: string): string {
  const base = getApiVersionedBase() || "http://localhost:8888/v1";
  return `${base}/report/${thread_id}/stream`;
}

// ... existing mock definitions for compatibility ...
let mockReports: ReportItem[] = [
  {
    id: "1",
    topic: "2026年全球新能源汽车产业发展趋势报告",
    keywords: ["新能源", "固态电池", "智能化"],
    status: "success",
    created_at: "2026-04-28 10:00:00",
    content: `# 2026年全球新能源汽车产业发展趋势报告

## 一、 核心摘要
随着电池技术的突破与智能化水平的提升，2026年全球新能源汽车（NEV）产业进入了全新的高质量发展阶段。

## 二、 固态电池的产业化落地
*   **能量密度提升**：半固态电池实现大规模量产，能量密度突破 400Wh/kg。
*   **安全性增强**：热失控风险大幅降低。

## 三、 智能驾驶的演进
*   **端到端大模型**成为行业标配。
*   **L3级自动驾驶**在更多国家和地区获得法规准入。`,
  },
];

export async function getReports(): Promise<ReportItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockReports]);
    }, 500);
  });
}

export async function createReport(body: CreateReportBody): Promise<ReportItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReport: ReportItem = {
        id: String(Date.now()),
        topic: body.topic,
        keywords: body.keywords,
        status: "generating",
        created_at: new Date().toLocaleString(),
      };
      mockReports = [newReport, ...mockReports];
      resolve(newReport);
    }, 1000);
  });
}

export async function deleteReport(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockReports = mockReports.filter((r) => r.id !== id);
      resolve();
    }, 300);
  });
}

/**
 * 启动报告生成任务
 * POST /v1/report/generate
 */
export async function generateReport(payload: GenerateReportPayload): Promise<GenerateReportResponse> {
  return http.post("report/generate", { json: payload }).json<GenerateReportResponse>();
}

/**
 * 人工审核
 * POST /v1/report/review
 */
export async function reviewReport(payload: {
  thread_id: string;
  action: "confirm" | "revise" | "replan";
  metadata?: Record<string, any>;
}): Promise<GenerateReportResponse> {
  return http.post("report/review", { json: payload }).json<GenerateReportResponse>();
}

/**
 * 恢复执行
 * POST /v1/report/resume
 */
export async function resumeReport(payload: {
  thread_id: string;
  action: "confirm" | "revise";
  updates?: Record<string, any> | null;
  metadata: {
    node_name: string;
  };
}): Promise<GenerateReportResponse> {
  return http.post("report/resume", { json: payload }).json<GenerateReportResponse>();
}

/**
 * 回滚流程
 * POST /v1/report/rollback
 */
export async function rollbackReport(payload: {
  thread_id: string;
  metadata?: Record<string, any>;
}): Promise<GenerateReportResponse> {
  return http.post("report/rollback", { json: payload }).json<GenerateReportResponse>();
}

/**
 * 查询报告状态
 * GET /v1/report/{thread_id}/status
 */
export async function getReportStatus(thread_id: string): Promise<GenerateReportResponse> {
  return http.get(`report/${thread_id}/status`).json<GenerateReportResponse>();
}

