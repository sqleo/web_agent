"use client";

import { useAtom } from "jotai";
import { useCallback, useRef } from "react";
import { App } from "antd";
import {
  sessionsAtom,
  activeIdAtom,
  loadingAtom,
  pausedSessionIdAtom,
  filesAtom,
  senderValueAtom,
} from "../stores/chat";
import { iterateAgentSseEvents } from "../api/agent-chat-sse";
import { pauseAgentChat, resumeAgentChat } from "../api/agent-chat";
import { getAccessToken } from "@/api/auth-storage";
import type { ChatSession, StoredBubble } from "../types";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveStore(storageKey: string, sessions: ChatSession[], activeId: string | null) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ sessions, activeId }));
  } catch {
    /* ignore */
  }
}

export function useChatStream(
  storageKey: string,
  streamUrl: string,
  buildAgentChatBody: (message: string, threadId: string | null) => string
) {
  const [sessions, setSessions] = useAtom(sessionsAtom);
  const [activeId] = useAtom(activeIdAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [pausedSessionId, setPausedSessionId] = useAtom(pausedSessionIdAtom);
  const [files, setFiles] = useAtom(filesAtom);
  const [senderValue, setSenderValue] = useAtom(senderValueAtom);

  const { message: messageApi } = App.useApp();
  const streamAbortRef = useRef<AbortController | null>(null);
  const streamContextRef = useRef<{ sessionId: string; assistantKey: string } | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

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
          saveStore(storageKey, next, activeId);
          return next;
        });
      };

      for await (const ev of iterateAgentSseEvents(res)) {
        if (ev.type === "start") {
          setSessions((prev) => {
            const next = prev.map((s) =>
              s.id === sessionId ? { ...s, threadId: ev.thread_id } : s
            );
            saveStore(storageKey, next, activeId);
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
            saveStore(storageKey, next, activeId);
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
    [messageApi, storageKey, setSessions, activeId]
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
  }, [loading, activeSession, messageApi, setPausedSessionId]);

  const handleResumeGeneration = useCallback(async () => {
    if (!activeSession?.threadId || pausedSessionId !== activeSession.id) {
      return;
    }
    const token = getAccessToken();
    if (!token) {
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
      Authorization: `Bearer ${token}`,
    };

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

    const body = buildAgentChatBody("", tid);

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
  }, [activeSession, buildAgentChatBody, consumeAgentSseLoop, messageApi, pausedSessionId, streamUrl, setLoading, setPausedSessionId]);

  const handleSubmit = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !activeSession) {
        return;
      }
      const token = getAccessToken();
      if (!token) {
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
        saveStore(storageKey, next, activeId);
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
        Authorization: `Bearer ${token}`,
      };

      const body = buildAgentChatBody(userLine, threadIdForApi);

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
            saveStore(storageKey, next, activeId);
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
    [activeSession, buildAgentChatBody, consumeAgentSseLoop, files, messageApi, storageKey, streamUrl, activeId, setSessions, setFiles, setLoading, setPausedSessionId, setSenderValue]
  );

  return {
    loading,
    pausedSessionId,
    files,
    setFiles,
    senderValue,
    setSenderValue,
    handlePauseGeneration,
    handleResumeGeneration,
    handleSubmit,
    streamContextRef,
  };
}
