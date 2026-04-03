"use client";

import { Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFields = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [form] = Form.useForm<LoginFields>();
  const [pending, setPending] = useState(false);

  async function onFinish(_values: LoginFields) {
    setPending(true);
    await new Promise((r) => setTimeout(r, 300));

    if (typeof window !== "undefined") {
      sessionStorage.setItem("web_agent_auth", "1");
    }

    setPending(false);
    router.push("/");
    router.refresh();
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
      >
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
        <Link href="/">返回首页</Link>
      </Typography.Paragraph>
    </Card>
  );
}
