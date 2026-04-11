/** 与 `src/https/api.ts` 的 prefix 规则一致 */

function normalizeBaseUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

/**
 * 将接口返回的相对路径（如 `/static/parsed_md/...`）转为浏览器可打开的绝对 URL。
 */
export function resolveApiPublicUrl(pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) {
    return p;
  }
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const base = fromEnv || (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) {
    return p.startsWith("/") ? p : `/${p}`;
  }
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
}
