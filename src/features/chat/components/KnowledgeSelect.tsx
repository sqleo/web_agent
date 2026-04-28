"use client";

import { Select } from "antd";
import { useEffect, useState } from "react";
import { getKnowledgeBases } from "@/api/knowledge-bases";

interface KnowledgeSelectProps {
  value: number | "all";
  onChange: (value: number | "all") => void;
}

export function KnowledgeSelect({ value, onChange }: KnowledgeSelectProps) {
  const [options, setOptions] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await getKnowledgeBases({ page: 1, page_size: 200 });
        if (cancelled) {
          return;
        }
        setOptions(data.items.map((k) => ({ value: k.id, label: k.name })));
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Select<number | "all">
      size="small"
      loading={loading}
      style={{ minWidth: 168 }}
      aria-label="检索知识库范围"
      value={value}
      onChange={onChange}
      options={[
        { value: "all", label: "全部知识库" },
        ...options.map((o) => ({ value: o.value, label: o.label })),
      ]}
    />
  );
}
