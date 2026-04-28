"use client";

import { Avatar, Button, Card, Empty, Space, Tag, Typography, Spin } from "antd";
import type { Vendor } from "../types";

interface InstalledVendorsCardProps {
  installed: Vendor[];
  market: Vendor[];
  loadingInstalled: boolean;
  openAddModal: (vendor: Vendor, isInstalled: boolean) => void;
}

export function InstalledVendorsCard({
  installed,
  market,
  loadingInstalled,
  openAddModal,
}: InstalledVendorsCardProps) {
  return (
    <Card size="small" title="添加了的模型" variant="borderless">
      <Spin spinning={loadingInstalled}>
        {installed.length === 0 ? (
          <Empty description="尚未添加厂商" />
        ) : (
          <Space orientation="vertical" size={12} className="!w-full">
            {installed.map((v) => {
              const template = market.find((m) => m.code === v.code);
              const caps = template?.capabilities ?? v.capabilities ?? [];
              return (
                <div
                  key={v.code}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-solid px-3 py-2"
                  style={{ borderColor: "var(--ant-color-border-secondary)" }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>{(v.name ?? v.code).slice(0, 1).toUpperCase()}</Avatar>
                    <div className="min-w-0">
                      <Typography.Text strong className="block">
                        {v.name}
                      </Typography.Text>
                      <Space size={4} wrap className="mt-1">
                        {caps.map((c) => (
                          <Tag key={c}>{c}</Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      const base = template ?? v;
                      openAddModal(base, true);
                    }}
                  >
                    配置
                  </Button>
                </div>
              );
            })}
          </Space>
        )}
      </Spin>
    </Card>
  );
}
