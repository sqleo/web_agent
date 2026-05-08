import { useCallback, useEffect, useState } from "react";
import { App, message } from "antd";
import {
  generateReportStream,
  getReportHistory,
  listReportHistories,
  resumeReportStream,
} from "../api/report";
import { parseSseStream } from "../utils/sse-parser";
import { applyReportStreamEvent, mapReportHistoryDetail, mapReportHistoryItem } from "../utils/report-mappers";
import type { CreateReportBody, ExecutionLog, ReportItem } from "../types";

function buildUserQuery(values: CreateReportBody): string {
  const sections = [values.topic.trim()];
  if (values.keywords?.length) {
    sections.push(`偏好标签：${values.keywords.join("、")}`);
  }
  if (values.extra?.trim()) {
    sections.push(`额外要求：${values.extra.trim()}`);
  }
  return sections.join("\n");
}

function replaceReport(items: ReportItem[], report: ReportItem): ReportItem[] {
  const exists = items.some((item) => item.id === report.id);
  if (!exists) {
    return [report, ...items];
  }
  return items.map((item) => (item.id === report.id ? { ...item, ...report } : item));
}

function patchStreamEvent(items: ReportItem[], matchIds: string[], event: ExecutionLog): ReportItem[] {
  return items.map((item) =>
    matchIds.includes(item.id) ? applyReportStreamEvent(item, event) : item
  );
}

export function useReport() {
  const { message: appMessage } = App.useApp();
  const msg = appMessage || message;

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectReport = useCallback(
    async (threadId: string, fallback?: ReportItem) => {
      if (fallback) {
        setSelectedReport(fallback);
      }
      try {
        const detail = mapReportHistoryDetail(await getReportHistory(threadId));
        setReports((prev) => replaceReport(prev, detail));
        setSelectedReport(detail);
      } catch (error) {
        if (fallback) {
          setSelectedReport(fallback);
          return;
        }
        throw error;
      }
    },
    []
  );

  const loadReports = useCallback(
    async (preferredThreadId?: string) => {
      setLoading(true);
      try {
        const data = await listReportHistories();
        const items = data.items.map(mapReportHistoryItem);
        setReports(items);

        const targetId = preferredThreadId || selectedReport?.id || items[0]?.id;
        if (!targetId) {
          setSelectedReport(null);
          return;
        }

        const fallback = items.find((item) => item.id === targetId);
        if (fallback) {
          await selectReport(targetId, fallback);
        }
      } catch {
        void msg.error("加载研报失败");
      } finally {
        setLoading(false);
      }
    },
    [msg, selectReport, selectedReport?.id]
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleSelectReport = useCallback(
    async (item: ReportItem) => {
      try {
        await selectReport(item.id, item);
      } catch {
        void msg.error("加载研报详情失败");
      }
    },
    [msg, selectReport]
  );

  const consumeStream = useCallback(
    async (response: Response, optimisticId: string) => {
      if (!response.body) {
        return optimisticId;
      }

      let activeId = optimisticId;
      await parseSseStream(response.body, (chunk: ExecutionLog) => {
        if (chunk.thread_id) {
          activeId = chunk.thread_id;
        }
        const matchIds = activeId === optimisticId ? [optimisticId, activeId] : [activeId];
        setReports((prev) => patchStreamEvent(prev, matchIds, chunk));
        setSelectedReport((prev) => {
          if (!prev || !matchIds.includes(prev.id)) {
            return prev;
          }
          return applyReportStreamEvent(prev, chunk);
        });
      });

      return activeId;
    },
    []
  );

  const handleCreate = useCallback(
    async (values: CreateReportBody) => {
      setSubmitting(true);
      const optimisticId = `pending-${Date.now()}`;
      const optimisticItem: ReportItem = {
        id: optimisticId,
        topic: values.topic,
        status: "running",
        stage: "intent",
        created_at: new Date().toISOString(),
        message: "任务已提交，等待 Agent 启动",
        sources: [],
        outline: [],
        sections: [],
        logs: [],
      };

      setReports((prev) => [optimisticItem, ...prev]);
      setSelectedReport(optimisticItem);

      try {
        const response = await generateReportStream({
          user_query: buildUserQuery(values),
        });
        void msg.success("已启动后端 Agent 研究");
        const threadId = await consumeStream(response, optimisticId);
        await loadReports(threadId);
      } catch (error) {
        setReports((prev) =>
          prev.map((item) =>
            item.id === optimisticId
              ? { ...item, status: "failed", lastError: error instanceof Error ? error.message : "启动失败" }
              : item
          )
        );
        setSelectedReport((prev) =>
          prev?.id === optimisticId
            ? {
                ...prev,
                status: "failed",
                lastError: error instanceof Error ? error.message : "启动失败",
              }
            : prev
        );
        void msg.error("启动研究失败，请检查后端服务");
      } finally {
        setSubmitting(false);
      }
    },
    [consumeStream, loadReports, msg]
  );

  const handleResume = useCallback(
    async (threadId: string) => {
      const nodeName =
        typeof selectedReport?.interrupt?.payload?.metadata === "object"
          ? String(
              ((selectedReport.interrupt.payload.metadata as Record<string, unknown>).node_name as string) ||
                "human_review"
            )
          : "human_review";

      try {
        const response = await resumeReportStream({
          thread_id: threadId,
          action: "confirm",
          metadata: { node_name: nodeName },
        });
        setReports((prev) =>
          prev.map((item) =>
            item.id === threadId ? { ...item, interrupt: null, status: "running" } : item
          )
        );
        setSelectedReport((prev) =>
          prev?.id === threadId ? { ...prev, interrupt: null, status: "running" } : prev
        );
        void msg.success("已继续执行研报流程");
        const activeThreadId = await consumeStream(response, threadId);
        await loadReports(activeThreadId);
      } catch {
        void msg.error("继续执行失败，请检查后端服务");
      }
    },
    [consumeStream, loadReports, msg, selectedReport?.interrupt]
  );

  return {
    loading,
    reports,
    selectedReport,
    setSelectedReport: handleSelectReport,
    handleResume,
    createModalOpen,
    setCreateModalOpen,
    submitting,
    handleCreate,
    reloadReports: loadReports,
  };
}
