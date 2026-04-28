"use client";

import { Avatar, Button, Card, Empty, Input, Space, Tag, Typography, Spin } from "antd";
import { ExportOutlined, SearchOutlined } from "@ant-design/icons";
import type { Vendor } from "../types";

interface AvailableVendorsCardProps {
  filteredMarket: Vendor[];
  loadingMarket: boolean;
  search: string;
  setSearch: (v: string) => void;
  filterCap: string | null;
  setFilterCap: (v: string | null) => void;
  allCapabilities: string[];
  installedByCode: Map<string, Vendor>;
  openAddModal: (vendor: Vendor, isInstalled: boolean) => void;
}

export function AvailableVendorsCard({
  filteredMarket,
  loadingMarket,
  search,
  setSearch,
  filterCap,
  setFilterCap,
  allCapabilities,
  installedByCode,
  openAddModal,
}: AvailableVendorsCardProps) {
  return (
    <Card size="small" title="可选模型" variant="borderless">
      <Input
        allowClear
        className="!mb-3"
        placeholder="搜索"
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Tag.CheckableTag checked={filterCap === null} onChange={() => setFilterCap(null)}>
          All
        </Tag.CheckableTag>
        {allCapabilities.map((c) => (
          <Tag.CheckableTag key={c} checked={filterCap === c} onChange={() => setFilterCap(c)}>
            {c}
          </Tag.CheckableTag>
        ))}
      </div>

      <Spin spinning={loadingMarket}>
        {filteredMarket.length === 0 ? (
          <Empty description="没有匹配的厂商" />
        ) : (
          <Space orientation="vertical" size={12} className="!w-full">
            {filteredMarket.map((v) => {
              const isInstalled = installedByCode.has(v.code);
              return (
                <div
                  key={v.code}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-solid p-3"
                  style={{ borderColor: "var(--ant-color-border-secondary)" }}
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <Avatar src={v.logo_url ?? undefined}>
                      {!v.logo_url ? v.name.slice(0, 1).toUpperCase() : null}
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Typography.Text strong>{v.name}</Typography.Text>
                        {v.doc_url ? (
                          <a href={v.doc_url} target="_blank" rel="noreferrer" aria-label="文档">
                            <ExportOutlined />
                          </a>
                        ) : null}
                      </div>
                      <Space size={4} wrap className="mt-1">
                        {(v.capabilities ?? []).map((c) => (
                          <Tag key={c}>{c}</Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    disabled={v.status !== 1}
                    onClick={() => openAddModal(v, isInstalled)}
                  >
                    {isInstalled ? "配置" : "+ 添加"}
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
