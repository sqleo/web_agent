"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { App } from "antd";
import {
  getVendorMarketplace,
  getInstalledVendors,
  getGlobalLlmSettings,
  getAvailableSettingsModels,
  patchGlobalLlmSettings,
} from "../api/vendors";
import type { Vendor, GlobalLlmSettings, AvailableModelEntry } from "../types";
import { defaultsFromGlobal, patchBodyForRow } from "@/lib/global-llm-settings";

export function useVendors() {
  const { message: messageApi } = App.useApp();
  const messageApiRef = useRef(messageApi);
  messageApiRef.current = messageApi;

  const showError = useCallback((text: string) => {
    queueMicrotask(() => {
      messageApiRef.current.error(text);
    });
  }, []);

  const showSuccess = useCallback((text: string) => {
    queueMicrotask(() => {
      messageApiRef.current.success(text);
    });
  }, []);

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
      showError(e instanceof Error ? e.message : "查询厂商市场失败");
    } finally {
      setLoadingMarket(false);
    }
  }, [showError]);

  const loadInstalled = useCallback(async () => {
    setLoadingInstalled(true);
    try {
      const list = await getInstalledVendors();
      setInstalled(list);
    } catch (e) {
      showError(e instanceof Error ? e.message : "查询已安装厂商失败");
    } finally {
      setLoadingInstalled(false);
    }
  }, [showError]);

  const loadGlobalSettings = useCallback(async () => {
    setLoadingGlobalSettings(true);
    try {
      const g = await getGlobalLlmSettings();
      setGlobalSettings(g);
      setDefaults(defaultsFromGlobal(g));
    } catch (e) {
      showError(e instanceof Error ? e.message : "获取全局模型设置失败");
    } finally {
      setLoadingGlobalSettings(false);
    }
  }, [showError]);

  const loadAvailableModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const list = await getAvailableSettingsModels();
      setAvailableModels(list);
    } catch (e) {
      showError(e instanceof Error ? e.message : "查询可选模型失败");
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [showError]);

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
        showError(e instanceof Error ? e.message : "保存失败");
        await loadGlobalSettings();
      }
    },
    [loadGlobalSettings, showError]
  );

  const openAddModal = (vendor: Vendor, isInstalled: boolean) => {
    setModalVendor(vendor);
    setModalInstalled(isInstalled);
    setModalOpen(true);
  };

  const handleModalSuccess = async () => {
    showSuccess("保存成功");
    await loadInstalled();
    await loadMarket();
    await loadGlobalSettings();
    await loadAvailableModels();
  };

  const settingsBusy = loadingModels || loadingGlobalSettings;

  return {
    market,
    installed,
    globalSettings,
    availableModels,
    search,
    setSearch,
    filterCap,
    setFilterCap,
    defaults,
    modalOpen,
    setModalOpen,
    modalVendor,
    modalInstalled,
    installedByCode,
    allCapabilities,
    filteredMarket,
    loadingMarket,
    loadingInstalled,
    settingsBusy,
    updateDefault,
    openAddModal,
    handleModalSuccess,
  };
}
