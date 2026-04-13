"use client";

import dynamic from "next/dynamic";

const CustomerServiceChatPanel = dynamic(() => import("./customer-service-chat-panel"), {
  ssr: false,
  loading: () => null,
});

export default function CustomerServicePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ margin: "0 -4px" }}>
      <CustomerServiceChatPanel />
    </div>
  );
}
