"use client";

import dynamic from "next/dynamic";

const GraphServiceChatPanel = dynamic(() => import("./graph-service-chat-panel"), {
  ssr: false,
  loading: () => null,
});

export default function GraphServicePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ margin: "0 -4px" }}>
      <GraphServiceChatPanel />
    </div>
  );
}
