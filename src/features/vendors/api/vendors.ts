import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";
import type {
  AvailableModelEntry,
  GlobalLlmSettings,
  PatchGlobalLlmSettingsBody,
  PatchVendorConfigBody,
  Vendor,
} from "../types";

export async function getVendorMarketplace(): Promise<Vendor[]> {
  try {
    const envelope = await http
      .get("llm/vendors/marketplace")
      .json<ApiEnvelope<Vendor[]>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询厂商市场失败");
    }
    return envelope.data ?? [];
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询厂商市场失败");
  }
}

export async function getInstalledVendors(): Promise<Vendor[]> {
  try {
    const envelope = await http
      .get("llm/vendors/installed")
      .json<ApiEnvelope<Vendor[]>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询已安装厂商失败");
    }
    return envelope.data ?? [];
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询已安装厂商失败");
  }
}

export async function installVendor(vendorCode: string): Promise<unknown> {
  try {
    const envelope = await http
      .post(`llm/vendors/install/${encodeURIComponent(vendorCode)}`)
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "安装厂商失败");
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("安装厂商失败");
  }
}

export async function patchVendorConfig(
  vendorId: string | number,
  body: PatchVendorConfigBody
): Promise<void> {
  try {
    const envelope = await http
      .patch(`llm/vendors/${encodeURIComponent(String(vendorId))}`, {
        json: body,
      })
      .json<ApiEnvelope<unknown>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "保存厂商配置失败");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("保存厂商配置失败");
  }
}

export async function getGlobalLlmSettings(): Promise<GlobalLlmSettings> {
  try {
    const envelope = await http
      .get("llm/settings/global")
      .json<ApiEnvelope<GlobalLlmSettings>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "获取全局模型设置失败");
    }
    return envelope.data ?? {};
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("获取全局模型设置失败");
  }
}

export async function patchGlobalLlmSettings(
  body: PatchGlobalLlmSettingsBody
): Promise<GlobalLlmSettings> {
  try {
    const envelope = await http
      .patch("llm/settings/global", {
        json: body,
      })
      .json<ApiEnvelope<GlobalLlmSettings>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "更新全局模型设置失败");
    }
    return envelope.data ?? {};
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("更新全局模型设置失败");
  }
}

export async function getAvailableSettingsModels(
  capability?: string
): Promise<AvailableModelEntry[]> {
  try {
    const params = new URLSearchParams();
    if (capability?.trim()) {
      params.set("capability", capability.trim());
    }
    const qs = params.toString();
    const url = qs
      ? `llm/settings/available-models?${qs}`
      : "llm/settings/available-models";

    const envelope = await http.get(url).json<ApiEnvelope<AvailableModelEntry[]>>();

    if (envelope.code !== 0) {
      throw new Error(envelope.message || "查询可选模型失败");
    }
    return envelope.data ?? [];
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("查询可选模型失败");
  }
}
