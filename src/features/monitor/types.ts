export type MonitorPeriod = "realtime" | "day" | "week" | "month";

export type MonitorOverview = {
  total_requests?: number;
  total_tokens?: number;
  success_rate?: number;
  avg_latency_ms?: number;
  [key: string]: unknown;
};

export type MonitorTrendPoint = {
  date: string;
  value: number;
  category: string;
};

export type MonitorErrorItem = {
  type: string;
  value: number;
};

export type MonitorModelStat = {
  model: string;
  requests: number;
  tokens: number;
  avg_latency_ms: number;
  success_rate: number;
};

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
