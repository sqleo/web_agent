"use client";

import { usePathname } from "next/navigation";
import { AntdProvider } from "./antd-provider";
import { ThemeContextProvider } from "./theme-context";

export function AppRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lockLoginLight = pathname === "/login";

  return (
    <ThemeContextProvider>
      <AntdProvider forceLight={lockLoginLight}>
        <div
          className="flex min-h-dvh w-full flex-1 flex-col"
          style={{ background: "inherit" }}
        >
          {children}
        </div>
      </AntdProvider>
    </ThemeContextProvider>
  );
}
