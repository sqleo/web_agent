import type { Metadata } from "next";
import { LoginRedirectWhenAuthed } from "../login/login-redirect";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "注册",
  description: "创建账号",
};

export default function RegisterPage() {
  return (
    <LoginRedirectWhenAuthed>
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16">
        <RegisterForm />
      </div>
    </LoginRedirectWhenAuthed>
  );
}
