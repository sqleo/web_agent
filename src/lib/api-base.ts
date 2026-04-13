/** 后端全局 API 路径前缀（与路由挂载一致） */
export const API_VERSION = "v1" as const;

export function normalizeBaseUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

function resolveRootBase(): string | undefined {
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromEnv) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

/**
 * 带版本前缀的 API 根，如 `https://host:8888/v1`。
 * 若 `NEXT_PUBLIC_API_BASE_URL` 已以 `/v1` 结尾，则不再重复追加。
 */
export function getApiVersionedBase(): string | undefined {
  const root = resolveRootBase();
  if (!root) {
    return undefined;
  }
  const b = root.replace(/\/+$/, "");
  if (b.endsWith(`/${API_VERSION}`)) {
    return b;
  }
  return `${b}/${API_VERSION}`;
}
