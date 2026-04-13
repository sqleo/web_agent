import { getApiVersionedBase } from "@/lib/api-base";

/**
 * 将接口返回的相对路径（如 `/static/parsed_md/...`）转为浏览器可打开的绝对 URL。
 * 根地址与 `src/https/api.ts` 一致（含 `/v1`）。
 */
export function resolveApiPublicUrl(pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) {
    return p;
  }
  const base = getApiVersionedBase() ?? "";
  if (!base) {
    return p.startsWith("/") ? p : `/${p}`;
  }
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
}
