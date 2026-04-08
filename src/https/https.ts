import ky, { HTTPError, type Input, type KyInstance, type Options } from "ky";
import { readBytesStream, readTextStream } from "./stream";

export type StreamMethod = "GET" | "POST" | "PUT" | "DELETE";

export type CreateHttpsOptions = Options;

const streamMethodMap = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
} as const satisfies Record<StreamMethod, keyof Pick<KyInstance, "get" | "post" | "put" | "delete">>;

function mergeStreamOptions(options?: Options): Options {
  return {
    ...options,
    timeout: options?.timeout !== undefined ? options.timeout : false,
  };
}

export class Https {
  constructor(readonly ky: KyInstance) {}

  get<T = unknown>(url: Input, options?: Options): Promise<T> {
    return this.ky.get(url, options).json<T>();
  }

  post<T = unknown>(url: Input, options?: Options): Promise<T> {
    return this.ky.post(url, options).json<T>();
  }

  put<T = unknown>(url: Input, options?: Options): Promise<T> {
    return this.ky.put(url, options).json<T>();
  }

  patch<T = unknown>(url: Input, options?: Options): Promise<T> {
    return this.ky.patch(url, options).json<T>();
  }

  /** 对应 HTTP DELETE（ky 的 `delete`） */
  del<T = unknown>(url: Input, options?: Options): Promise<T> {
    return this.ky.delete(url, options).json<T>();
  }

  /**
   * 流式请求：返回原始 `Response`，请使用 `body` 自行消费。
   * 上传流式 body 时请在 `options` 中传入 `body: ReadableStream`，
   * 并在支持的环境下设置 `duplex: "half"`（见 Fetch 流式上传说明）。
   */
  async stream(
    method: StreamMethod,
    url: Input,
    options?: Options
  ): Promise<Response> {
    const key = streamMethodMap[method];
    return await this.ky[key](url, mergeStreamOptions(options));
  }

  /** 流式读取响应，按 UTF-8 文本块产出 */
  async *streamText(
    method: StreamMethod,
    url: Input,
    options?: Options
  ): AsyncGenerator<string, void, undefined> {
    const response = await this.stream(method, url, options);
    yield* readTextStream(response.body);
  }

  /** 流式读取响应，按 `Uint8Array` 块产出 */
  async *streamBytes(
    method: StreamMethod,
    url: Input,
    options?: Options
  ): AsyncGenerator<Uint8Array, void, undefined> {
    const response = await this.stream(method, url, options);
    yield* readBytesStream(response.body);
  }
}

export function createHttps(options?: CreateHttpsOptions): Https {
  const instance = ky.create({
    timeout: 30_000,
    retry: { limit: 2 },
    ...options,
  });
  return new Https(instance);
}

let defaultHttps: Https | null = null;

export function getHttps(): Https {
  if (!defaultHttps) {
    defaultHttps = createHttps();
  }
  return defaultHttps;
}

export function setHttps(client: Https): void {
  defaultHttps = client;
}

export { HTTPError };
