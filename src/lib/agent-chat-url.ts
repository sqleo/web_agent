import { API_VERSION, getApiVersionedBase } from "@/lib/api-base";

/** 与 `src/https/api.ts` 的 prefix 规则一致，拼出流式对话地址 */

/**
 * 浏览器中：`{NEXT_PUBLIC_API_BASE_URL}/v1/agent/chat/stream`，未配置则用当前 origin + `/v1`。
 */
export function getAgentChatStreamUrl(): string {
  const base = getApiVersionedBase();
  if (base) {
    return `${base}/agent/chat/stream`;
  }
  return `/${API_VERSION}/agent/chat/stream`;
}

/**
 * 智能客服：`{base}/v1/agent/customer-service/chat/stream`
 */
export function getCustomerServiceChatStreamUrl(): string {
  const base = getApiVersionedBase();
  if (base) {
    return `${base}/agent/customer-service/chat/stream`;
  }
  return `/${API_VERSION}/agent/customer-service/chat/stream`;
}
