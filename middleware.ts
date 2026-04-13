import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_VERSION } from "@/lib/api-base";

const AUTH_COOKIE_KEY = "web_agent_auth";

/** 未登录也可访问的页面；其余路径默认需登录。新增公开页时在此补充。 */
const PUBLIC_PATHS = new Set(["/login", "/register"]);

function isAuthed(req: NextRequest): boolean {
  return req.cookies.get(AUTH_COOKIE_KEY)?.value === "1";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthed(req);

  // 已登录不进入登录/注册页
  if ((pathname === "/login" || pathname === "/register") && authed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 后端统一 `/v1`：误发到本域时不做登录重定向（与 src/lib/api-base.ts 一致）
  if (pathname === `/${API_VERSION}` || pathname.startsWith(`/${API_VERSION}/`)) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
