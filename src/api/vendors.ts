import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope, PatchVendorConfigBody, Vendor } from "./types";

async function toReadableMessage(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.json()) as Partial<ApiEnvelope<unknown>> & {
        message?: string;
      };
      return body.message ?? `请求失败（${error.response.status}）`;
    } catch {
      return `请求失败（${error.response.status}）`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}

export async function getVendorMarketplace(): Promise<Vendor[]> {
  let envelope: ApiEnvelope<Vendor[]>;
  try {
    envelope = await authApi.get<ApiEnvelope<Vendor[]>>("llm/vendors/marketplace");
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询厂商市场失败");
  }
  return envelope.data ?? [];
}

export async function getInstalledVendors(): Promise<Vendor[]> {
  let envelope: ApiEnvelope<Vendor[]>;
  try {
    envelope = await authApi.get<ApiEnvelope<Vendor[]>>("llm/vendors/installed");
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询已安装厂商失败");
  }
  return envelope.data ?? [];
}

export async function installVendor(vendorCode: string): Promise<unknown> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.post<ApiEnvelope<unknown>>(
      `llm/vendors/install/${encodeURIComponent(vendorCode)}`
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "安装厂商失败");
  }
  return envelope.data;
}

/**
 * 配置厂商密钥/URL/私有字段：PATCH /llm/vendors/{vendor_id}
 */
export async function patchVendorConfig(
  vendorId: string | number,
  body: PatchVendorConfigBody
): Promise<void> {
  let envelope: ApiEnvelope<unknown>;
  try {
    envelope = await authApi.patch<ApiEnvelope<unknown>>(
      `llm/vendors/${encodeURIComponent(String(vendorId))}`,
      { json: body }
    );
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "保存厂商配置失败");
  }
}
