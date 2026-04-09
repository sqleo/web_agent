"use client";

import {
  BranchesOutlined,
  DeleteOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import type { Attachment } from "@ant-design/x/es/attachments";
import {
  Attachments,
  Bubble,
  Conversations,
  Sender,
  XProvider,
} from "@ant-design/x";
import type { BubbleListRef } from "@ant-design/x/es/bubble/interface";
import type { ActionsComponents } from "@ant-design/x/es/sender/interface";
import xZhCN from "@ant-design/x/locale/zh_CN";
import { App, Button, Flex, Input, Modal, Radio, Select, Space, Spin, theme, Typography } from "antd";
import type { MenuProps } from "antd";
import type { ConversationItemType } from "@ant-design/x/es/conversations/interface";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  type ChatCheckpointItem,
  deleteAgentChatThread,
  getAgentChatHistory,
  pauseAgentChat,
  resumeAgentChat,
  travelAgentChat,
} from "@/api/agent-chat";
import { getAuthorizationHeaderValue } from "@/api/auth-storage";
import { iterateAgentSseEvents } from "@/lib/agent-chat-sse";
import { getAgentChatStreamUrl } from "@/lib/agent-chat-url";
import { toBubbleItems, type StoredBubble } from "./message-serialize";

const STORAGE_KEY = "web_agent_chat_sessions_v2";

type ChatSession = {
  id: string;
  title: string;
  messages: StoredBubble[];
  updatedAt: number;
  /** 服务端会话线程，来自 SSE `done.thread_id`；首轮传 `null` */
  threadId?: string | null;
};

type Store = {
  sessions: ChatSession[];
  activeId: string | null;
};

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStore(): Store {
  if (typeof window === "undefined") {
    return { sessions: [], activeId: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sessions: [], activeId: null };
    }
    const data = JSON.parse(raw) as Store;
    if (!data.sessions?.length) {
      return { sessions: [], activeId: null };
    }
    return data;
  } catch {
    return { sessions: [], activeId: null };
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function emptySession(): ChatSession {
  const id = uid();
  return {
    id,
    title: "新对话",
    messages: [
      {
        key: "welcome",
        role: "ai",
        text: "你好，我是助手。左侧可管理历史会话，下方可上传附件。发送消息后通过流式接口生成回复（支持思考过程与正文分段展示）。",
      },
    ],
    updatedAt: Date.now(),
  };
}

export function ChatPanel() {
  return (
    <XProvider locale={xZhCN}>
      <App style={{ background: "transparent" }}>
        <ChatPanelInner />
      </App>
    </XProvider>
  );
}

function ChatPanelInner() {
  const { token } = theme.useToken();
  const { message: messageApi } = App.useApp();
  const listRef = useRef<BubbleListRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const activeIdRef = useRef<string | null>(null);
  /** 暂停后用于「继续」时定位同一条助手气泡并续写 SSE */
  const streamContextRef = useRef<{ sessionId: string; assistantKey: string } | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [senderValue, setSenderValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** 用户点了「暂停」且本会话在等待继续（可与时间旅行后的 resume 配合） */
  const [pausedSessionId, setPausedSessionId] = useState<string | null>(null);

  const [travelOpen, setTravelOpen] = useState(false);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelSubmitting, setTravelSubmitting] = useState(false);
  const [travelCheckpoints, setTravelCheckpoints] = useState<ChatCheckpointItem[]>([]);
  const [travelCheckpointId, setTravelCheckpointId] = useState<string | undefined>();
  const [travelMode, setTravelMode] = useState<"fork" | "replay">("fork");
  const [travelForkInput, setTravelForkInput] = useState("");

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    setMounted(true);
    const s = loadStore();
    if (s.sessions.length === 0) {
      const first = emptySession();
      const next = { sessions: [first], activeId: first.id };
      setSessions(next.sessions);
      setActiveId(next.activeId);
      saveStore(next);
    } else {
      setSessions(s.sessions);
      setActiveId(s.activeId ?? s.sessions[0]?.id ?? null);
    }
  }, []);

  const persist = useCallback((nextSessions: ChatSession[], nextActive: string | null) => {
    setSessions(nextSessions);
    setActiveId(nextActive);
    saveStore({ sessions: nextSessions, activeId: nextActive });
  }, []);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  const bubbleItems = useMemo(
    () => (activeSession ? toBubbleItems(activeSession.messages) : []),
    [activeSession]
  );

  const conversationItems = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((s) => ({
          key: s.id,
          label: s.title,
          icon: <MessageOutlined />,
        })),
    [sessions]
  );

  const scrollBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: "bottom", behavior });
    });
  }, []);

  useEffect(() => {
    scrollBottom("auto");
    const t1 = window.setTimeout(() => scrollBottom("smooth"), 80);
    const t2 = window.setTimeout(() => scrollBottom("smooth"), 350);
    const t3 = window.setTimeout(() => scrollBottom("smooth"), 800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [bubbleItems, scrollBottom]);

  const handleNewChat = useCallback(() => {
    const session = emptySession();
    persist([session, ...sessions], session.id);
  }, [sessions, persist]);

  const handleActiveChange = useCallback(
    (key: string | number) => {
      const id = String(key);
      setActiveId(id);
      saveStore({ sessions, activeId: id });
    },
    [sessions]
  );

  const removeSession = useCallback(
    async (id: string) => {
      const target = sessions.find((s) => s.id === id);
      if (!target) {
        return;
      }
      const tid = target.threadId;
      if (tid) {
        const authHeader = getAuthorizationHeaderValue();
        if (!authHeader) {
          messageApi.error("请先登录");
          return;
        }
        try {
          const data = await deleteAgentChatThread(tid);
          messageApi.success(data.message || "删除成功");
        } catch (e) {
          messageApi.error(e instanceof Error ? e.message : "删除对话失败");
          return;
        }
      }

      const next = sessions.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = emptySession();
        persist([fresh], fresh.id);
        return;
      }
      let nextActive = activeId;
      if (activeId === id) {
        nextActive = next[0].id;
      }
      persist(next, nextActive);
    },
    [sessions, activeId, persist, messageApi]
  );

  const getMenu = useCallback(
    (conv: ConversationItemType): MenuProps => ({
      items: [
        {
          key: "del",
          icon: <DeleteOutlined />,
          label: "删除会话",
          danger: true,
          onClick: () => {
            void removeSession(String(conv.key));
          },
        },
      ],
    }),
    [removeSession]
  );

  const consumeAgentSseLoop = useCallback(
    async (
      res: Response,
      sessionId: string,
      assistantKey: string,
      ac: AbortController
    ) => {
      let sawContentDelta = false;
      let sawReasoningDelta = false;

      const updateAssistantMsg = (
        updater: (msg: StoredBubble) => Partial<StoredBubble>
      ) => {
        setSessions((prev) => {
          const next = prev.map((s) => {
            if (s.id !== sessionId) {
              return s;
            }
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.key === assistantKey ? { ...m, ...updater(m) } : m
              ),
              updatedAt: Date.now(),
            };
          });
          saveStore({ sessions: next, activeId: activeIdRef.current });
          return next;
        });
      };

      for await (const ev of iterateAgentSseEvents(res)) {
        if (ev.type === "start") {
          setSessions((prev) => {
            const next = prev.map((s) =>
              s.id === sessionId ? { ...s, threadId: ev.thread_id } : s
            );
            saveStore({ sessions: next, activeId: activeIdRef.current });
            return next;
          });
          continue;
        }

        if (ev.type === "error") {
          messageApi.error(ev.message);
          updateAssistantMsg((m) => ({
            text: m.text || ev.message,
          }));
          break;
        }

        if (ev.type === "text") {
          if (ev.content) {
            sawContentDelta = true;
          }
          updateAssistantMsg((m) => ({
            text: m.text + ev.content,
          }));
        }

        if (ev.type === "thinking") {
          if (ev.content) {
            sawReasoningDelta = true;
          }
          updateAssistantMsg((m) => ({
            reasoning: (m.reasoning ?? "") + ev.content,
          }));
        }

        if (ev.type === "tool") {
          updateAssistantMsg((m) => ({
            toolCalls: [...(m.toolCalls ?? []), { content: ev.content }],
          }));
        }

        if (ev.type === "reference") {
          updateAssistantMsg((m) => ({
            references: [
              ...(m.references ?? []),
              { tool: ev.tool, content: ev.content },
            ],
          }));
        }

        if (ev.type === "done") {
          setSessions((prev) => {
            const next = prev.map((s) =>
              s.id === sessionId ? { ...s, threadId: ev.thread_id } : s
            );
            saveStore({ sessions: next, activeId: activeIdRef.current });
            return next;
          });
        }
      }

      if (!ac.signal.aborted && !sawContentDelta && !sawReasoningDelta) {
        updateAssistantMsg((m) => ({
          text:
            m.text.trim() === ""
              ? "流已结束，但未收到正文或思考内容。请在后端确认是否在流中推送 type 为 text / thinking 的片段。"
              : m.text,
        }));
      }
    },
    [messageApi]
  );

  const handlePauseGeneration = useCallback(async () => {
    if (!loading || !activeSession) {
      return;
    }
    const sid = activeSession.id;
    if (activeSession.threadId) {
      try {
        await pauseAgentChat(activeSession.threadId, { reason: "user_request" });
        messageApi.success("已暂停生成");
      } catch (e) {
        messageApi.error(e instanceof Error ? e.message : "暂停失败");
        return;
      }
      setPausedSessionId(sid);
    }
    streamAbortRef.current?.abort();
  }, [loading, activeSession, messageApi]);

  const handleResumeGeneration = useCallback(async () => {
    if (!activeSession?.threadId || pausedSessionId !== activeSession.id) {
      return;
    }
    const authHeader = getAuthorizationHeaderValue();
    if (!authHeader) {
      messageApi.error("请先登录");
      return;
    }
    const sessionId = activeSession.id;
    const tid = activeSession.threadId;
    let assistantKey = streamContextRef.current?.assistantKey;
    if (streamContextRef.current?.sessionId !== sessionId) {
      assistantKey = undefined;
    }
    if (!assistantKey) {
      const lastAi = [...activeSession.messages].reverse().find((m) => m.role === "ai");
      assistantKey = lastAi?.key;
    }
    if (!assistantKey) {
      messageApi.error("无法定位助手消息，请重新发送一条消息");
      return;
    }

    streamContextRef.current = { sessionId, assistantKey };
    setPausedSessionId(null);
    streamAbortRef.current?.abort();
    const ac = new AbortController();
    streamAbortRef.current = ac;
    setLoading(true);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: authHeader,
    };
    const streamUrl = getAgentChatStreamUrl();

    try {
      await resumeAgentChat(tid, {
        resume_value: { action: "continue_generation" },
      });
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "继续生成失败");
      setPausedSessionId(sessionId);
      setLoading(false);
      return;
    }

    /** 恢复后拉流：需与后端约定空 message 表示续写；若不符请改为专用字段 */
    const body = JSON.stringify({
      thread_id: tid,
      message: "",
    });

    try {
      const res = await fetch(streamUrl, {
        method: "POST",
        headers,
        body,
        signal: ac.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        messageApi.error(errText.slice(0, 280) || `请求失败（${res.status}）`);
        setPausedSessionId(sessionId);
        streamContextRef.current = null;
        return;
      }

      await consumeAgentSseLoop(res, sessionId, assistantKey, ac);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      const msg = e instanceof Error ? e.message : "流式连接失败";
      messageApi.error(msg);
      streamContextRef.current = null;
    } finally {
      setLoading(false);
      if (streamAbortRef.current === ac) {
        streamAbortRef.current = null;
      }
      if (!ac.signal.aborted) {
        streamContextRef.current = null;
        setPausedSessionId(null);
      }
    }
  }, [activeSession, consumeAgentSseLoop, messageApi, pausedSessionId]);

  useEffect(() => {
    if (!travelOpen || !activeSession?.threadId) {
      return;
    }
    let cancelled = false;
    setTravelLoading(true);
    void (async () => {
      try {
        const data = await getAgentChatHistory(activeSession.threadId!);
        if (cancelled) {
          return;
        }
        setTravelCheckpoints(data.checkpoints);
        setTravelCheckpointId(data.checkpoints[0]?.checkpoint_id);
      } catch (e) {
        if (!cancelled) {
          messageApi.error(e instanceof Error ? e.message : "加载 checkpoint 失败");
          setTravelCheckpoints([]);
        }
      } finally {
        if (!cancelled) {
          setTravelLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [travelOpen, activeSession?.threadId, messageApi]);

  const handleTravelConfirm = useCallback(async () => {
    if (!activeSession?.threadId || !travelCheckpointId) {
      messageApi.warning("请选择 checkpoint");
      return;
    }
    setTravelSubmitting(true);
    try {
      const data = await travelAgentChat(activeSession.threadId, {
        checkpoint_id: travelCheckpointId,
        mode: travelMode,
        new_input:
          travelMode === "fork" && travelForkInput.trim()
            ? travelForkInput.trim()
            : undefined,
      });
      messageApi.success(data.message || "时间旅行成功");
      const sessionId = activeSession.id;
      const newTid = data.new_thread_id ?? data.thread_id;
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === sessionId ? { ...s, threadId: newTid } : s
        );
        saveStore({ sessions: next, activeId: activeIdRef.current });
        return next;
      });
      setTravelOpen(false);
      setTravelForkInput("");
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "时间旅行失败");
    } finally {
      setTravelSubmitting(false);
    }
  }, [
    activeSession?.id,
    activeSession?.threadId,
    messageApi,
    travelCheckpointId,
    travelForkInput,
    travelMode,
  ]);

  /** 暂停待继续时，右侧圆钮为「继续」（与生成中的暂停钮同一位置）；发新消息可用 Enter */
  const renderSenderSuffix = useCallback(
    (oriNode: ReactNode, { components }: { components: ActionsComponents }) => {
      const showResume =
        !loading &&
        pausedSessionId === activeSession?.id &&
        Boolean(activeSession?.threadId);

      if (!showResume) {
        return oriNode;
      }

      const { SpeechButton } = components;
      return (
        <Flex align="center" gap={4}>
          <SpeechButton />
          <Button
            type="primary"
            shape="circle"
            icon={<PlayCircleOutlined />}
            aria-label="继续生成"
            onClick={() => {
              void handleResumeGeneration();
            }}
          />
        </Flex>
      );
    },
    [activeSession?.id, activeSession?.threadId, handleResumeGeneration, loading, pausedSessionId]
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !activeSession) {
        return;
      }
      const authHeader = getAuthorizationHeaderValue();
      if (!authHeader) {
        messageApi.error("请先登录");
        return;
      }
      setSenderValue("");

      const sessionId = activeSession.id;
      const threadIdForApi = activeSession.threadId ?? null;
      const fileNames = files.map((f) => f.name).filter(Boolean);
      const userLine =
        fileNames.length > 0 ? `${t}\n（附件：${fileNames.join("、")}）` : t;

      const userMsg: StoredBubble = {
        key: uid(),
        role: "user",
        text: userLine,
      };

      const assistantKey = uid();
      const assistantMsg: StoredBubble = {
        key: assistantKey,
        role: "ai",
        text: "",
      };

      streamContextRef.current = { sessionId, assistantKey };
      setPausedSessionId(null);

      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId) {
            return s;
          }
          const title =
            s.title === "新对话" && t ? t.slice(0, 24) || "新对话" : s.title;
          return {
            ...s,
            title,
            updatedAt: Date.now(),
            messages: [...s.messages, userMsg, assistantMsg],
          };
        });
        saveStore({ sessions: next, activeId: activeIdRef.current });
        return next;
      });

      setFiles([]);
      streamAbortRef.current?.abort();
      const ac = new AbortController();
      streamAbortRef.current = ac;
      setLoading(true);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: authHeader,
      };

      const streamUrl = getAgentChatStreamUrl();
      const body = JSON.stringify({
        message: userLine,
        thread_id: threadIdForApi,
      });

      try {
        const res = await fetch(streamUrl, {
          method: "POST",
          headers,
          body,
          signal: ac.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          messageApi.error(errText.slice(0, 280) || `请求失败（${res.status}）`);
          streamContextRef.current = null;
          setSessions((prev) => {
            const next = prev.map((s) => {
              if (s.id !== sessionId) {
                return s;
              }
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.key === assistantKey
                    ? { ...m, text: m.text || `请求失败（${res.status}）` }
                    : m
                ),
                updatedAt: Date.now(),
              };
            });
            saveStore({ sessions: next, activeId: activeIdRef.current });
            return next;
          });
          return;
        }

        await consumeAgentSseLoop(res, sessionId, assistantKey, ac);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        streamContextRef.current = null;
        const msg = e instanceof Error ? e.message : "流式连接失败";
        messageApi.error(msg);
        setSessions((prev) => {
          const next = prev.map((s) => {
            if (s.id !== sessionId) {
              return s;
            }
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.key === assistantKey ? { ...m, text: m.text || msg } : m
              ),
              updatedAt: Date.now(),
            };
          });
          saveStore({ sessions: next, activeId: activeIdRef.current });
          return next;
        });
      } finally {
        setLoading(false);
        if (streamAbortRef.current === ac) {
          streamAbortRef.current = null;
        }
        if (!ac.signal.aborted) {
          streamContextRef.current = null;
        }
      }
    },
    [activeSession, consumeAgentSseLoop, files, messageApi]
  );

  if (!mounted || !activeSession) {
    return null;
  }

  return (
    <Flex
      gap={0}
      style={{
        height: "calc(100dvh - 56px - 48px)",
        minHeight: 420,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        overflow: "hidden",
        background: token.colorBgContainer,
      }}
    >
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          background: token.colorFillAlter,
        }}
      >
        <Conversations
          activeKey={activeId ?? undefined}
          onActiveChange={handleActiveChange}
          items={conversationItems}
          menu={getMenu}
          creation={{
            label: "新建对话",
            onClick: handleNewChat,
          }}
          style={{ flex: 1, minHeight: 0, padding: 8 }}
        />
      </div>

      <Flex
        vertical
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "8px 12px",
          }}
        >
          <Bubble.List
            ref={listRef}
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            styles={{
              root: {
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              },
              scroll: {
                flex: 1,
                minHeight: 0,
                overflow: "auto",
              },
            }}
            role={{
              user: { placement: "end" },
              ai: { placement: "start", variant: "shadow" },
            }}
            items={bubbleItems}
            autoScroll
          />
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "10px 12px 12px",
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorFillAlter,
          }}
        >
          <Space wrap size={8} style={{ marginBottom: 10 }}>
            <Button
              size="small"
              icon={<BranchesOutlined />}
              disabled={loading || !activeSession.threadId}
              onClick={() => setTravelOpen(true)}
            >
              时间旅行
            </Button>
          </Space>
          {files.length > 0 ? (
            <Attachments
              items={files}
              onChange={(info) => {
                setFiles(info.fileList as Attachment[]);
              }}
              style={{ marginBottom: 10 }}
            />
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            tabIndex={-1}
            className="hidden"
            onChange={(e) => {
              const list = e.target.files;
              if (!list?.length) {
                return;
              }
              setFiles((prev) => {
                const next = [...prev];
                Array.from(list).forEach((file, i) => {
                  next.push({
                    uid: `${Date.now()}-${i}`,
                    name: file.name,
                    status: "done",
                    originFileObj: file as Attachment["originFileObj"],
                  });
                });
                return next;
              });
              e.target.value = "";
            }}
          />
          <Sender
            allowSpeech
            loading={loading}
            value={senderValue}
            onChange={(v) => setSenderValue(v)}
            placeholder="输入消息，Enter 发送；支持语音；生成中右侧圆钮暂停；暂停后同位置圆钮继续"
            suffix={renderSenderSuffix}
            onCancel={() => {
              void handlePauseGeneration();
            }}
            prefix={
              <Button
                type="text"
                aria-label="上传附件"
                icon={<PaperClipOutlined />}
                onClick={() => fileInputRef.current?.click()}
              />
            }
            onSubmit={(v) => {
              void handleSubmit(v);
            }}
            onPasteFile={(fileList) => {
              setFiles((prev) => {
                const next = [...prev];
                Array.from(fileList).forEach((file, i) => {
                  next.push({
                    uid: `${Date.now()}-${i}`,
                    name: file.name,
                    status: "done",
                    originFileObj: file as Attachment["originFileObj"],
                  });
                });
                return next;
              });
            }}
          />
        </div>
      </Flex>

      <Modal
        title="时间旅行"
        open={travelOpen}
        onCancel={() => setTravelOpen(false)}
        onOk={() => void handleTravelConfirm()}
        confirmLoading={travelSubmitting}
        okText="执行"
        destroyOnHidden
      >
        <Spin spinning={travelLoading}>
          <Space orientation="vertical" size="middle" className="w-full">
            <Typography.Text type="secondary">
              fork 会创建新分支并可能返回新 thread_id；replay 在当前线程重放。之后可与「继续生成」配合从中断点恢复。
            </Typography.Text>
            <div className="w-full">
              <div className="mb-1">Checkpoint</div>
              <Select
                className="w-full"
                placeholder="选择 checkpoint"
                value={travelCheckpointId}
                onChange={(v) => setTravelCheckpointId(v)}
                options={travelCheckpoints.map((c) => ({
                  value: c.checkpoint_id,
                  label: `${c.timestamp} · ${c.content_preview.slice(0, 40)}${
                    c.content_preview.length > 40 ? "…" : ""
                  }`,
                }))}
                notFoundContent={travelLoading ? <Spin size="small" /> : undefined}
              />
            </div>
            <Radio.Group
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value)}
            >
              <Radio value="fork">fork（新分支）</Radio>
              <Radio value="replay">replay（重放）</Radio>
            </Radio.Group>
            {travelMode === "fork" ? (
              <Input.TextArea
                placeholder="可选：分叉后的新输入"
                value={travelForkInput}
                onChange={(e) => setTravelForkInput(e.target.value)}
                rows={3}
              />
            ) : null}
          </Space>
        </Spin>
      </Modal>
    </Flex>
  );
}
