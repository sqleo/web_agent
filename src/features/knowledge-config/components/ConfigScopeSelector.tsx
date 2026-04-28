"use client";

import { Input, Select, Typography } from "antd";
import type { ScopeMode, KnowledgeBase } from "../types";

interface ConfigScopeSelectorProps {
  scopeMode: ScopeMode;
  setScopeMode: (mode: ScopeMode) => void;
  bizCode: string;
  setBizCode: (code: string) => void;
  kbId: number | undefined;
  setKbId: (id: number | undefined) => void;
  statusFilter: 0 | 1 | undefined;
  setStatusFilter: (status: 0 | 1 | undefined) => void;
  kbOptions: KnowledgeBase[];
  kbLoading: boolean;
  canQuery: boolean;
  total: number;
}

export function ConfigScopeSelector({
  scopeMode,
  setScopeMode,
  bizCode,
  setBizCode,
  kbId,
  setKbId,
  statusFilter,
  setStatusFilter,
  kbOptions,
  kbLoading,
  canQuery,
  total,
}: ConfigScopeSelectorProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm text-[var(--ant-color-text-secondary)]">作用域</span>
      <Select<ScopeMode>
        value={scopeMode}
        onChange={(m) => setScopeMode(m)}
        style={{ width: 120 }}
        options={[
          { value: "global", label: "全局" },
          { value: "biz", label: "业务" },
          { value: "kb", label: "知识库" },
        ]}
      />
      {scopeMode === "biz" && (
        <Input
          placeholder="业务编码 biz_code"
          value={bizCode}
          onChange={(e) => setBizCode(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
      )}
      {scopeMode === "kb" && (
        <Select<number>
          placeholder="选择知识库"
          loading={kbLoading}
          value={kbId}
          onChange={setKbId}
          style={{ minWidth: 220 }}
          options={kbOptions.map((k) => ({ value: k.id, label: k.name || `知识库 #${k.id}` }))}
          showSearch
          optionFilterProp="label"
        />
      )}
      <span className="text-sm text-[var(--ant-color-text-secondary)]">状态</span>
      <Select<0 | 1 | "all">
        value={statusFilter === undefined ? "all" : statusFilter}
        onChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
        style={{ width: 100 }}
        options={[
          { value: "all", label: "全部" },
          { value: 1, label: "启用" },
          { value: 0, label: "禁用" },
        ]}
      />
      {!canQuery && (
        <Typography.Text type="warning">
          {scopeMode === "biz" ? "请填写业务编码后加载" : "请选择知识库后加载"}
        </Typography.Text>
      )}
      {canQuery && (
        <Typography.Text type="secondary">
          共 {total} 条
        </Typography.Text>
      )}
    </div>
  );
}
