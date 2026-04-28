"use client";

import { Card, Empty, Typography } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { KnowledgeBase } from "../types";

interface KnowledgeBaseListProps {
  kbRows: KnowledgeBase[];
  loading: boolean;
}

function kbHref(kb: KnowledgeBase): string {
  const q = new URLSearchParams();
  if (kb.name) q.set("name", kb.name);
  const qs = q.toString();
  return qs ? `/knowledge/${kb.id}?${qs}` : `/knowledge/${kb.id}`;
}

export function KnowledgeBaseList({ kbRows, loading }: KnowledgeBaseListProps) {
  if (kbRows.length === 0 && !loading) {
    return <Empty description="暂无知识库，请先新建" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kbRows.map((kb) => (
        <Link key={kb.id} href={kbHref(kb)} className="block min-w-0">
          <Card
            hoverable
            className="h-full"
            cover={
              kb.thumbnail_url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--ant-color-fill-secondary)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    src={kb.thumbnail_url}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center bg-[var(--ant-color-fill-secondary)] text-[var(--ant-color-text-tertiary)]">
                  <DatabaseOutlined className="text-4xl" />
                </div>
              )
            }
          >
            <Typography.Title level={5} className="!mb-1 !mt-0 line-clamp-2">
              {kb.name}
            </Typography.Title>
            {kb.code ? (
              <Typography.Text type="secondary" className="mb-2 block text-xs">
                {kb.code}
              </Typography.Text>
            ) : null}
            <Typography.Paragraph type="secondary" className="!mb-0 line-clamp-3 text-sm">
              {kb.description?.trim() ? kb.description : "暂无描述"}
            </Typography.Paragraph>
            <Typography.Text type="secondary" className="mt-2 block text-xs">
              ID {kb.id}
            </Typography.Text>
          </Card>
        </Link>
      ))}
    </div>
  );
}
