export type ToolCallInfo = {
  content: string;
};

export type ReferenceInfo = {
  tool: string;
  content: string;
  [k: string]: unknown;
};

export type StoredBubble = {
  key: string;
  role: "user" | "ai";
  text: string;
  reasoning?: string;
  toolCalls?: ToolCallInfo[];
  references?: ReferenceInfo[];
  aiVariant?: "demo_full" | "demo_short";
};

export type ChatSession = {
  id: string;
  title: string;
  messages: StoredBubble[];
  updatedAt: number;
  threadId?: string | null;
};

export type DeleteChatThreadData = {
  thread_id: string;
  message: string;
};

export type DeleteAgentChatThreadVariant = "default" | "customer-service" | "graph-service";

export type PauseAgentChatData = {
  thread_id: string;
  status: string;
  checkpoint_id: string | null;
  message: string;
};

export type ResumeAgentChatBody = {
  resume_value?: { action?: string; [k: string]: unknown };
};

export type ResumeAgentChatData = {
  thread_id: string;
  status: string;
  message: string;
};

export type ChatCheckpointItem = {
  checkpoint_id: string;
  timestamp: string;
  content_preview: string;
  node: string;
  metadata?: Record<string, unknown>;
};

export type AgentChatHistoryData = {
  thread_id: string;
  total: number;
  checkpoints: ChatCheckpointItem[];
};

export type TravelAgentChatBody = {
  checkpoint_id: string;
  mode: "fork" | "replay";
  new_input?: string;
};

export type TravelAgentChatData = {
  thread_id: string;
  new_thread_id?: string;
  checkpoint_id: string;
  mode: string;
  message: string;
};
