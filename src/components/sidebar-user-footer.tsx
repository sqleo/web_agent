"use client";

import { LeftOutlined, LogoutOutlined, RightOutlined, SettingOutlined } from "@ant-design/icons";
import { Avatar, Button, Divider, Popover, Switch, Typography, theme as antdTheme } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuthSession, getAuthUser } from "@/api/auth-storage";
import type { LoginUser } from "@/api/types";
import { useAppTheme } from "./theme-context";

type Props = {
  collapsed: boolean;
  /** 与侧栏 `theme` 一致：深色侧栏用浅字，浅色侧栏用 token 文字色 */
  sidebarIsDark: boolean;
  onToggleCollapsed: () => void;
};

export function SidebarUserFooter({ collapsed, sidebarIsDark, onToggleCollapsed }: Props) {
  const router = useRouter();
  const { token } = antdTheme.useToken();
  const { mode, setMode } = useAppTheme();
  const [user, setUser] = useState<LoginUser | null>(null);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const displayName = user?.username ?? "未登录";
  const sub = user?.email ?? "点击登录";

  const primaryText = sidebarIsDark ? "#ffffff" : token.colorText;
  const secondaryText = sidebarIsDark ? "rgba(255,255,255,0.45)" : token.colorTextSecondary;
  const footerBg = sidebarIsDark ? "#162032" : token.colorBgContainer;
  const border = `1px solid ${sidebarIsDark ? "rgba(148,163,184,0.24)" : token.colorBorderSecondary}`;

  const settingsPanel = (
    <div className="min-w-[200px] py-1">
      <div className="flex items-center justify-between gap-4 px-1 py-2">
        <Typography.Text type="secondary">深色主题</Typography.Text>
        <Switch
          checked={mode === "dark"}
          onChange={(checked) => setMode(checked ? "dark" : "light")}
        />
      </div>
      <Divider className="!my-2" />
      <Link
        href="/settings"
        className="flex items-center gap-2 rounded px-2 py-2"
        style={{ color: token.colorText }}
      >
        <SettingOutlined />
        账户设置
      </Link>
      <Button
        type="text"
        danger
        block
        className="!justify-start"
        icon={<LogoutOutlined />}
        onClick={() => {
          clearAuthSession();
          router.push("/login");
        }}
      >
        退出登录
      </Button>
    </div>
  );

  const trigger = (
    <div
      className={`flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-2 transition-colors ${
        collapsed ? "justify-center px-0" : "px-2"
      } ${sidebarIsDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.04]"}`}
      style={{
        color: primaryText,
      }}
    >
      <Avatar
        size={collapsed ? 36 : 40}
        style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
      >
        {displayName.slice(0, 1).toUpperCase()}
      </Avatar>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" style={{ color: primaryText }}>
            {displayName}
          </div>
          <div className="truncate text-xs" style={{ color: secondaryText }}>
            {sub}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className="mt-auto w-full shrink-0"
      style={{ background: footerBg, borderTop: border }}
    >
      <div className={`px-2 pt-2 ${collapsed ? "px-1" : ""}`}>
        <Popover
          content={settingsPanel}
          trigger="hover"
          placement={collapsed ? "rightTop" : "topLeft"}
          mouseEnterDelay={0.15}
        >
          {trigger}
        </Popover>
      </div>
      <button
        type="button"
        aria-label={collapsed ? "展开侧栏" : "折叠侧栏"}
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-center py-2.5 transition-colors"
        style={{
          background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
          color: "#fff",
          borderTop: border,
        }}
      >
        {collapsed ? <RightOutlined className="text-sm" /> : <LeftOutlined className="text-sm" />}
      </button>
    </div>
  );
}
