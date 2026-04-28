"use client";

import { ChatPanel, CUSTOMER_SERVICE_CHAT_STORAGE_KEY } from "@/features/chat/components/ChatPanel";

export default function CustomerServiceChatPanel() {
  return (
    <ChatPanel
      variant="customer-service"
      storageKey={CUSTOMER_SERVICE_CHAT_STORAGE_KEY}
      welcomeText="您好，我是智能客服助手，可协助您了解产品与服务相关问题。左侧可管理会话，下方支持上传附件；发送消息后将以流式回复您。上方可选择检索范围：默认在全部知识库中检索。"
    />
  );
}
