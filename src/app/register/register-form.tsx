"use client";

import { Alert, Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/api";

type RegisterFields = {
  username: string;
  email: string;
  password: string;
  confirm: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [form] = Form.useForm<RegisterFields>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: RegisterFields) {
    setError(null);
    setPending(true);
    try {
      const { autoLoggedIn } = await register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      if (autoLoggedIn) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/login");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "注册失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md" styles={{ body: { padding: 32 } }}>
      <div className="mb-8 text-center">
        <Typography.Title level={3} style={{ margin: 0 }}>
          注册
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0 mt-2">
          创建账号后继续
        </Typography.Paragraph>
      </div>

      <Form<RegisterFields>
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
          label="用户名"
          name="username"
          normalize={(v) => (typeof v === "string" ? v.trim() : v)}
          rules={[{ required: true, message: "请填写用户名" }]}
        >
          <Input autoComplete="username" placeholder="初九" size="large" />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          normalize={(v) => (typeof v === "string" ? v.trim() : v)}
          rules={[
            { required: true, message: "请填写邮箱" },
            { type: "email", message: "请输入有效邮箱" },
          ]}
        >
          <Input autoComplete="email" placeholder="you@example.com" size="large" />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请填写密码" },
            { min: 6, message: "至少 6 位" },
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder="••••••••" size="large" />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirm"
          dependencies={["password"]}
          rules={[
            { required: true, message: "请再次输入密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder="••••••••" size="large" />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" loading={pending} block size="large">
            注册
          </Button>
        </Form.Item>
      </Form>

      <Typography.Paragraph type="secondary" className="!mb-0 mt-8 text-center">
        <Link href="/login">已有账号？去登录</Link>
        <span className="mx-2 text-zinc-300">|</span>
        <Link href="/">返回首页</Link>
      </Typography.Paragraph>
    </Card>
  );
}
