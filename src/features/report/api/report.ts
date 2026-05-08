import { HTTPError, api } from "@/https";
import { authApi } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import { getApiVersionedBase } from "@/lib/api-base";
import type {
  GenerateReportPayload,
  ReportHistoryDetailDto,
  ReportHistoryListDto,
  ResumeReportPayload,
} from "../types";

function getReadableMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}

async function unwrap<T>(promise: Promise<ApiEnvelope<T>>, fallback: string): Promise<T> {
  try {
    const envelope = await promise;
    if (envelope.code !== 0) {
      throw new Error(envelope.message || fallback);
    }
    return envelope.data;
  } catch (error) {
    if (error instanceof HTTPError) {
      try {
        const body = (await error.response.json()) as Partial<ApiEnvelope<T>>;
        throw new Error(body.message || fallback);
      } catch {
        throw new Error(fallback);
      }
    }
    throw new Error(getReadableMessage(error));
  }
}

export function getStreamUrl(threadId: string): string {
  const prefix = getApiVersionedBase() || "http://localhost:8888/v1";
  return `${prefix}/report/stream/${encodeURIComponent(threadId)}`;
}

export async function listReportHistories(): Promise<ReportHistoryListDto> {
  return unwrap(
    authApi.get<ApiEnvelope<ReportHistoryListDto>>("report/history"),
    "加载研报历史失败"
  );
}

export async function getReportHistory(threadId: string): Promise<ReportHistoryDetailDto> {
  return unwrap(
    authApi.get<ApiEnvelope<ReportHistoryDetailDto>>(`report/history/${encodeURIComponent(threadId)}`),
    "加载研报详情失败"
  );
}

export async function generateReportStream(payload: GenerateReportPayload): Promise<Response> {
  return api.stream("POST", "report/generate", {
    json: payload,
  });
}

export async function resumeReportStream(payload: ResumeReportPayload): Promise<Response> {
  return api.stream("POST", "report/resume", {
    json: payload,
  });
}
