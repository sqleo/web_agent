import ky from "ky";
import { message } from "antd";
import { getApiVersionedBase } from "./api-base";
import { getAccessToken } from "@/api/auth-storage";

export const http = ky.create({
  prefixUrl: getApiVersionedBase() || "http://localhost:8888/v1",
  timeout: 30000,
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
    afterResponse: [
      async (req, opt, res) => {
        if (!res.ok) {
          const error = (await res.json().catch(() => ({}))) as { message?: string };
          message.error(error.message || "请求失败");
        }
      },
    ],
  },
});
