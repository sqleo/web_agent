"use client";

import { ExportOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAvailableSettingsModels,
  getGlobalLlmSettings,
  getInstalledVendors,
  getVendorMarketplace,
  patchGlobalLlmSettings,
  type AvailableModelEntry,
  type GlobalLlmSettings,
  type Vendor,
} from "@/api";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { defaultsFromGlobal, patchBodyForRow } from "@/lib/global-llm-settings";
import {
  ROW_KEY_TO_CAPABILITY,
  buildGroupedOptionsFromAvailable,
} from "@/lib/vendor-models";
import { VendorAddModal } from "./vendor-add-modal";

const DEFAULT_MODEL_ROWS: { key: string; label: string; required?: boolean }[] = [
  { key: "llm", label: "LLM", required: true },
  { key: "embedding", label: "Embedding" },
  { key: "vlm", label: "VLM" },
  { key: "asr", label: "ASR" },
  { key: "rerank", label: "Rerank" },
  { key: "tts", label: "TTS" },
];

export default function VendorsPage() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [market, setMarket] = useState<Vendor[]>([]);
  const [installed, setInstalled] = useState<Vendor[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalLlmSettings | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [loadingInstalled, setLoadingInstalled] = useState(false);
  const [loadingGlobalSettings, setLoadingGlobalSettings] = useState(false);
  const [availableModels, setAvailableModels] = useState<AvailableModelEntry[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCap, setFilterCap] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<Record<string, string>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalVendor, setModalVendor] = useState<Vendor | null>(null);
  const [modalInstalled, setModalInstalled] = useState(false);

  const installedByCode = useMemo(() => {
    const m = new Map<string, Vendor>();
    for (const v of installed) {
      m.set(v.code, v);
    }
    return m;
  }, [installed]);

  const allCapabilities = useMemo(() => {
    const s = new Set<string>();
    for (const v of market) {
      for (const c of v.capabilities ?? []) {
        s.add(c);
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [market]);

  const filteredMarket = useMemo(() => {
    const q = search.trim().toLowerCase();
    return market.filter((v) => {
      if (filterCap) {
        const caps = v.capabilities ?? [];
        if (!caps.includes(filterCap)) {
          return false;
        }
      }
      if (!q) {
        return true;
      }
      return (
        v.name.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [market, search, filterCap]);

  const loadMarket = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const list = await getVendorMarketplace();
      setMarket(list);
    } catch (e) {
      const text = e instanceof Error ? e.message : "查询厂商市场失败";
      messageApi.error(text);
    } finally {
      setLoadingMarket(false);
    }
  }, [messageApi]);

  const loadInstalled = useCallback(async () => {
    setLoadingInstalled(true);
    try {
      const list = await getInstalledVendors();
      setInstalled(list);
    } catch (e) {
      const text = e instanceof Error ? e.message : "查询已安装厂商失败";
      messageApi.error(text);
    } finally {
      setLoadingInstalled(false);
    }
  }, [messageApi]);

  const loadGlobalSettings = useCallback(async () => {
    setLoadingGlobalSettings(true);
    try {
      const g = await getGlobalLlmSettings();
      setGlobalSettings(g);
      setDefaults(defaultsFromGlobal(g));
    } catch (e) {
      const text = e instanceof Error ? e.message : "获取全局模型设置失败";
      messageApi.error(text);
    } finally {
      setLoadingGlobalSettings(false);
    }
  }, [messageApi]);

  const loadAvailableModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const list = await getAvailableSettingsModels();
      setAvailableModels(list);
    } catch (e) {
      const text = e instanceof Error ? e.message : "查询可选模型失败";
      messageApi.error(text);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [messageApi]);

  useEffect(() => {
    void loadMarket();
    void loadInstalled();
    void loadGlobalSettings();
  }, [loadGlobalSettings, loadInstalled, loadMarket]);

  useEffect(() => {
    void loadAvailableModels();
  }, [loadAvailableModels]);

  const updateDefault = useCallback(
    async (rowKey: string, value: string | null) => {
      try {
        const body = patchBodyForRow(rowKey, value);
        await patchGlobalLlmSettings(body);
        const g = await getGlobalLlmSettings();
        setGlobalSettings(g);
        setDefaults(defaultsFromGlobal(g));
      } catch (e) {
        const text = e instanceof Error ? e.message : "保存失败";
        messageApi.error(text);
        await loadGlobalSettings();
      }
    },
    [loadGlobalSettings, messageApi]
  );

  const openAddModal = (vendor: Vendor, isInstalled: boolean) => {
    setModalVendor(vendor);
    setModalInstalled(isInstalled);
    setModalOpen(true);
  };

  const handleModalSuccess = async () => {
    messageApi.success("保存成功");
    await loadInstalled();
    await loadMarket();
    await loadGlobalSettings();
    await loadAvailableModels();
  };

  const settingsBusy = loadingModels || loadingGlobalSettings;

  return (
    <DashboardPageCard>
      {messageContextHolder}
      <Typography.Title level={4} className="!mb-2 !mt-0">
        模型管理
      </Typography.Title>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-h-0 min-w-0 flex-1 space-y-4">
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
                        placeholder={
                          empty ? "暂无可用模型，请先添加并配置厂商" : "请选择模型"
                        }
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
                          <Avatar>
                            {(v.name ?? v.code).slice(0, 1).toUpperCase()}
                          </Avatar>
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
        </div>

        <div className="w-full shrink-0 lg:w-[400px]">
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
              <Tag.CheckableTag
                checked={filterCap === null}
                onChange={() => setFilterCap(null)}
              >
                All
              </Tag.CheckableTag>
              {allCapabilities.map((c) => (
                <Tag.CheckableTag
                  key={c}
                  checked={filterCap === c}
                  onChange={() => setFilterCap(c)}
                >
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
        </div>
      </div>

      <VendorAddModal
        open={modalOpen}
        vendor={modalVendor}
        isInstalled={modalInstalled}
        installedVendorId={modalVendor ? installedByCode.get(modalVendor.code)?.id : undefined}
        onClose={() => {
          setModalOpen(false);
          setModalVendor(null);
        }}
        onSuccess={() => void handleModalSuccess()}
      />
    </DashboardPageCard>
  );
}
