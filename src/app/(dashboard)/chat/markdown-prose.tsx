"use client";

import { Typography } from "antd";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

/** 与 rehype-sanitize 默认一致；GFM 表格、任务列表等已在 defaultSchema 中覆盖 */
const sanitizeSchema = defaultSchema;

function flattenText(children: ReactNode): string {
  if (children == null || typeof children === "boolean") {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(flattenText).join("");
  }
  if (typeof children === "object" && "props" in children) {
    return flattenText((children as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 8 }}>
      {children}
    </Typography.Title>
  ),
  h2: ({ children }) => (
    <Typography.Title level={5} style={{ marginTop: 10, marginBottom: 6 }}>
      {children}
    </Typography.Title>
  ),
  h3: ({ children }) => (
    <Typography.Title level={5} type="secondary" style={{ marginTop: 8, marginBottom: 4 }}>
      {children}
    </Typography.Title>
  ),
  h4: ({ children }) => (
    <Typography.Title level={5} type="secondary" style={{ marginTop: 8, marginBottom: 4, fontSize: 15 }}>
      {children}
    </Typography.Title>
  ),
  h5: ({ children }) => (
    <Typography.Text strong style={{ display: "block", marginTop: 6 }}>
      {children}
    </Typography.Text>
  ),
  h6: ({ children }) => (
    <Typography.Text strong style={{ display: "block", marginTop: 6 }}>
      {children}
    </Typography.Text>
  ),
  p: ({ children }) => <Typography.Paragraph style={{ marginBottom: 8 }}>{children}</Typography.Paragraph>,
  ul: ({ children }) => (
    <ul style={{ marginTop: 4, marginBottom: 8, paddingLeft: 20, listStyleType: "disc" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ marginTop: 4, marginBottom: 8, paddingLeft: 20, listStyleType: "decimal" }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginTop: 2 }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "8px 0",
        paddingLeft: 12,
        borderLeft: "3px solid rgba(0, 0, 0, 0.12)",
      }}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <Typography.Link href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Typography.Link>
  ),
  code: ({ className, children }) => {
    const isLangBlock = Boolean(className && /language-/.test(className));
    const raw = flattenText(children);
    const multiline = raw.includes("\n");
    if (isLangBlock || multiline) {
      return (
        <code
          className={className}
          style={{
            display: "block",
            whiteSpace: "pre-wrap",
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: "inherit",
            padding: 0,
            margin: 0,
            background: "transparent",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {children}
        </code>
      );
    }
    return <Typography.Text code>{children}</Typography.Text>;
  },
  pre: ({ children }) => (
    <pre
      style={{
        margin: "8px 0",
        overflow: "auto",
        maxWidth: "100%",
        padding: 10,
        borderRadius: 8,
        background: "rgba(0, 0, 0, 0.04)",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 13,
      }}
    >
      {children}
    </pre>
  ),
  hr: () => <hr style={{ margin: "12px 0", border: 0, borderTop: "1px solid rgba(0, 0, 0, 0.08)" }} />,
  table: ({ children }) => (
    <div style={{ overflow: "auto", marginBottom: 8, maxWidth: "100%" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children, style }) => (
    <th
      style={{
        border: "1px solid rgba(0, 0, 0, 0.12)",
        padding: "6px 8px",
        textAlign: "left",
        ...style,
      }}
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td style={{ border: "1px solid rgba(0, 0, 0, 0.12)", padding: "6px 8px", ...style }}>{children}</td>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }} />
  ),
  input: ({ type, checked }) => {
    if (type === "checkbox") {
      return <input type="checkbox" checked={Boolean(checked)} disabled readOnly />;
    }
    return null;
  },
};

export function MarkdownProse({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return null;
  }
  return (
    <div className="chat-markdown-prose" style={{ width: "100%", overflowWrap: "break-word" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={mdComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
