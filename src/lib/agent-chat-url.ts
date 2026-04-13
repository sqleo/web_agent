/** 与 `src/https/api.ts` 的 prefix 规则一致，拼出流式对话地址 */

function normalizeBaseUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

/**
 * 浏览器中：`NEXT_PUBLIC_API_BASE_URL/agent/chat/stream`，未配置则用当前 origin。
 */
export function getAgentChatStreamUrl(): string {
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromEnv) {
    return `${fromEnv}/agent/chat/stream`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/agent/chat/stream`;
  }
  return "/agent/chat/stream";
}

/**
 * 智能客服：`NEXT_PUBLIC_API_BASE_URL/agent/customer-service/chat/stream`
 */
export function getCustomerServiceChatStreamUrl(): string {
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromEnv) {
    return `${fromEnv}/agent/customer-service/chat/stream`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/agent/customer-service/chat/stream`;
  }
  return "/agent/customer-service/chat/stream";
}
