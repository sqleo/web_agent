import { getApiVersionedBase } from "@/lib/api-base";
import { getAccessToken } from "@/api/auth-storage";
import { createHttps } from "./https";

const prefixUrl = getApiVersionedBase() || "http://localhost:8888/v1";

/**
 * 带环境变量前缀的 API 客户端。
 * 注入公共 JWT 鉴权拦截器。
 */
export const api = createHttps({
  prefixUrl,
  hooks: {
    beforeRequest: [
      (req) => {
        if (typeof window !== "undefined") {
          const token = getAccessToken();
          if (token) {
            req.headers.set("Authorization", `Bearer ${token}`);
          }
        }
      },
    ],
  },
});
