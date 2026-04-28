"use client";

import { CodeHighlighter, Mermaid, Sources } from "@ant-design/x";
import type { SourcesProps } from "@ant-design/x";
import { Space } from "antd";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { MarkdownProse } from "./markdown-prose";

type SourcesItem = NonNullable<SourcesProps["items"]>[number];

type FenceSegment =
  | { kind: "text"; value: string }
  | { kind: "code"; lang: string; code: string; incomplete?: boolean };

const PRISM_LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  py: "python",
  python: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  yaml: "yaml",
  rb: "ruby",
  ruby: "ruby",
  rs: "rust",
  rust: "rust",
  kt: "kotlin",
  kts: "kotlin",
  go: "go",
  golang: "go",
  fs: "fsharp",
  cs: "csharp",
  csharp: "csharp",
  cpp: "cpp",
  "c++": "cpp",
  cxx: "cpp",
  cc: "cpp",
  c: "c",
  objc: "objectivec",
  pl: "perl",
  perl: "perl",
  php: "php",
  json: "json",
  jsonc: "json",
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  vue: "markup",
  svelte: "markup",
  md: "markdown",
  markdown: "markdown",
  gql: "graphql",
  graphql: "graphql",
  dockerfile: "docker",
  tex: "latex",
  rst: "rest",
  env: "properties",
  toml: "toml",
  txt: "clike",
  text: "clike",
  plaintext: "clike",
  plain: "clike",
};

function normalizeCodeHighlighterLang(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (!k) {
    return "clike";
  }
  return PRISM_LANG_ALIASES[k] ?? k;
}

function splitFencedCodeStreaming(source: string): FenceSegment[] {
  const out: FenceSegment[] = [];
  let i = 0;
  const len = source.length;

  while (i < len) {
    const open = source.indexOf("```", i);
    if (open === -1) {
      if (i < len) {
        out.push({ kind: "text", value: source.slice(i) });
      }
      break;
    }

    if (open > i) {
      out.push({ kind: "text", value: source.slice(i, open) });
    }

    let j = open + 3;
    const langStart = j;
    while (j < len && /[\w-]/.test(source[j]!)) {
      j++;
    }
    const lang = source.slice(langStart, j).trim().toLowerCase();

    while (j < len && source[j] === " ") {
      j++;
    }

    if (j >= len) {
      out.push({ kind: "code", lang: lang || "text", code: "", incomplete: true });
      break;
    }

    if (source[j] === "\r") {
      j++;
      if (j < len && source[j] === "\n") {
        j++;
      }
    } else if (source[j] === "\n") {
      j++;
    } else {
      out.push({ kind: "text", value: source.slice(open) });
      break;
    }

    const close = source.indexOf("```", j);
    if (close === -1) {
      out.push({
        kind: "code",
        lang: lang || "text",
        code: source.slice(j),
        incomplete: true,
      });
      break;
    }

    let code = source.slice(j, close);
    if (code.endsWith("\n")) {
      code = code.slice(0, -1);
    }
    out.push({ kind: "code", lang: lang || "text", code });
    i = close + 3;
  }

  return out.length > 0 ? out : [{ kind: "text", value: source }];
}

function extractCitations(text: string): { body: string; cites: SourcesItem[] } {
  const cites: SourcesItem[] = [];
  const body = text.replace(/\[(\d+)\]\s*\(([^)]+)\)/g, (_, n, ref: string) => {
    const r = ref.trim();
    cites.push({
      key: `cite-${n}-${r.slice(0, 48)}`,
      title: `引用 [${n}]`,
      description: r,
      url: /^https?:\/\//i.test(r) ? r : undefined,
    });
    return "";
  });
  return { body: body.replace(/\n{3,}/g, "\n\n").trimEnd(), cites };
}

export function ChatMessageContent({ text }: { text: string }) {
  const { elements, allCites } = useMemo(() => {
    const segments = splitFencedCodeStreaming(text);
    const citesAcc: SourcesItem[] = [];
    const elements: ReactNode[] = [];

    segments.forEach((seg, idx) => {
      if (seg.kind === "code") {
        const lang = seg.lang;
        const incomplete = Boolean(seg.incomplete);
        if (lang === "mermaid" && !incomplete) {
          elements.push(
            <Mermaid key={`c-${idx}-mermaid`} actions={{ enableCopy: true, enableZoom: true }}>
              {seg.code}
            </Mermaid>
          );
          return;
        }
        const prismLang =
          incomplete && lang === "mermaid"
            ? "markdown"
            : normalizeCodeHighlighterLang(lang);

        elements.push(
          <CodeHighlighter
            key={`c-${idx}-${incomplete ? "open" : "done"}`}
            lang={prismLang}
            prismLightMode={false}
          >
            {seg.code.length > 0 ? seg.code : " "}
          </CodeHighlighter>
        );
        return;
      }
      const { body, cites } = extractCitations(seg.value);
      citesAcc.push(...cites);
      if (body.trim()) {
        elements.push(<MarkdownProse key={`t-${idx}`} markdown={body} />);
      }
    });

    return { elements, allCites: citesAcc };
  }, [text]);

  if (!text.trim()) {
    return null;
  }

  const showFallbackProse = elements.length === 0 && allCites.length === 0;
  const fallbackParsed = showFallbackProse ? extractCitations(text) : null;
  const bottomCites = fallbackParsed ? fallbackParsed.cites : allCites;
  const fallbackBody = fallbackParsed?.body ?? "";

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {elements.length > 0
        ? elements
        : showFallbackProse && fallbackBody.trim()
          ? <MarkdownProse markdown={fallbackBody} />
          : null}
      {bottomCites.length > 0 ? (
        <Sources title="引用来源" items={bottomCites} defaultExpanded={false} />
      ) : null}
    </Space>
  );
}
