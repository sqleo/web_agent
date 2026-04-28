"use client";

import { ChatPanel, GRAPH_SERVICE_CHAT_STORAGE_KEY } from "@/features/chat/components/ChatPanel";

export default function GraphServiceChatPanel() {
  return (
    <ChatPanel
      variant="graph-service"
      storageKey={GRAPH_SERVICE_CHAT_STORAGE_KEY}
      welcomeText="您好，这里是智能 Graph 助手，将以流式方式回复。会话与「聊天」「智能客服」页相互独立。"
    />
  );
}
