import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_KEY = "web_agent_auth";

function isAuthed(req: NextRequest): boolean {
  return req.cookies.get(AUTH_COOKIE_KEY)?.value === "1";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthed(req);

  // 已登录不允许进登录页
  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 未登录拦截业务页到登录页
  if (pathname !== "/login" && !authed) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
