"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AUTH_FLAG_KEY = "web_agent_auth";

type Props = {
  children: React.ReactNode;
};

/** 已登录时访问 /login，自动跳回首页 */
export function LoginRedirectWhenAuthed({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const authed = sessionStorage.getItem(AUTH_FLAG_KEY) === "1";
    if (authed) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

