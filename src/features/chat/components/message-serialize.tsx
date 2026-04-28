"use client";

import type { BubbleItemType } from "@ant-design/x";
import { Think } from "@ant-design/x";
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import { Space, Tag, Typography } from "antd";
import { ChatMessageContent } from "./chat-message-content";
import { AssistantDemoBlocks } from "./assistant-demo-blocks";
import type { StoredBubble, ToolCallInfo, ReferenceInfo } from "../types";

function ToolCallTags({ items }: { items: ToolCallInfo[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Space size={[4, 4]} wrap style={{ marginBottom: 4 }}>
      {items.map((t, i) => (
        <Tag key={i} icon={<SearchOutlined />} color="success">
          {t.content}
        </Tag>
      ))}
    </Space>
  );
}

function ReferencesList({ items }: { items: ReferenceInfo[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
      {items.map((r, i) => (
        <Tag key={i} color="default" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }}>
          [{r.tool}] {r.content.slice(0, 80)}
          {r.content.length > 80 ? "…" : ""}
        </Tag>
      ))}
    </Space>
  );
}

export function toBubbleItems(stored: StoredBubble[]): BubbleItemType[] {
  return stored.map((m) => {
    if (m.role === "user") {
      return {
        key: m.key,
        role: "user",
        content: <ChatMessageContent text={m.text} />,
      };
    }
    if (m.aiVariant === "demo_full") {
      return {
        key: m.key,
        role: "ai",
        content: <AssistantDemoBlocks full />,
      };
    }
    if (m.aiVariant === "demo_short") {
      return {
        key: m.key,
        role: "ai",
        content: <AssistantDemoBlocks full={false} />,
      };
    }

    const hasReasoning = Boolean(m.reasoning?.trim());
    const hasText = Boolean(m.text?.trim());
    const hasTools = Boolean(m.toolCalls?.length);
    const hasRefs = Boolean(m.references?.length);
    const isLoading = !hasReasoning && !hasText && !hasTools;

    if (isLoading) {
      return {
        key: m.key,
        role: "ai",
        content: (
          <Space size="small">
            <LoadingOutlined />
            <Typography.Text type="secondary">思考中…</Typography.Text>
          </Space>
        ),
      };
    }

    const parts: React.ReactNode[] = [];

    if (hasTools) {
      parts.push(<ToolCallTags key="tools" items={m.toolCalls!} />);
    }

    if (hasReasoning) {
      parts.push(
        <Think key="think" title="思考过程" defaultExpanded={!hasText}>
          <ChatMessageContent text={m.reasoning!} />
        </Think>
      );
    }

    if (hasText) {
      parts.push(<ChatMessageContent key="text" text={m.text} />);
    } else if (!hasReasoning) {
      parts.push(
        <Typography.Text key="empty" type="secondary">
          …
        </Typography.Text>
      );
    }

    if (hasRefs) {
      parts.push(<ReferencesList key="refs" items={m.references!} />);
    }

    if (parts.length === 1) {
      return { key: m.key, role: "ai", content: parts[0] };
    }

    return {
      key: m.key,
      role: "ai",
      content: (
        <Space orientation="vertical" size="small" style={{ width: "100%" }}>
          {parts}
        </Space>
      ),
    };
  });
}
