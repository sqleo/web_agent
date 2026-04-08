"use client";

import { theme } from "antd";

/** 仪表盘主内容区卡片容器，随主题切换背景与边框 */
export function DashboardPageCard({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div
      className="rounded-xl p-6 shadow-sm"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        color: token.colorText,
      }}
    >
      {children}
    </div>
  );
}
