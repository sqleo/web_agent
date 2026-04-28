export type ReportStatus = "pending" | "generating" | "success" | "failed";

export interface ExecutionLog {
  type: "phase" | "task" | "metric" | "node" | "start" | "done" | "interrupted" | "error" | string;
  ts_ms?: number;
  message?: string;
  phase?: string;
  status?: string;
  task_id?: string;
  metric_name?: string;
  value?: any;
  node?: string;
  state?: string;
  output?: any;
}

export interface ReportItem {
  id: string;
  topic: string;
  keywords?: string[];
  status: ReportStatus;
  created_at: string;
  content?: string;
  phase?: string;
  message?: string;
  isInterrupted?: boolean;
  logs?: ExecutionLog[];
  progress?: {
    current_step: string;
    percent: number;
    steps: { name: string; status: "wait" | "process" | "finish" | "error" }[];
  };
  intentData?: {
    topic?: string;
    report_type?: string;
    scope?: string;
    time_range?: string;
    depth?: string;
    style_instruction?: string;
    output_format?: string;
    industry?: string;
  };
  outlineData?: any;
  interruptPayload?: any;
}

export interface CreateReportBody {
  topic: string;
  keywords?: string[];
  model_id?: string;
}

export interface GenerateReportPayload {
  user_query: string;
  thread_id?: string;
  config?: Record<string, any>;
}

export interface GenerateReportResponse {
  thread_id?: string;
  phase: string;
  status: "running" | "completed" | "failed";
  message: string;
  chapter_count?: number;
  word_count?: number;
  output?: string;
  outline?: any;
  section_reviews?: any;
  images?: any;
}
