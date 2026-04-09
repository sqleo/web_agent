import { HTTPError } from "@/https";
import { authApi } from "./client";
import type { ApiEnvelope } from "./types";

export type MonitorPeriod = "realtime" | "day" | "week" | "month";

/** GET /monitor/overview */
export type MonitorOverview = {
  total_requests?: number;
  total_tokens?: number;
  success_rate?: number;
  avg_latency_ms?: number;
  [key: string]: unknown;
};

/** 趋势序列通用点 */
export type MonitorTrendPoint = {
  date: string;
  value: number;
  category: string;
};

/** GET /monitor/errors */
export type MonitorErrorItem = {
  type: string;
  value: number;
};

/** GET /monitor/models */
export type MonitorModelStat = {
  model: string;
  requests: number;
  tokens: number;
  avg_latency_ms: number;
  success_rate: number;
};

/** GET /monitor/requests */
export type MonitorRequestRow = {
  request_id: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  success?: boolean;
  created_at?: string;
  [key: string]: unknown;
};

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

async function unwrap<T>(promise: Promise<ApiEnvelope<T>>, fallbackMsg: string): Promise<T> {
  let envelope: ApiEnvelope<T>;
  try {
    envelope = await promise;
  } catch (e) {
    throw new Error(await toReadableMessage(e));
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || fallbackMsg);
  }
  return envelope.data as T;
}

export async function getMonitorOverview(): Promise<MonitorOverview> {
  const d = await unwrap(authApi.get<ApiEnvelope<MonitorOverview>>("monitor/overview"), "获取监控概览失败");
  return d ?? {};
}

export async function getMonitorTrendRequests(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  const d = await unwrap(
    authApi.get<ApiEnvelope<MonitorTrendPoint[]>>(`monitor/trends/requests?period=${period}`),
    "获取请求量趋势失败"
  );
  return d ?? [];
}

export async function getMonitorTrendTokens(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  const d = await unwrap(
    authApi.get<ApiEnvelope<MonitorTrendPoint[]>>(`monitor/trends/tokens?period=${period}`),
    "获取 Token 趋势失败"
  );
  return d ?? [];
}

export async function getMonitorTrendLatency(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  const d = await unwrap(
    authApi.get<ApiEnvelope<MonitorTrendPoint[]>>(`monitor/trends/latency?period=${period}`),
    "获取延迟趋势失败"
  );
  return d ?? [];
}

export async function getMonitorTrendSuccessRate(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  const d = await unwrap(
    authApi.get<ApiEnvelope<MonitorTrendPoint[]>>(`monitor/trends/success_rate?period=${period}`),
    "获取成功率趋势失败"
  );
  return d ?? [];
}

export async function getMonitorErrors(): Promise<MonitorErrorItem[]> {
  const d = await unwrap(authApi.get<ApiEnvelope<MonitorErrorItem[]>>("monitor/errors"), "获取错误分布失败");
  return d ?? [];
}

export async function getMonitorModels(): Promise<MonitorModelStat[]> {
  const d = await unwrap(authApi.get<ApiEnvelope<MonitorModelStat[]>>("monitor/models"), "获取模型统计失败");
  return d ?? [];
}

export async function getMonitorRecentRequests(limit = 20): Promise<MonitorRequestRow[]> {
  const d = await unwrap(
    authApi.get<ApiEnvelope<MonitorRequestRow[]>>(`monitor/requests?limit=${limit}`),
    "获取最近请求失败"
  );
  return d ?? [];
}
