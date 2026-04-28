"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { App } from "antd";
import { sessionsAtom, activeIdAtom } from "../stores/chat";
import type { ChatSession, StoredBubble } from "../types";
import { deleteAgentChatThread } from "../api/agent-chat";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStore(storageKey: string) {
  if (typeof window === "undefined") {
    return { sessions: [], activeId: null };
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return { sessions: [], activeId: null };
    }
    const data = JSON.parse(raw);
    if (!data.sessions?.length) {
      return { sessions: [], activeId: null };
    }
    return data;
  } catch {
    return { sessions: [], activeId: null };
  }
}

function saveStore(storageKey: string, sessions: ChatSession[], activeId: string | null) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ sessions, activeId }));
  } catch {
    /* ignore */
  }
}

function emptySession(welcomeText?: string): ChatSession {
  const id = uid();
  const defaultWelcome =
    "你好，我是助手。左侧可管理历史会话，下方可上传附件。发送消息后通过流式接口生成回复（支持思考过程与正文分段展示）。";
  return {
    id,
    title: "新对话",
    messages: [
      {
        key: "welcome",
        role: "ai",
        text: welcomeText ?? defaultWelcome,
      },
    ],
    updatedAt: Date.now(),
  };
}

export function useChatSessions(storageKey: string, welcomeText?: string, variant: "default" | "customer-service" | "graph-service" = "default") {
  const [sessions, setSessions] = useAtom(sessionsAtom);
  const [activeId, setActiveId] = useAtom(activeIdAtom);
  const { message: messageApi } = App.useApp();
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const s = loadStore(storageKey);
    if (s.sessions.length === 0) {
      const first = emptySession(welcomeText);
      setSessions([first]);
      setActiveId(first.id);
      saveStore(storageKey, [first], first.id);
    } else {
      setSessions(s.sessions);
      setActiveId(s.activeId ?? s.sessions[0]?.id ?? null);
    }
  }, [storageKey, welcomeText, setSessions, setActiveId]);

  const persist = useCallback(
    (nextSessions: ChatSession[], nextActive: string | null) => {
      setSessions(nextSessions);
      setActiveId(nextActive);
      saveStore(storageKey, nextSessions, nextActive);
    },
    [storageKey, setSessions, setActiveId]
  );

  const handleNewChat = useCallback(() => {
    const session = emptySession(welcomeText);
    persist([session, ...sessions], session.id);
  }, [sessions, persist, welcomeText]);

  const handleActiveChange = useCallback(
    (key: string | number) => {
      const id = String(key);
      setActiveId(id);
      saveStore(storageKey, sessions, id);
    },
    [sessions, storageKey, setActiveId]
  );

  const removeSession = useCallback(
    async (id: string) => {
      const target = sessions.find((s) => s.id === id);
      if (!target) {
        return;
      }
      const tid = target.threadId;
      if (tid) {
        try {
          await deleteAgentChatThread(tid, variant);
          messageApi.success("删除成功");
        } catch (e) {
          messageApi.error(e instanceof Error ? e.message : "删除对话失败");
          return;
        }
      }

      const next = sessions.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = emptySession(welcomeText);
        persist([fresh], fresh.id);
        return;
      }
      let nextActive = activeId;
      if (activeId === id) {
        nextActive = next[0].id;
      }
      persist(next, nextActive);
    },
    [sessions, activeId, persist, messageApi, welcomeText, variant]
  );

  return {
    sessions,
    activeId,
    activeIdRef,
    persist,
    handleNewChat,
    handleActiveChange,
    removeSession,
  };
}
