import { http } from "@/lib/http";
import type { ApiEnvelope } from "@/api/types";
import type {
  MonitorOverview,
  MonitorPeriod,
  MonitorTrendPoint,
  MonitorErrorItem,
  MonitorModelStat,
  MonitorRequestRow,
} from "../types";

async function unwrap<T>(promise: Promise<ApiEnvelope<T>>, fallbackMsg: string): Promise<T> {
  try {
    const envelope = await promise;
    if (envelope.code !== 0) {
      throw new Error(envelope.message || fallbackMsg);
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(fallbackMsg);
  }
}

export async function getMonitorOverview(): Promise<MonitorOverview> {
  return unwrap(
    http.get("monitor/overview").json<ApiEnvelope<MonitorOverview>>(),
    "获取监控概览失败"
  );
}

export async function getMonitorTrendRequests(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  return unwrap(
    http.get(`monitor/trends/requests?period=${period}`).json<ApiEnvelope<MonitorTrendPoint[]>>(),
    "获取请求量趋势失败"
  );
}

export async function getMonitorTrendTokens(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  return unwrap(
    http.get(`monitor/trends/tokens?period=${period}`).json<ApiEnvelope<MonitorTrendPoint[]>>(),
    "获取 Token 趋势失败"
  );
}

export async function getMonitorTrendLatency(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  return unwrap(
    http.get(`monitor/trends/latency?period=${period}`).json<ApiEnvelope<MonitorTrendPoint[]>>(),
    "获取延迟趋势失败"
  );
}

export async function getMonitorTrendSuccessRate(period: MonitorPeriod): Promise<MonitorTrendPoint[]> {
  return unwrap(
    http.get(`monitor/trends/success_rate?period=${period}`).json<ApiEnvelope<MonitorTrendPoint[]>>(),
    "获取成功率趋势失败"
  );
}

export async function getMonitorErrors(): Promise<MonitorErrorItem[]> {
  return unwrap(
    http.get("monitor/errors").json<ApiEnvelope<MonitorErrorItem[]>>(),
    "获取错误分布失败"
  );
}

export async function getMonitorModels(): Promise<MonitorModelStat[]> {
  return unwrap(
    http.get("monitor/models").json<ApiEnvelope<MonitorModelStat[]>>(),
    "获取模型统计失败"
  );
}

export async function getMonitorRecentRequests(limit = 20): Promise<MonitorRequestRow[]> {
  return unwrap(
    http.get(`monitor/requests?limit=${limit}`).json<ApiEnvelope<MonitorRequestRow[]>>(),
    "获取最近请求失败"
  );
}
