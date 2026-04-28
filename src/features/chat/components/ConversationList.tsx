"use client";

import { Conversations } from "@ant-design/x";
import { MessageOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ConversationItemType } from "@ant-design/x/es/conversations/interface";
import type { MenuProps } from "antd";
import { useMemo, useCallback } from "react";
import type { ChatSession } from "../types";

interface ConversationListProps {
  sessions: ChatSession[];
  activeId: string | null;
  handleActiveChange: (key: string | number) => void;
  handleNewChat: () => void;
  removeSession: (id: string) => void;
}

export function ConversationList({
  sessions,
  activeId,
  handleActiveChange,
  handleNewChat,
  removeSession,
}: ConversationListProps) {
  const conversationItems = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((s) => ({
          key: s.id,
          label: s.title,
          icon: <MessageOutlined />,
        })),
    [sessions]
  );

  const getMenu = useCallback(
    (conv: ConversationItemType): MenuProps => ({
      items: [
        {
          key: "del",
          icon: <DeleteOutlined />,
          label: "删除会话",
          danger: true,
          onClick: () => {
            void removeSession(String(conv.key));
          },
        },
      ],
    }),
    [removeSession]
  );

  return (
    <Conversations
      activeKey={activeId ?? undefined}
      onActiveChange={handleActiveChange}
      items={conversationItems}
      menu={getMenu}
      creation={{
        label: "新建对话",
        onClick: handleNewChat,
      }}
      style={{ flex: 1, minHeight: 0, padding: 8 }}
    />
  );
}
