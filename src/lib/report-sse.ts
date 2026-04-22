/** 解析标准 SSE：块之间 `\n\n` 或 `\r\n\r\n`，含 `event:` / `data:` 行 */

function parseOneSseBlock(block: string): { event: string; data: string } {
  const lines = block.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim() || "message";
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  return { event, data: dataLines.join("\n") };
}

/**
 * 从 fetch 的 SSE Response 按块迭代（与后端 `report/generate`、监听流一致）。
 */
export async function* iterateSseBlocks(
  response: Response
): AsyncGenerator<{ event: string; data: string }, void, undefined> {
  const body = response.body;
  if (!body) {
    return;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      while (true) {
        const lfBoundary = buffer.indexOf("\n\n");
        const crlfBoundary = buffer.indexOf("\r\n\r\n");
        const idx =
          lfBoundary < 0
            ? crlfBoundary
            : crlfBoundary < 0
              ? lfBoundary
              : Math.min(lfBoundary, crlfBoundary);
        if (idx < 0) {
          break;
        }
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + (idx === crlfBoundary ? 4 : 2));
        if (!block.trim()) {
          continue;
        }
        const parsed = parseOneSseBlock(block);
        yield parsed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
