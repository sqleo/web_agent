"use client";

import dynamic from "next/dynamic";

const ChatPanel = dynamic(() => import("@/features/chat/components/ChatPanel").then((m) => m.ChatPanel), {
  ssr: false,
  loading: () => null,
});

export default function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ margin: "0 -4px" }}>
      <ChatPanel />
    </div>
  );
}
