"use client";

import {
  ApiOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  MessageOutlined,
  RocketOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Input, Layout, Menu, theme as antdTheme } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";
import { useAppTheme } from "@/components/theme-context";

const { Header, Sider, Content } = Layout;

const ROUTE_TITLES: Record<string, string> = {
  "/": "首页",
  "/knowledge": "知识库",
  "/ai-tool": "AI tool",
  "/vendors": "厂商管理",
  "/chat": "聊天",
  "/settings": "账户设置",
};

const MENU_KEYS = ["/", "/knowledge", "/ai-tool", "/vendors", "/chat"] as const;

function normalizePath(path: string): string {
  if (path === "/") {
    return "/";
  }
  const seg = path.split("/")[1];
  return seg ? `/${seg}` : "/";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = antdTheme.useToken();
  const { mode } = useAppTheme();
  const sidebarIsDark = mode === "dark";

  const activePath = normalizePath(pathname);

  const menuSelectedKeys = MENU_KEYS.includes(activePath as (typeof MENU_KEYS)[number])
    ? [activePath]
    : [];

  const breadcrumbItems = useMemo(() => {
    const title = ROUTE_TITLES[activePath] ?? "首页";
    if (activePath === "/") {
      return [{ title: "首页" }];
    }
    return [{ title: <Link href="/">首页</Link> }, { title }];
  }, [activePath]);

  return (
    <Layout
      className="min-h-dvh w-full"
      style={{
        background: token.colorBgLayout,
        minHeight: "100dvh",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <Sider
        className="dashboard-sider"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        collapsedWidth={72}
        theme={sidebarIsDark ? "dark" : "light"}
        style={{
          background: sidebarIsDark ? "#111318" : token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          minHeight: "100dvh",
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="shrink-0 px-3 py-4">
            <Input
              allowClear
              prefix={
                <SearchOutlined
                  style={{ color: token.colorTextSecondary }}
                />
              }
              placeholder={collapsed ? "" : "搜索"}
              className="rounded-lg"
              style={
                sidebarIsDark
                  ? { background: "rgba(255,255,255,0.06)", border: "none" }
                  : { background: token.colorFillSecondary, border: "none" }
              }
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Menu
              mode="inline"
              theme={sidebarIsDark ? "dark" : "light"}
              selectedKeys={menuSelectedKeys}
              style={{ background: "transparent", border: "none" }}
              items={[
                {
                  key: "/",
                  icon: <BarChartOutlined />,
                  label: "首页",
                },
                {
                  key: "/knowledge",
                  icon: <DatabaseOutlined />,
                  label: "知识库",
                },
                {
                  key: "/ai-tool",
                  icon: <RocketOutlined />,
                  label: "AI tool",
                },
                {
                  key: "/chat",
                  icon: <MessageOutlined />,
                  label: "聊天",
                },
                {
                  key: "/vendors",
                  icon: <ApiOutlined />,
                  label: "厂商管理",
                },
              ]}
              onClick={({ key }) => router.push(key)}
            />
          </div>
          <SidebarUserFooter
            collapsed={collapsed}
            sidebarIsDark={sidebarIsDark}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
          />
        </div>
      </Sider>
      <Layout
        style={{
          background: token.colorBgLayout,
          minHeight: "100dvh",
          height: "100dvh",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "transparent",
            lineHeight: "56px",
            height: 56,
            flexShrink: 0,
          }}
        >
          <Breadcrumb items={breadcrumbItems} style={{ color: token.colorTextSecondary }} />
        </Header>
        <Content
          style={{
            padding: "0 24px 24px",
            flex: 1,
            background: token.colorBgLayout,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
