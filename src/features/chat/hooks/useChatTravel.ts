"use client";

import { useState, useEffect, useCallback } from "react";
import { App } from "antd";
import { getAgentChatHistory, travelAgentChat } from "../api/agent-chat";
import type { ChatCheckpointItem, ChatSession } from "../types";

export function useChatTravel(activeSession: ChatSession | null, storageKey: string, setSessions: any) {
  const { message: messageApi } = App.useApp();
  const [travelOpen, setTravelOpen] = useState(false);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelSubmitting, setTravelSubmitting] = useState(false);
  const [travelCheckpoints, setTravelCheckpoints] = useState<ChatCheckpointItem[]>([]);
  const [travelCheckpointId, setTravelCheckpointId] = useState<string | undefined>();
  const [travelMode, setTravelMode] = useState<"fork" | "replay">("fork");
  const [travelForkInput, setTravelForkInput] = useState("");

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
      
      setSessions((prev: ChatSession[]) => {
        const next = prev.map((s) =>
          s.id === sessionId ? { ...s, threadId: newTid } : s
        );
        try {
          localStorage.setItem(storageKey, JSON.stringify({ sessions: next, activeId: sessionId }));
        } catch {
          /* ignore */
        }
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
    activeSession,
    messageApi,
    storageKey,
    travelCheckpointId,
    travelForkInput,
    travelMode,
    setSessions,
  ]);

  return {
    travelOpen,
    setTravelOpen,
    travelLoading,
    travelSubmitting,
    travelCheckpoints,
    travelCheckpointId,
    setTravelCheckpointId,
    travelMode,
    setTravelMode,
    travelForkInput,
    setTravelForkInput,
    handleTravelConfirm,
  };
}
