import type { LoginData, LoginUser } from "./types";

const ACCESS_TOKEN_KEY = "web_agent_access_token";
const AUTH_FLAG_KEY = "web_agent_auth";
const USER_KEY = "web_agent_user";
const AUTH_COOKIE_KEY = "web_agent_auth";

function setAuthCookie(authed: boolean): void {
  if (typeof document === "undefined") {
    return;
  }
  if (authed) {
    document.cookie = `${AUTH_COOKIE_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("auth-storage 仅在浏览器环境可用");
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): LoginUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginUser;
  } catch {
    return null;
  }
}

/** 登录成功后写入会话 */
export function persistLoginSession(data: LoginData): void {
  assertBrowser();
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  sessionStorage.setItem(AUTH_FLAG_KEY, "1");
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  setAuthCookie(true);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_FLAG_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("web_agent_token");
  setAuthCookie(false);
}

/** 构造 Authorization 头值，如 `Bearer xxx` */
export function getAuthorizationHeaderValue(): string | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  return `Bearer ${token}`;
}
