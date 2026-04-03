import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "登录",
  description: "登录后进入首页",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <LoginForm />
    </div>
  );
}
