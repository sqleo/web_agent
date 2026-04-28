"use client";

import { BranchesOutlined } from "@ant-design/icons";
import { XProvider } from "@ant-design/x";
import xZhCN from "@ant-design/x/locale/zh_CN";
import { App, Button, Flex, Space, theme } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BubbleListRef } from "@ant-design/x/es/bubble/interface";

import {
  getAgentChatStreamUrl,
  getCustomerServiceChatStreamUrl,
  getGraphServiceChatStreamUrl,
} from "@/lib/agent-chat-url";

import { useChatSessions } from "../hooks/useChatSessions";
import { useChatStream } from "../hooks/useChatStream";
import { useChatTravel } from "../hooks/useChatTravel";

import { ConversationList } from "./ConversationList";
import { BubbleListWrapper } from "./BubbleListWrapper";
import { SenderWrapper } from "./SenderWrapper";
import { TravelModal } from "./TravelModal";
import { KnowledgeSelect } from "./KnowledgeSelect";
import { toBubbleItems } from "./message-serialize";

export const DEFAULT_CHAT_STORAGE_KEY = "web_agent_chat_sessions_v2";
export const CUSTOMER_SERVICE_CHAT_STORAGE_KEY = "web_agent_customer_service_chat_sessions_v2";
export const GRAPH_SERVICE_CHAT_STORAGE_KEY = "web_agent_graph_service_chat_sessions_v2";

export interface ChatPanelProps {
  storageKey?: string;
  welcomeText?: string;
  variant?: "default" | "customer-service" | "graph-service";
}

export function ChatPanel({
  storageKey = DEFAULT_CHAT_STORAGE_KEY,
  welcomeText,
  variant = "default",
}: ChatPanelProps) {
  return (
    <XProvider locale={xZhCN}>
      <App style={{ background: "transparent" }}>
        <ChatPanelInner storageKey={storageKey} welcomeText={welcomeText} variant={variant} />
      </App>
    </XProvider>
  );
}

function ChatPanelInner({
  storageKey,
  welcomeText,
  variant,
}: {
  storageKey: string;
  welcomeText?: string;
  variant: "default" | "customer-service" | "graph-service";
}) {
  const { token } = theme.useToken();
  const listRef = useRef<BubbleListRef>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedKbId, setSelectedKbId] = useState<number | "all">("all");

  const {
    sessions,
    activeId,
    handleNewChat,
    handleActiveChange,
    removeSession,
    persist,
  } = useChatSessions(storageKey, welcomeText, variant);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  const streamUrl = useMemo(() => {
    if (variant === "customer-service") {
      return getCustomerServiceChatStreamUrl();
    }
    if (variant === "graph-service") {
      return getGraphServiceChatStreamUrl();
    }
    return getAgentChatStreamUrl();
  }, [variant]);

  const buildAgentChatBody = useCallback(
    (message: string, threadId: string | null) => {
      const body: Record<string, unknown> = {
        message,
        thread_id: threadId,
      };
      if (variant === "customer-service" && selectedKbId !== "all") {
        body.knowledge_base_id = selectedKbId;
      }
      return JSON.stringify(body);
    },
    [variant, selectedKbId]
  );

  const {
    loading,
    pausedSessionId,
    handlePauseGeneration,
    handleResumeGeneration,
    handleSubmit,
  } = useChatStream(storageKey, streamUrl, buildAgentChatBody);

  const {
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
  } = useChatTravel(activeSession, storageKey, persist);

  const bubbleItems = useMemo(
    () => (activeSession ? toBubbleItems(activeSession.messages) : []),
    [activeSession]
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <ConversationList
          sessions={sessions}
          activeId={activeId}
          handleActiveChange={handleActiveChange}
          handleNewChat={handleNewChat}
          removeSession={removeSession}
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
          <BubbleListWrapper ref={listRef} items={bubbleItems} />
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
            {variant === "customer-service" ? (
              <KnowledgeSelect value={selectedKbId} onChange={setSelectedKbId} />
            ) : null}
            <Button
              size="small"
              icon={<BranchesOutlined />}
              disabled={loading || !activeSession.threadId}
              onClick={() => setTravelOpen(true)}
            >
              时间旅行
            </Button>
          </Space>

          <SenderWrapper
            loading={loading}
            pausedSessionId={pausedSessionId}
            activeSessionId={activeSession.id}
            activeSessionThreadId={activeSession.threadId}
            handlePauseGeneration={handlePauseGeneration}
            handleResumeGeneration={handleResumeGeneration}
            handleSubmit={handleSubmit}
          />
        </div>
      </Flex>

      <TravelModal
        open={travelOpen}
        onCancel={() => setTravelOpen(false)}
        onOk={() => void handleTravelConfirm()}
        confirmLoading={travelSubmitting}
        loading={travelLoading}
        travelCheckpoints={travelCheckpoints}
        travelCheckpointId={travelCheckpointId}
        setTravelCheckpointId={setTravelCheckpointId}
        travelMode={travelMode}
        setTravelMode={setTravelMode}
        travelForkInput={travelForkInput}
        setTravelForkInput={setTravelForkInput}
      />
    </Flex>
  );
}
