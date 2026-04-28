/**
 * SSE 流解析工具
 * 从 ReadableStream 中逐行提取 `data: ` 报文并反序列化为 JSON 交付给回调。
 */
export async function parseSseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (data: any) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            onChunk(data);
          } catch (err) {
            // 容忍单行 JSON 解析失败
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
