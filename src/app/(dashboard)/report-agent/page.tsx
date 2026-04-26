"use client";

import {
  CheckCircleFilled,
  ClockCircleFilled,
  FileTextOutlined,
  GlobalOutlined,
  PauseCircleFilled,
  SearchOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { App, Flex, Tag, theme } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  createReportGenerateStream,
  createReportResumeStream,
  getReportStatus,
  rollbackReportToNode,
  type ReportResumeAction,
} from "@/api/report-agent";
import { iterateReportSseEvents } from "@/lib/report-sse";
import { AgentHubPanel } from "./_components/agent-hub-panel";
import { MainWorkspacePanel } from "./_components/main-workspace-panel";
import { TaskSidebar } from "./_components/task-sidebar";
import {
  STEP_ITEMS,
  type GenerateForm,
  type OutlineSectionView,
  type Phase,
  type ReportTask,
} from "./types";

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function phaseFromNode(node: string): Phase {
  if (["intent", "human_review_intent"].includes(node)) return "intent";
  if (["planner"].includes(node)) return "research";
  if (["researcher"].includes(node)) return "research";
  if (["outliner"].includes(node)) return "outline";
  if (["human_review"].includes(node)) return "outline";
  if (["writer"].includes(node)) return "write";
  return "research";
}

function timelineVisual(line: string): { icon: React.ReactNode; color: string } {
  if (line.includes("等待大纲审核") || line.includes("等待审核")) {
    return { icon: <ClockCircleFilled />, color: "#F59E0B" };
  }
  if (line.includes("任务完成")) {
    return { icon: <CheckCircleFilled />, color: "#10B981" };
  }
  if (line.includes("意图")) {
    return { icon: <BulbOutlined />, color: "rgba(244,114,182,0.9)" };
  }
  if (line.includes("检索")) {
    return { icon: <SearchOutlined />, color: "rgba(148,163,184,0.92)" };
  }
  if (line.includes("抓取")) {
    return { icon: <GlobalOutlined />, color: "rgba(125,211,252,0.95)" };
  }
  if (line.includes("来源")) {
    return { icon: <FileTextOutlined />, color: "#10B981" };
  }
  return { icon: <PauseCircleFilled />, color: "rgba(148,163,184,0.86)" };
}

function prettifyNodeLabel(node: string): string {
  const m: Record<string, string> = {
    intent: "意图解析",
    planner: "生成调研规划",
    researcher: "调研检索",
    outliner: "生成大纲",
    writer: "并行撰写",
    human_review_intent: "人工确认意图",
    human_review: "人工审核大纲",
  };
  return m[node] ?? node;
}

function runningNodeLine(node: string): string {
  if (node === "intent") return "正在解析意图...";
  if (node === "planner") return "生成调研规划...";
  if (node === "researcher") return "检索知识库并抓取外部来源...";
  if (node === "outliner") return "正在生成报告大纲...";
  if (node === "human_review") return "等待人工审核大纲...";
  if (node === "writer") return "开始并行撰写章节草稿...";
  if (node === "human_review_intent") return "等待人工确认意图...";
  return `${prettifyNodeLabel(node)}...`;
}

function deriveOutlineSections(raw: string): OutlineSectionView[] {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "[]") {
    return [
      {
        title: "固态电池技术全景",
        bullets: [
          "三大路线对比：硫化物 / 氧化物 / 聚合物",
          "核心技术瓶颈与突破进展（2024-2026）",
        ],
        tags: ["技术路线", "专利分布", "TRL 评级"],
      },
      {
        title: "全球竞争格局与主要玩家",
        bullets: ["中国阵营：宁德时代、比亚迪、国轩高科", "日韩竞争者：Toyota / Samsung SDI"],
        tags: ["市占率", "融资规模", "量产时间线"],
      },
      {
        title: "市场规模与增长预测",
        bullets: ["全球市场规模（2026-2035 CAGR 预测）", "分场景渗透率：乘用车 / 商用车 / 储能"],
        tags: ["TAM/SAM", "IDC 数据"],
      },
    ];
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => {
        const obj = (item ?? {}) as Record<string, unknown>;
        const title = String(obj.title ?? `章节 ${idx + 1}`);
        const bulletsRaw = Array.isArray(obj.points) ? obj.points : Array.isArray(obj.bullets) ? obj.bullets : [];
        const tagsRaw = Array.isArray(obj.tags) ? obj.tags : [];
        return {
          title,
          bullets: bulletsRaw.map((x) => String(x)),
          tags: tagsRaw.map((x) => String(x)),
        };
      });
    }
  } catch {
    // ignore and fallback below
  }
  return [{ title: "大纲解析中", bullets: [trimmed.slice(0, 120)], tags: ["待确认"] }];
}

function getIntentPayload(
  payload: Record<string, unknown>
): {
  intent?: ReportTask["intentData"];
  message?: string;
  options?: string[];
  nodeName?: string;
} {
  const message = typeof payload.message === "string" ? payload.message : undefined;
  const options = Array.isArray(payload.options) ? payload.options.map((x) => String(x)) : undefined;
  const metadata =
    typeof payload.metadata === "object" && payload.metadata !== null
      ? (payload.metadata as Record<string, unknown>)
      : undefined;
  const nodeName = metadata && typeof metadata.node_name === "string" ? metadata.node_name : undefined;
  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const intentRaw =
    data && typeof data.intent === "object" && data.intent !== null
      ? (data.intent as Record<string, unknown>)
      : undefined;
  if (!intentRaw) return { message, options, nodeName };

  return {
    message,
    options,
    nodeName,
    intent: {
      topic: typeof intentRaw.topic === "string" ? intentRaw.topic : undefined,
      report_type: typeof intentRaw.report_type === "string" ? intentRaw.report_type : undefined,
      scope: typeof intentRaw.scope === "string" ? intentRaw.scope : undefined,
      time_range: typeof intentRaw.time_range === "string" ? intentRaw.time_range : undefined,
      depth: typeof intentRaw.depth === "string" ? intentRaw.depth : undefined,
      style_instruction:
        typeof intentRaw.style_instruction === "string" ? intentRaw.style_instruction : undefined,
      output_format: typeof intentRaw.output_format === "string" ? intentRaw.output_format : undefined,
      industry: typeof intentRaw.industry === "string" ? intentRaw.industry : undefined,
    },
  };
}

function getOutlineFromPayload(payload: Record<string, unknown>): unknown[] {
  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const outlineRaw = data?.outline;
  if (Array.isArray(outlineRaw)) return outlineRaw;
  if (Array.isArray(payload.outline)) return payload.outline as unknown[];
  return [];
}

function normalizeOutlineForResume(raw: string): unknown[] {
  const txt = raw.trim();
  if (!txt) return [];
  try {
    const parsed = JSON.parse(txt) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveResumeNode(task: ReportTask): string | undefined {
  if (task.interruptNode === "human_review_intent") return "human_review_intent";
  if (task.interruptNode === "human_review") return "human_review";
  if (task.phase === "intent") return "human_review_intent";
  if (task.phase === "outline") return "human_review";
  return undefined;
}

export default function ReportAgentPage() {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const abortRef = useRef<AbortController | null>(null);

  const [form, setForm] = useState<GenerateForm>({
    userQuery: "",
    depth: "deep",
    output: "markdown",
    style: "academic",
    review: "manual",
    extra: "",
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["竞争格局分析"]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["内部知识库", "实时网络", "上传文档", "外部 API"]);
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [outlineDraft, setOutlineDraft] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [viewPhase, setViewPhase] = useState<Phase | null>(null);

  const activeTask = useMemo(() => tasks.find((x) => x.localId === activeId) ?? null, [tasks, activeId]);

  const updateTask = useCallback((id: string, patch: Partial<ReportTask>) => {
    setTasks((prev) => prev.map((t) => (t.localId === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));
  }, []);

  const appendTimeline = useCallback((id: string, line: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.localId === id ? { ...t, timeline: [...t.timeline, line], updatedAt: Date.now() } : t))
    );
  }, []);

  const consumeStream = useCallback(
    async (res: Response, localId: string) => {
      for await (const ev of iterateReportSseEvents(res)) {
        if (ev.type === "start") {
          setTasks((prev) =>
            prev.map((t) =>
              t.localId !== localId
                ? t
                : {
                    ...t,
                    threadId: ev.thread_id,
                    runtimeStatus: "running",
                    phase: t.phase === "init" ? "intent" : t.phase,
                    updatedAt: Date.now(),
                  }
            )
          );
          setViewPhase((prev) => prev ?? "intent");
          continue;
        }
        if (ev.type === "node_start") {
          const p = phaseFromNode(ev.node);
          updateTask(localId, { phase: p, runtimeStatus: "running" });
          setViewPhase(p);
          appendTimeline(localId, runningNodeLine(ev.node));
          continue;
        }
        if (ev.type === "node") {
          const p = phaseFromNode(ev.node);
          if (ev.state === "running") {
            updateTask(localId, { phase: p, runtimeStatus: "running" });
            setViewPhase(p);
            appendTimeline(localId, runningNodeLine(ev.node));
          } else {
            appendTimeline(localId, `${prettifyNodeLabel(ev.node)}完成。`);
            setTasks((prev) =>
              prev.map((t) =>
                t.localId === localId
                  ? { ...t, progress: Math.min(99, t.progress + 8), updatedAt: Date.now() }
                  : t
              )
            );
          }
          continue;
        }
        if (ev.type === "message") {
          const text = ev.data.content ?? "";
          setTasks((prev) =>
            prev.map((t) =>
              t.localId === localId
                ? {
                    ...t,
                    draftText: `${t.draftText}${text}`,
                    chunksDone: Math.min(t.chunksDone + 1, t.chunksTotal),
                    progress: Math.min(96, t.progress + 1),
                    updatedAt: Date.now(),
                  }
                : t
            )
          );
          continue;
        }
        if (ev.type === "interrupted") {
          const metadata =
            typeof ev.payload.metadata === "object" && ev.payload.metadata !== null
              ? (ev.payload.metadata as Record<string, unknown>)
              : undefined;
          const nodeName = metadata && typeof metadata.node_name === "string" ? metadata.node_name : undefined;
          const parsed = getIntentPayload(ev.payload);
          const isIntentReview = nodeName === "human_review_intent";
          const isOutlineReview = nodeName === "human_review";

          if (isIntentReview) {
            updateTask(localId, {
              runtimeStatus: "interrupted",
              phase: "intent",
              intentData: parsed.intent,
              interruptMessage: parsed.message,
              interruptNode: nodeName,
              interruptOptions: parsed.options,
            });
            setViewPhase("intent");
            appendTimeline(localId, "任务中断：请确认报告意图。");
          } else if (isOutlineReview) {
            const outline = getOutlineFromPayload(ev.payload);
            const outlineText = outline.length > 0 ? JSON.stringify(outline, null, 2) : "[]";
            updateTask(localId, {
              runtimeStatus: "interrupted",
              phase: "outline",
              outlineText,
              interruptMessage: parsed.message,
              interruptNode: nodeName,
              interruptOptions: parsed.options,
            });
            setViewPhase("outline");
            setOutlineDraft(outlineText);
            appendTimeline(localId, "任务中断：等待大纲审核。");
          } else {
            const outline = getOutlineFromPayload(ev.payload);
            if (outline.length > 0) {
              const outlineText = JSON.stringify(outline, null, 2);
              updateTask(localId, {
                runtimeStatus: "interrupted",
                phase: "outline",
                outlineText,
                interruptMessage: parsed.message,
                interruptNode: nodeName,
                interruptOptions: parsed.options,
              });
              setViewPhase("outline");
              setOutlineDraft(outlineText);
              appendTimeline(localId, "任务中断：等待大纲审核。");
            } else {
              updateTask(localId, {
                runtimeStatus: "interrupted",
                phase: "intent",
                intentData: parsed.intent,
                interruptMessage: parsed.message,
                interruptNode: nodeName,
                interruptOptions: parsed.options,
              });
              setViewPhase("intent");
              appendTimeline(localId, "任务中断：请确认报告意图。");
            }
          }
          continue;
        }
        if (ev.type === "done") {
          updateTask(localId, {
            runtimeStatus: "completed",
            phase: "final",
            progress: 100,
            chunksDone: 28,
            chunksTotal: 28,
          });
          setViewPhase("final");
          appendTimeline(localId, "任务完成：报告已生成。");
          continue;
        }
        if (ev.type === "error") {
          appendTimeline(localId, `异常：${ev.message}`);
        }
      }
    },
    [appendTimeline, updateTask]
  );

  const startGenerate = useCallback(async () => {
    const query = form.userQuery.trim();
    if (!query) {
      message.warning("请先输入研究主题");
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);

    const newTask: ReportTask = {
      localId: uid(),
      title: query.slice(0, 26),
      runtimeStatus: "draft",
      phase: "init",
      query,
      progress: 0,
      chunksDone: 0,
      chunksTotal: 28,
      timeline: ["已创建任务，等待启动。"],
      draftText: "",
      outlineText: "",
      updatedAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setActiveId(newTask.localId);
    setHasStarted(true);

    try {
      const res = await createReportGenerateStream({ user_query: query }, ac.signal);
      await consumeStream(res, newTask.localId);
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        message.error(e instanceof Error ? e.message : "启动失败");
        appendTimeline(newTask.localId, "启动失败。");
      }
    } finally {
      setLoading(false);
      if (abortRef.current === ac) abortRef.current = null;
    }
  }, [appendTimeline, consumeStream, form.userQuery, message]);

  const resumeTask = useCallback(
    async (action: ReportResumeAction, revisedOutline?: unknown[]) => {
      if (!activeTask?.threadId) {
        message.warning("当前任务没有 thread_id");
        return;
      }
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      const resumeNode = resolveResumeNode(activeTask);
      if (!resumeNode || (resumeNode !== "human_review_intent" && resumeNode !== "human_review")) {
        message.error("无法确定 resume 节点，请刷新状态后重试");
        setLoading(false);
        return;
      }
      try {
        const res = await createReportResumeStream(
          {
            thread_id: activeTask.threadId,
            action,
            updates: action === "revise" ? { outline: revisedOutline ?? normalizeOutlineForResume(outlineDraft) } : undefined,
            metadata: resumeNode ? { node_name: resumeNode } : undefined,
          },
          ac.signal
        );
        appendTimeline(activeTask.localId, action === "confirm" ? "已确认大纲，继续执行。" : "已提交修改大纲，继续执行。");
        await consumeStream(res, activeTask.localId);
      } catch (e) {
        if (!(e instanceof Error && e.name === "AbortError")) {
          message.error(e instanceof Error ? e.message : "恢复失败");
        }
      } finally {
        setLoading(false);
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [activeTask, appendTimeline, consumeStream, message, outlineDraft]
  );

  const refreshStatus = useCallback(async () => {
    if (!activeTask?.threadId) {
      message.warning("当前任务没有 thread_id");
      return;
    }
    try {
      const data = await getReportStatus(activeTask.threadId);
      const nextPhase = data.status === "completed" ? "final" : activeTask.phase;
      updateTask(activeTask.localId, { runtimeStatus: data.status, phase: nextPhase });
      setViewPhase(nextPhase);
      appendTimeline(activeTask.localId, `状态同步：${data.status}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "状态查询失败");
    }
  }, [activeTask, appendTimeline, message, updateTask]);

  const rollbackTo = useCallback(
    async (target: "planner" | "outliner") => {
      if (!activeTask?.threadId) {
        message.warning("当前任务没有 thread_id");
        return;
      }
      try {
        await rollbackReportToNode(activeTask.threadId, target);
        appendTimeline(activeTask.localId, `已回滚到 ${target}。`);
        message.success(`已回滚到 ${target}`);
      } catch (e) {
        message.error(e instanceof Error ? e.message : "回滚失败");
      }
    },
    [activeTask, appendTimeline, message]
  );

  const phaseIndex = Math.max(0, STEP_ITEMS.findIndex((s) => s.key === (activeTask?.phase ?? "intent")));
  const showHub = hasStarted && Boolean(activeTask);
  const activeViewPhase = viewPhase ?? activeTask?.phase ?? "intent";
  const viewPhaseIndex = Math.max(0, STEP_ITEMS.findIndex((s) => s.key === activeViewPhase));
  const outlineSections = useMemo(
    () => deriveOutlineSections((outlineDraft || activeTask?.outlineText || "").trim()),
    [activeTask?.outlineText, outlineDraft]
  );

  return (
    <Flex
      gap={12}
      style={{
        height: "calc(100dvh - 56px - 24px)",
        minHeight: 640,
        fontSize: 12,
      }}
    >
      <TaskSidebar
        tasks={tasks}
        activeId={activeId}
        tokenColorTextSecondary={token.colorTextSecondary}
        onCreate={() => {
          setActiveId(null);
          setViewPhase(null);
        }}
        onSelectTask={setActiveId}
        onResetViewPhase={() => setViewPhase(null)}
      />

      {showHub ? (
        <AgentHubPanel
          activeTask={activeTask}
          activeViewPhase={activeViewPhase}
          viewPhaseIndex={viewPhaseIndex}
          timelineVisual={timelineVisual}
        />
      ) : null}

      <MainWorkspacePanel
        hasStarted={hasStarted}
        activeTask={activeTask}
        activeViewPhase={activeViewPhase}
        phaseIndex={phaseIndex}
        form={form}
        loading={loading}
        selectedTypes={selectedTypes}
        selectedSources={selectedSources}
        outlineSections={outlineSections}
        onSetForm={setForm}
        onSetSelectedTypes={setSelectedTypes}
        onSetSelectedSources={setSelectedSources}
        onStartGenerate={() => void startGenerate()}
        onSetHasStarted={setHasStarted}
        onSetViewPhase={setViewPhase}
        onRefreshStatus={() => void refreshStatus()}
        onRollbackToPlanner={() => void rollbackTo("planner")}
        onResumeConfirm={() => void resumeTask("confirm")}
        onResumeRevise={(revisedOutline) => void resumeTask("revise", revisedOutline)}
        onAbort={() => abortRef.current?.abort()}
      />
    </Flex>
  );
}
