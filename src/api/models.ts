import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope, VendorModelGroup } from "./types";

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

/**
 * 已配置厂商下的可用模型目录（按厂商分组）。
 * GET /llm/models
 */
export async function getVendorModelCatalog(): Promise<VendorModelGroup[]> {
  let envelope: ApiEnvelope<VendorModelGroup[]>;
  try {
    envelope = await authApi.get<ApiEnvelope<VendorModelGroup[]>>("llm/models");
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "查询模型列表失败");
  }
  return envelope.data ?? [];
}
