import { readTextStream } from "@/https/stream";

export type ReportSseEvent =
  | { type: "start"; thread_id: string }
  | { type: "node_start"; node: string }
  | { type: "node"; node: string; state: "running" | "completed"; output?: unknown }
  | { type: "message"; data: { content?: string } }
  | { type: "interrupted"; payload: Record<string, unknown> }
  | { type: "done" }
  | { type: "error"; message: string; raw?: unknown };

function parseEventPayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function* iterateReportSseEvents(
  res: Response
): AsyncGenerator<ReportSseEvent, void, undefined> {
  let buffer = "";

  for await (const chunk of readTextStream(res.body)) {
    buffer += chunk;

    while (true) {
      const end = buffer.indexOf("\n\n");
      if (end < 0) {
        break;
      }
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);

      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean);
      const dataLines = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
      if (dataLines.length === 0) {
        continue;
      }

      const raw = dataLines.join("\n");
      const parsed = parseEventPayload(raw);
      if (typeof parsed !== "object" || parsed === null) {
        yield { type: "error", message: "无效的 SSE 事件结构", raw: parsed };
        continue;
      }
      const event = parsed as { type?: string; [k: string]: unknown };
      switch (event.type) {
        case "start":
          yield { type: "start", thread_id: String(event.thread_id ?? "") };
          break;
        case "node_start":
          yield { type: "node_start", node: String(event.node ?? "") };
          break;
        case "node": {
          const rawState = String(event.state ?? "");
          const state: "running" | "completed" | undefined =
            rawState === "running" || rawState === "completed" ? rawState : undefined;
          if (!state) {
            yield { type: "error", message: `无效 node.state: ${rawState}`, raw: event };
            break;
          }
          yield {
            type: "node",
            node: String(event.node ?? ""),
            state,
            output: event.output,
          };
          break;
        }
        case "message":
          yield {
            type: "message",
            data:
              typeof event.data === "object" && event.data !== null
                ? (event.data as { content?: string })
                : {},
          };
          break;
        case "interrupted":
          yield {
            type: "interrupted",
            payload:
              typeof event.payload === "object" && event.payload !== null
                ? (event.payload as Record<string, unknown>)
                : {},
          };
          break;
        case "done":
          yield { type: "done" };
          break;
        case "node_end":
          // 后端可能透出 node_end，这里前端无需展示为异常
          break;
        default:
          yield { type: "error", message: `未知事件类型: ${String(event.type ?? "undefined")}`, raw: event };
          break;
      }
    }
  }
}
