import type {
  ExecutionLog,
  ReportFinal,
  ReportHistoryDetailDto,
  ReportHistoryItemDto,
  ReportItem,
  ReportReview,
  ReportSection,
  ReportSource,
  ReportStage,
  ReportStatus,
} from "../types";

function emptyReport(id: string, topic: string): ReportItem {
  return {
    id,
    topic,
    status: "running",
    stage: "intent",
    created_at: new Date().toISOString(),
    sources: [],
    outline: [],
    sections: [],
    logs: [],
  };
}

export function mapReportHistoryItem(dto: ReportHistoryItemDto): ReportItem {
  return {
    ...emptyReport(dto.thread_id, dto.title),
    topic: dto.title,
    subtitle: dto.subtitle,
    status: dto.status,
    stage: dto.stage,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
    summary: dto.summary,
    canResume: dto.can_resume,
    progressText: dto.progress_text,
    message: dto.progress_text || dto.summary || undefined,
  };
}

function deriveDetailStatus(dto: ReportHistoryDetailDto): ReportStatus {
  if (dto.status === "failed" || dto.status === "cancelled") {
    return dto.status;
  }
  const hasFinalMarkdown = Boolean(dto.final_report?.markdown?.trim());
  if (hasFinalMarkdown && dto.stage === "final") {
    return "completed";
  }
  return dto.status;
}

export function mapReportHistoryDetail(dto: ReportHistoryDetailDto): ReportItem {
  return {
    ...emptyReport(dto.thread_id, dto.title),
    topic: dto.title,
    status: deriveDetailStatus(dto),
    stage: dto.stage,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
    intentData: dto.intent || undefined,
    intentMissingFields: dto.intent_missing_fields,
    sources: dto.sources || [],
    outline: dto.outline || [],
    sections: dto.sections || [],
    review: dto.review,
    finalReport: dto.final_report,
    interrupt: dto.interrupt,
    lastError: dto.last_error,
    metrics: dto.metrics,
    canResume: dto.status === "waiting_review",
    progressText: dto.metrics?.current_message || undefined,
    message: dto.metrics?.current_message || dto.interrupt?.message || undefined,
  };
}

function updateSection(
  sections: ReportSection[],
  payload: Record<string, unknown>
): ReportSection[] {
  const sectionId = String(payload.section_id || "");
  const idx = sections.findIndex((section) => section.section_id === sectionId);
  const nextSection: ReportSection = {
    section_id: sectionId,
    title: String(payload.title || sectionId || "未命名章节"),
    status: (payload.status as ReportSection["status"]) || "writing",
    content: typeof payload.content_preview === "string" ? payload.content_preview : null,
    score: typeof payload.score === "number" ? payload.score : null,
    issues: Array.isArray(payload.issues) ? payload.issues.map(String) : [],
    suggestions: Array.isArray(payload.suggestions) ? payload.suggestions.map(String) : [],
  };
  if (idx === -1) {
    return [...sections, nextSection];
  }
  return sections.map((section, index) => (index === idx ? { ...section, ...nextSection } : section));
}

export function applyReportStreamEvent(item: ReportItem, event: ExecutionLog): ReportItem {
  const logs = [...(item.logs || []), event];
  const next: ReportItem = { ...item, logs };
  if (event.thread_id) {
    next.id = event.thread_id;
  }
  if (event.message) {
    next.message = event.message;
  }
  if (event.stage) {
    next.stage = event.stage as ReportStage;
  }

  switch (event.type) {
    case "stage":
      if (event.stage) {
        next.stage = event.stage as ReportStage;
      }
      next.status = "running";
      break;
    case "progress":
      next.metrics = {
        total_sources: next.metrics?.total_sources || next.sources.length,
        completed_tasks: Number(event.payload?.done || next.metrics?.completed_tasks || 0),
        total_tasks: Number(event.payload?.total || next.metrics?.total_tasks || 0),
        progress_percent: Number(event.payload?.percent || next.metrics?.progress_percent || 0),
        current_message: event.message || next.metrics?.current_message,
      };
      break;
    case "source_found":
      if (event.payload) {
        next.sources = [...next.sources, event.payload as unknown as ReportSource];
      }
      break;
    case "outline_ready":
      if (Array.isArray(event.payload?.outline)) {
        next.outline = event.payload.outline as unknown as ReportItem["outline"];
      }
      next.stage = "outline";
      next.status = "waiting_review";
      next.canResume = true;
      break;
    case "section_update":
      next.stage = "writing";
      next.sections = updateSection(next.sections, event.payload || {});
      next.status = "running";
      break;
    case "review_update":
      next.review = {
        round: Number(event.payload?.round || 0),
        overall_score:
          typeof event.payload?.overall_score === "number"
            ? event.payload.overall_score
            : null,
        passed: typeof event.payload?.passed === "boolean" ? event.payload.passed : null,
        sections_to_revise: Array.isArray(event.payload?.sections_to_revise)
          ? event.payload.sections_to_revise.map(String)
          : [],
      } as ReportReview;
      break;
    case "final_report_ready":
      next.stage = "final";
      next.status = "completed";
      next.canResume = false;
      next.finalReport = event.payload as unknown as ReportFinal;
      break;
    case "interrupt":
      next.status = "waiting_review";
      next.canResume = true;
      next.interrupt = (event.payload || null) as ReportItem["interrupt"];
      break;
    case "lifecycle":
      if (event.status === "completed") {
        next.status = "completed";
        next.canResume = false;
      }
      break;
    case "error":
      next.status = "failed";
      next.lastError = event.message || "处理失败";
      break;
    default:
      break;
  }
  return next;
}
