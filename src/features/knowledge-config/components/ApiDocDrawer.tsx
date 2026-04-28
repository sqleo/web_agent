"use client";

import { Drawer, Spin } from "antd";
import { MarkdownProse } from "@/app/(dashboard)/chat/markdown-prose";

interface ApiDocDrawerProps {
  open: boolean;
  onClose: () => void;
  apiMd: string;
  loading: boolean;
}

export function ApiDocDrawer({
  open,
  onClose,
  apiMd,
  loading,
}: ApiDocDrawerProps) {
  return (
    <Drawer
      title="Metadata 字段 API 说明"
      size="large"
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <MarkdownProse markdown={apiMd} />
      </Spin>
    </Drawer>
  );
}
