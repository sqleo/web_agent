import { createHttps } from "./https";

/** 去掉末尾 `/`，与 ky 的 prefixUrl 搭配使用 */
function normalizeBaseUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

function resolvePrefixUrl(): string | undefined {
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromEnv) {
    return fromEnv;
  }
  // 未配置时，在浏览器里用当前站点 origin，避免在 /login 下用相对路径 `auth/login` 拼错
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

const prefixUrl = resolvePrefixUrl();

/**
 * 带环境变量前缀的 API 客户端。
 * 未配置 `NEXT_PUBLIC_API_BASE_URL` 时，在浏览器中默认使用当前页面的 origin。
 */
export const api = createHttps(prefixUrl ? { prefixUrl } : {});
