"use client";

import { useState, useEffect, useCallback } from "react";
import { App, Form } from "antd";
import { useRouter } from "next/navigation";
import { getKnowledgeBases, createKnowledgeBase } from "../api/knowledge";
import type { KnowledgeBase } from "../types";

function kbHref(kb: KnowledgeBase): string {
  const q = new URLSearchParams();
  if (kb.name) q.set("name", kb.name);
  const qs = q.toString();
  return qs ? `/knowledge/${kb.id}?${qs}` : `/knowledge/${kb.id}`;
}

export function useKnowledgeBases() {
  const router = useRouter();
  const { message: messageApi } = App.useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<{
    name: string;
    description?: string;
    thumbnail_url?: string;
  }>();
  const [creating, setCreating] = useState(false);

  const [kbListLoading, setKbListLoading] = useState(false);
  const [kbRows, setKbRows] = useState<KnowledgeBase[]>([]);
  const [kbListTotal, setKbListTotal] = useState(0);
  const [kbListQuery, setKbListQuery] = useState({ page: 1, page_size: 12 });

  const loadKnowledgeBaseList = useCallback(async () => {
    setKbListLoading(true);
    try {
      const data = await getKnowledgeBases(kbListQuery);
      setKbRows(data.items);
      setKbListTotal(data.total);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "加载知识库列表失败");
      setKbRows([]);
      setKbListTotal(0);
    } finally {
      setKbListLoading(false);
    }
  }, [kbListQuery, messageApi]);

  useEffect(() => {
    void loadKnowledgeBaseList();
  }, [loadKnowledgeBaseList]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      const kb = await createKnowledgeBase({
        name: values.name,
        description: values.description,
        thumbnail_url: values.thumbnail_url,
      });
      messageApi.success("知识库创建成功");
      createForm.resetFields();
      setCreateModalOpen(false);
      
      const listQuery = { page: 1, page_size: kbListQuery.page_size };
      setKbListQuery(listQuery);
      
      if (kb?.id != null) {
        router.push(kbHref(kb));
      }
    } catch (e) {
      if (e instanceof Error) messageApi.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return {
    kbRows,
    kbListTotal,
    kbListLoading,
    kbListQuery,
    setKbListQuery,
    loadKnowledgeBaseList,
    createModalOpen,
    setCreateModalOpen,
    createForm,
    creating,
    handleCreate,
  };
}
