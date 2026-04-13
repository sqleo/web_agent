"use client";

import { Alert, Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/api";

type LoginFields = {
  account: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [form] = Form.useForm<LoginFields>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: LoginFields) {
    setError(null);
    setPending(true);
    try {
      await login({
        account: values.account.trim(),
        password: values.password,
      });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md" styles={{ body: { padding: 32 } }}>
      <div className="mb-8 text-center">
        <Typography.Title level={3} style={{ margin: 0 }}>
          登录
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0 mt-2">
          登录成功后跳转到首页
        </Typography.Paragraph>
      </div>

      <Form<LoginFields>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
        onValuesChange={() => setError(null)}
      >
        {error ? (
          <Alert className="mb-4" type="error" message={error} showIcon closable onClose={() => setError(null)} />
        ) : null}

        <Form.Item
          label="账号"
          name="account"
          normalize={(v) => (typeof v === "string" ? v.trim() : v)}
          rules={[
            { required: true, message: "请填写账号" },
            { type: "email", message: "请输入有效邮箱" },
          ]}
        >
          <Input autoComplete="username" placeholder="you@example.com" size="large" />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "请填写密码" }]}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder="••••••••"
            size="large"
          />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" loading={pending} block size="large">
            登录
          </Button>
        </Form.Item>
      </Form>

      <Typography.Paragraph type="secondary" className="!mb-0 mt-8 text-center">
        <Link href="/register">没有账号？去注册</Link>
        <span className="mx-2 text-zinc-300">|</span>
        <Link href="/">返回首页</Link>
      </Typography.Paragraph>
    </Card>
  );
}
