/**
 * 将响应体按 UTF-8 增量解码为文本片段（适用于 SSE、分块 JSON 等）。
 */
export async function* readTextStream(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<string, void, undefined> {
  if (!body) {
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        const tail = decoder.decode();
        if (tail) {
          yield tail;
        }
        break;
      }
      if (value && value.length > 0) {
        yield decoder.decode(value, { stream: true });
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 按二进制块读取响应体。
 */
export async function* readBytesStream(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<Uint8Array, void, undefined> {
  if (!body) {
    return;
  }

  const reader = body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value && value.length > 0) {
        yield value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
