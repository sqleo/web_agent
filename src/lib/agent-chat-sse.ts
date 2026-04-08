/** POST /agent/chat/stream 返回的 SSE：每行 `data: ` 后为 JSON */

export type AgentStreamEvent =
  | { type: "start"; thread_id: string }
  | { type: "thinking"; content: string }
  | { type: "text"; content: string }
  | { type: "tool"; content: string }
  | { type: "reference"; tool: string; content: string; [k: string]: unknown }
  | { type: "done"; thread_id: string }
  | { type: "error"; message: string };

function parseEventJson(payload: string): AgentStreamEvent | null {
  const s = payload.trim();
  if (!s || s === "[DONE]") {
    return null;
  }
  try {
    const obj = JSON.parse(s) as Record<string, unknown>;
    const t = obj.type;

    if (t === "start" && typeof obj.thread_id === "string") {
      return { type: "start", thread_id: obj.thread_id };
    }

    // 新格式：type=thinking, content=delta
    if (t === "thinking" && typeof obj.content === "string") {
      return { type: "thinking", content: obj.content };
    }
    // 兼容旧格式：type=reasoning, delta=...
    if (t === "reasoning" && typeof obj.delta === "string") {
      return { type: "thinking", content: obj.delta };
    }

    // 新格式：type=text, content=delta
    if (t === "text" && typeof obj.content === "string") {
      return { type: "text", content: obj.content };
    }
    // 兼容旧格式：type=content, delta=...
    if (t === "content" && typeof obj.delta === "string") {
      return { type: "text", content: obj.delta };
    }

    // 工具调用状态
    if (t === "tool" && typeof obj.content === "string") {
      return { type: "tool", content: obj.content };
    }

    // 引用/参考资料
    if (t === "reference") {
      return {
        type: "reference",
        tool: typeof obj.tool === "string" ? obj.tool : "",
        content: typeof obj.content === "string" ? obj.content : "",
        ...obj,
      };
    }

    if (t === "done" && typeof obj.thread_id === "string") {
      return { type: "done", thread_id: obj.thread_id };
    }
    if (t === "error" && typeof obj.message === "string") {
      return { type: "error", message: obj.message };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * 从 fetch 的 SSE Response 解析 JSON 事件（按行 `data: ...`）。
 */
export async function* iterateAgentSseEvents(
  response: Response
): AsyncGenerator<AgentStreamEvent, void, undefined> {
  const body = response.body;
  if (!body) {
    return;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      carry += decoder.decode(value, { stream: true });
      const parts = carry.split(/\r?\n/);
      carry = parts.pop() ?? "";
      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          continue;
        }
        if (trimmed.startsWith("data:")) {
          const jsonPart = trimmed.slice("data:".length).trim();
          const ev = parseEventJson(jsonPart);
          if (ev) {
            yield ev;
          }
        }
      }
    }
    const tail = carry.trim();
    if (tail.startsWith("data:")) {
      const ev = parseEventJson(tail.slice("data:".length).trim());
      if (ev) {
        yield ev;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
