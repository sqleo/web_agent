"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AUTH_FLAG_KEY = "web_agent_auth";

type Props = {
  children: React.ReactNode;
};

/** 保护工作台路由：未登录时跳转到 /login */
export function DashboardAuthGuard({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const authed = sessionStorage.getItem(AUTH_FLAG_KEY) === "1";
    if (!authed) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

