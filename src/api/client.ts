import { Https } from "@/https/https";
import { api } from "@/https/api";
import { getAuthorizationHeaderValue } from "./auth-storage";

/**
 * 已登录态请求客户端：自动带上 `Authorization: Bearer <access_token>`。
 * 未登录时不会加头（与仅公开接口共用时注意是否在服务端调用）。
 */
const authedKy = api.ky.extend({
  hooks: {
    beforeRequest: [
      (request) => {
        const value = getAuthorizationHeaderValue();
        if (value) {
          request.headers.set("Authorization", value);
        }
      },
    ],
  },
});

export const authApi = new Https(authedKy);
