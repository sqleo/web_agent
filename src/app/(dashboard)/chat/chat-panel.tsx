"use client";

import { DeleteOutlined, MessageOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { Attachment } from "@ant-design/x/es/attachments";
import {
  Attachments,
  Bubble,
  Conversations,
  Sender,
  XProvider,
} from "@ant-design/x";
import type { BubbleListRef } from "@ant-design/x/es/bubble/interface";
import xZhCN from "@ant-design/x/locale/zh_CN";
import { App, Button, Flex, theme } from "antd";
import type { MenuProps } from "antd";
import type { ConversationItemType } from "@ant-design/x/es/conversations/interface";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [senderValue, setSenderValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    (id: string) => {
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
    [sessions, activeId, persist]
  );

  const getMenu = useCallback(
    (conv: ConversationItemType): MenuProps => ({
      items: [
        {
          key: "del",
          icon: <DeleteOutlined />,
          label: "删除会话",
          danger: true,
          onClick: () => removeSession(String(conv.key)),
        },
      ],
    }),
    [removeSession]
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

        if (
          !ac.signal.aborted &&
          !sawContentDelta &&
          !sawReasoningDelta
        ) {
          updateAssistantMsg((m) => ({
            text:
              m.text.trim() === ""
                ? "流已结束，但未收到正文或思考内容。请在后端确认是否在流中推送 type 为 text / thinking 的片段。"
                : m.text,
          }));
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
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
      }
    },
    [activeSession, files, messageApi]
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
            placeholder="输入消息，Enter 发送；右侧支持语音"
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
    </Flex>
  );
}
