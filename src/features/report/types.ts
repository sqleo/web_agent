export type ReportStatus = "draft" | "running" | "waiting_review" | "completed" | "failed" | "cancelled";
export type ReportStage = "intent" | "research" | "outline" | "writing" | "final";

export interface ExecutionLog {
  type: string;
  thread_id?: string;
  stage?: ReportStage;
  status?: string;
  ts_ms?: number;
  message?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReportIntentData {
  topic?: string | null;
  report_type?: string | null;
  scope?: string | null;
  time_range?: string | null;
  depth?: string | null;
  style_instruction?: string | null;
  output_format?: string | null;
  industry?: string | null;
}

export interface ReportSource {
  source_id: string;
  title: string;
  summary: string;
  source_type: "kb" | "web" | "api" | "upload" | string;
  url?: string | null;
  domain?: string | null;
  tool?: string | null;
  topic_key?: string | null;
  confidence?: number | null;
  raw_query?: string | null;
}

export interface ReportOutlineSection {
  section_id: string;
  title: string;
  objective: string;
  key_points: string[];
  evidence_keys: string[];
  target_words: number;
  order: number;
  status: "pending" | "ready" | "approved" | "rejected";
}

export interface ReportSection {
  section_id: string;
  title: string;
  content?: string | null;
  status: "pending" | "writing" | "reviewing" | "reviewed" | "revising" | "done" | "failed";
  score?: number | null;
  issues: string[];
  suggestions: string[];
  word_count?: number | null;
  updated_at?: string | null;
}

export interface ReportReview {
  round: number;
  overall_score?: number | null;
  passed?: boolean | null;
  sections_to_revise: string[];
  summary?: string | null;
}

export interface ReportMetrics {
  total_sources: number;
  completed_tasks: number;
  total_tasks: number;
  progress_percent: number;
  current_message?: string | null;
}

export interface ReportInterrupt {
  kind: "intent_review" | "outline_review" | string;
  node_name: string;
  message: string;
  payload: Record<string, unknown>;
}

export interface ReportFinal {
  markdown: string;
  chapter_count: number;
  word_count: number;
  citation_count: number;
  quality_score?: number | null;
}

export interface ReportItem {
  id: string;
  topic: string;
  status: ReportStatus;
  stage: ReportStage;
  created_at: string;
  updated_at?: string;
  summary?: string | null;
  subtitle?: string | null;
  canResume?: boolean;
  progressText?: string | null;
  message?: string;
  logs?: ExecutionLog[];
  intentData?: ReportIntentData;
  intentMissingFields?: string[];
  sources: ReportSource[];
  outline: ReportOutlineSection[];
  sections: ReportSection[];
  review?: ReportReview | null;
  finalReport?: ReportFinal | null;
  interrupt?: ReportInterrupt | null;
  lastError?: string | null;
  metrics?: ReportMetrics;
  progress?: {
    current_step: string;
    percent: number;
    steps: Array<{ name: string; status: "wait" | "process" | "finish" | "error" }>;
  };
}

export interface CreateReportBody {
  topic: string;
  keywords?: string[];
  model_id?: string;
  extra?: string;
}

export interface GenerateReportPayload {
  user_query: string;
  thread_id?: string;
}

export interface ResumeReportPayload {
  thread_id: string;
  action: "confirm" | "revise" | "replan";
  updates?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export interface ReportHistoryItemDto {
  thread_id: string;
  title: string;
  subtitle?: string | null;
  status: ReportStatus;
  stage: ReportStage;
  updated_at: string;
  created_at: string;
  summary?: string | null;
  can_resume: boolean;
  progress_text?: string | null;
}

export interface ReportHistoryDetailDto {
  thread_id: string;
  title: string;
  user_query: string;
  status: ReportStatus;
  stage: ReportStage;
  intent: ReportIntentData | null;
  intent_missing_fields: string[];
  sources: ReportSource[];
  outline: ReportOutlineSection[];
  sections: ReportSection[];
  review: ReportReview | null;
  final_report: ReportFinal | null;
  artifacts: Array<Record<string, unknown>>;
  metrics: ReportMetrics;
  interrupt: ReportInterrupt | null;
  created_at: string;
  updated_at: string;
  finished_at?: string | null;
  last_error?: string | null;
}

export interface ReportHistoryListDto {
  total: number;
  page: number;
  page_size: number;
  items: ReportHistoryItemDto[];
}
