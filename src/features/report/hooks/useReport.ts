import { useState, useEffect, useCallback } from "react";
import { App, message } from "antd";
import { getReports, createReport, deleteReport, generateReport, getStreamUrl, resumeReport } from "../api/report";
import { getApiVersionedBase } from "@/lib/api-base";
import { getAccessToken } from "@/api/auth-storage";
import { api } from "@/https";
import { parseSseStream } from "../utils/sse-parser";
import type { ReportItem, CreateReportBody } from "../types";

export function useReport() {
  const { message: messageApi } = App.useApp();
  const msg = messageApi || message;

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (e) {
      void msg.error("加载研报失败");
    } finally {
      setLoading(false);
    }
  }, [selectedReport]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // 模拟轮询，让生成中的报告推进进度
  useEffect(() => {
    const timer = setInterval(() => {
      setReports((prev) => {
        let changed = false;
        const next = prev.map((r) => {
          if (r.status === "generating") {
            changed = true;
            // Dummy upgrade status for mock
            return {
              ...r,
              status: "success" as const,
              content: `# ${r.topic}\n\n## 研报正文\n报告生成时间：${new Date().toLocaleString()}`,
            };
          }
          return r;
        });

        if (changed) {
          const updatedSelected = next.find((r) => r.id === selectedReport?.id);
          if (updatedSelected) {
            setSelectedReport(updatedSelected);
          }
          return next;
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [selectedReport]);

  const startPollingStream = useCallback(async (threadId: string) => {
    try {
      const url = getStreamUrl(threadId);
      const token = getAccessToken();
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.body) return;

      await parseSseStream(res.body, (data) => {
        setReports((prev) =>
          prev.map((r) => {
            if (r.id !== threadId) return r;
            const updatedLogs = [...(r.logs || []), data];
            const updates: any = { logs: updatedLogs };

            if (data.type === "phase") {
              updates.phase = data.phase;
              updates.message = data.message;
            }
            if (data.type === "interrupted") {
              updates.isInterrupted = true;
              updates.interruptPayload = data.payload;
              if (data.payload?.data?.intent) {
                updates.intentData = data.payload.data.intent;
              }
              if (data.payload?.data?.outline) {
                updates.outlineData = data.payload.data.outline;
              }
            }
            return { ...r, ...updates };
          })
        );

        setSelectedReport((prev) => {
          if (prev?.id !== threadId) return prev;
          const updatedLogs = [...(prev.logs || []), data];
          const updates: any = { logs: updatedLogs };

          if (data.type === "phase") {
            updates.phase = data.phase;
            updates.message = data.message;
          }
          if (data.type === "interrupted") {
            updates.isInterrupted = true;
            updates.intentData = data.payload?.data?.intent || updates.intentData;
          }
          return { ...prev, ...updates };
        });
      });
    } catch (error) {
      console.error("SSE stream error:", error);
    }
  }, []);

  const handleCreate = async (values: CreateReportBody) => {
    setSubmitting(true);
    let threadId = String(Date.now());

    try {
      const response = await api.stream("POST", "report/generate", {
        json: {
          user_query: values.topic,
        },
      });

      void msg.success("已启动后端 Agent 研究");

      const newReport: ReportItem = {
        id: threadId,
        topic: values.topic,
        status: "generating",
        created_at: new Date().toLocaleString().slice(5, 16),
      };

      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setCreateModalOpen(false);

      if (!response.body) return;

      await parseSseStream(response.body, (data) => {
        // 捕获 thread_id
        if (data.thread_id) {
          threadId = data.thread_id;
        }

        setReports((prev) =>
          prev.map((r) => {
            if (r.id !== newReport.id && r.id !== threadId) return r;
            const updatedLogs = [...(r.logs || []), data];
            const updates: any = { logs: updatedLogs };

            if (data.thread_id) updates.id = data.thread_id;
            if (data.type === "phase") {
              updates.phase = data.phase;
              updates.message = data.message;
            }
            if (data.type === "interrupted") {
              updates.isInterrupted = true;
              updates.interruptPayload = data.payload;
              if (data.payload?.data?.intent) {
                updates.intentData = data.payload.data.intent;
              }
              if (data.payload?.data?.outline) {
                updates.outlineData = data.payload.data.outline;
              }
            }
            return { ...r, ...updates };
          })
        );

        setSelectedReport((prev) => {
          if (prev?.id !== newReport.id && prev?.id !== threadId) return prev;
          const updatedLogs = [...(prev.logs || []), data];
          const updates: any = { logs: updatedLogs };

          if (data.thread_id) updates.id = data.thread_id;
          if (data.type === "phase") {
            updates.phase = data.phase;
            updates.message = data.message;
          }
          if (data.type === "interrupted") {
            updates.isInterrupted = true;
            updates.interruptPayload = data.payload;
            if (data.payload?.data?.intent) {
              updates.intentData = data.payload.data.intent;
            }
            if (data.payload?.data?.outline) {
              updates.outlineData = data.payload.data.outline;
            }
          }
          return { ...prev, ...updates };
        });
      });
    } catch (e) {
      console.error("启动研究失败:", e);
      void msg.error("启动研究失败，请检查后端服务");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResume = async (threadId: string) => {
    try {
      const targetNode = (selectedReport as any)?.interruptPayload?.metadata?.node_name || "human_review_intent";
      const response = await api.stream("POST", "report/resume", {
        json: {
          thread_id: threadId,
          action: "confirm",
          metadata: {
            node_name: targetNode,
          },
        },
      });

      void msg.success("确认成功，开始继续调研");

      setReports((prev) =>
        prev.map((r) => (r.id === threadId ? { ...r, isInterrupted: false } : r))
      );
      setSelectedReport((prev) =>
        prev?.id === threadId ? { ...prev, isInterrupted: false } : prev
      );

      if (response.body) {
        await parseSseStream(response.body, (data) => {
          setReports((prev) =>
            prev.map((r) => {
              if (r.id !== threadId) return r;
              const updatedLogs = [...(r.logs || []), data];
              const updates: any = { logs: updatedLogs };

              if (data.type === "phase") {
                updates.phase = data.phase;
                updates.message = data.message;
              }
              if (data.type === "interrupted") {
                updates.isInterrupted = true;
                updates.interruptPayload = data.payload;
                if (data.payload?.data?.intent) {
                  updates.intentData = data.payload.data.intent;
                }
                if (data.payload?.data?.outline) {
                  updates.outlineData = data.payload.data.outline;
                }
              }
              return { ...r, ...updates };
            })
          );

          setSelectedReport((prev) => {
            if (prev?.id !== threadId) return prev;
            const updatedLogs = [...(prev.logs || []), data];
            const updates: any = { logs: updatedLogs };

            if (data.type === "phase") {
              updates.phase = data.phase;
              updates.message = data.message;
            }
            if (data.type === "interrupted") {
              updates.isInterrupted = true;
              updates.interruptPayload = data.payload;
              if (data.payload?.data?.intent) {
                updates.intentData = data.payload.data.intent;
              }
              if (data.payload?.data?.outline) {
                updates.outlineData = data.payload.data.outline;
              }
            }
            return { ...prev, ...updates };
          });
        });
      }
    } catch (e) {
      console.error("恢复研究流失败:", e);
      void msg.error("确认失败，请检查后端服务");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      void msg.success("删除成功");
      await loadReports();
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (e) {
      void msg.error("删除失败");
    }
  };

  return {
    loading,
    reports,
    selectedReport,
    setSelectedReport,
    handleResume,
    createModalOpen,
    setCreateModalOpen,
    submitting,
    handleCreate,
    handleDelete,
  };
}
