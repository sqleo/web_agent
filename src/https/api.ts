import { getApiVersionedBase } from "@/lib/api-base";
import { createHttps } from "./https";

const prefixUrl = getApiVersionedBase();

/**
 * 带环境变量前缀的 API 客户端（实际请求根为 `{origin}/v1`，见 `src/lib/api-base.ts`）。
 * 未配置 `NEXT_PUBLIC_API_BASE_URL` 时，在浏览器中默认使用当前页面的 origin + `/v1`。
 */
export const api = createHttps(prefixUrl ? { prefixUrl } : {});
