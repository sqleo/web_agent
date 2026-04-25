"use client";

import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useEffect } from "react";
import { useAppTheme } from "./theme-context";

export function AntdProvider({
  children,
  forceLight = false,
}: {
  children: React.ReactNode;
  /** `/login` 等页面固定浅色，不跟随全局主题 */
  forceLight?: boolean;
}) {
  const { mode } = useAppTheme();

  const dark = forceLight ? false : mode === "dark";

  useEffect(() => {
    const bg = dark ? "#0F172A" : "#f5f5f5";
    const fg = dark ? "#ededed" : "rgba(0,0,0,0.88)";
    document.body.style.backgroundColor = bg;
    document.body.style.color = fg;
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.style.color = fg;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  const isDark = dark;

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDark
          ? {
              colorPrimary: "#3B82F6",
              colorInfo: "#3B82F6",
              colorLink: "#8B5CF6",
              colorSuccess: "#10B981",
              colorWarning: "#F59E0B",
              colorError: "#EF4444",
              colorBgLayout: "#0F172A",
              colorBgContainer: "#1E293B",
              colorBgElevated: "#1E293B",
              colorBorderSecondary: "rgba(148,163,184,0.28)",
            }
          : {
              colorBgLayout: "#f5f5f5",
              colorBgContainer: "#ffffff",
              colorBorderSecondary: "rgba(0,0,0,0.06)",
            },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
