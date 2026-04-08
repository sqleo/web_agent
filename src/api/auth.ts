import { HTTPError } from "@/https";
import { api } from "@/https/api";
import { persistLoginSession } from "./auth-storage";
import type { ApiEnvelope, LoginData, LoginRequest } from "./types";

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
 * 登录：POST /auth/login，成功则写入 access_token 与用户信息。
 */
export async function login(payload: LoginRequest): Promise<LoginData> {
  let envelope: ApiEnvelope<LoginData>;
  try {
    envelope = await api.post<ApiEnvelope<LoginData>>("auth/login", {
      json: payload,
    });
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }

  if (envelope.code !== 0) {
    throw new Error(envelope.message || "登录失败");
  }

  if (!envelope.data?.access_token) {
    throw new Error("登录响应缺少 access_token");
  }

  if (typeof window !== "undefined") {
    persistLoginSession(envelope.data);
  }

  return envelope.data;
}
