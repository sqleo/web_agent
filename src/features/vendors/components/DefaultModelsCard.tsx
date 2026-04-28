"use client";

import { Card, Empty, Select, Space, Tag, Tooltip, Typography, Spin } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import type { GlobalLlmSettings, AvailableModelEntry } from "../types";
import { ROW_KEY_TO_CAPABILITY, buildGroupedOptionsFromAvailable } from "@/lib/vendor-models";

const DEFAULT_MODEL_ROWS: { key: string; label: string; required?: boolean }[] = [
  { key: "llm", label: "LLM", required: true },
  { key: "embedding", label: "Embedding" },
  { key: "vlm", label: "VLM" },
  { key: "asr", label: "ASR" },
  { key: "rerank", label: "Rerank" },
  { key: "tts", label: "TTS" },
];

interface DefaultModelsCardProps {
  globalSettings: GlobalLlmSettings | null;
  availableModels: AvailableModelEntry[];
  defaults: Record<string, string>;
  settingsBusy: boolean;
  updateDefault: (rowKey: string, value: string | null) => Promise<void>;
}

export function DefaultModelsCard({
  globalSettings,
  availableModels,
  defaults,
  settingsBusy,
  updateDefault,
}: DefaultModelsCardProps) {
  return (
    <Card size="small" title="设置默认模型" variant="borderless">
      {globalSettings ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag color={globalSettings.is_complete ? "success" : "warning"}>
            {globalSettings.is_complete
              ? "核心项已完成（Chat + Embedding）"
              : "请完成 Chat 与 Embedding"}
          </Tag>
          {globalSettings.completion &&
            Object.keys(globalSettings.completion).length > 0 && (
              <Space size={4} wrap className="text-xs">
                {Object.entries(globalSettings.completion).map(([k, ok]) => (
                  <Tag key={k} color={ok ? "green" : "default"}>
                    {k}
                    {ok ? " ✓" : ""}
                  </Tag>
                ))}
              </Space>
            )}
        </div>
      ) : null}
      <Typography.Paragraph type="secondary" className="!mb-4 !mt-0 text-sm">
        下拉选项按已安装厂商的 <Typography.Text code>vendor_id</Typography.Text> 与模型 id
        组合；清空选择将同步清除服务端对应项。
      </Typography.Paragraph>
      <Spin spinning={settingsBusy}>
        <Space orientation="vertical" size={12} className="!w-full">
          {DEFAULT_MODEL_ROWS.map((row) => {
            const cap = ROW_KEY_TO_CAPABILITY[row.key];
            const groupedOptions = cap
              ? buildGroupedOptionsFromAvailable(availableModels, cap)
              : [];
            const empty = groupedOptions.length === 0;
            return (
              <div
                key={row.key}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
              >
                <Typography.Text className="flex shrink-0 items-center gap-1 sm:w-40">
                  {row.required ? (
                    <>
                      <span className="text-red-500">*</span> {row.label}
                    </>
                  ) : (
                    row.label
                  )}
                  <Tooltip title="数据来自 GET /llm/settings/available-models（仅含模板已配置完整的已安装厂商）；保存写入全局设置。">
                    <QuestionCircleOutlined className="cursor-help text-[var(--ant-color-text-tertiary)]" />
                  </Tooltip>
                </Typography.Text>
                <Select
                  className="min-w-0 flex-1"
                  placeholder={empty ? "暂无可用模型，请先添加并配置厂商" : "请选择模型"}
                  options={groupedOptions}
                  showSearch={{
                    filterOption: (input, option) => {
                      const label =
                        typeof option?.label === "string"
                          ? option.label
                          : String(option?.label ?? "");
                      return label.toLowerCase().includes(input.trim().toLowerCase());
                    },
                  }}
                  allowClear
                  loading={settingsBusy}
                  value={defaults[row.key]}
                  onChange={(v) => void updateDefault(row.key, v)}
                  notFoundContent={empty ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
                  popupMatchSelectWidth={false}
                />
              </div>
            );
          })}
        </Space>
      </Spin>
    </Card>
  );
}
