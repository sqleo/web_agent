"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { App, Form } from "antd";
import type { FormInstance } from "antd";
import {
  getMetadataFields,
  createMetadataField,
  patchMetadataField,
  deleteMetadataField,
  createMetadataFieldAlias,
  patchMetadataFieldAlias,
  deleteMetadataFieldAlias,
} from "../api/knowledge-config";
import { getKnowledgeBases } from "@/features/knowledge/api/knowledge";
import type {
  MetadataField,
  MetadataFieldAlias,
  GetMetadataFieldsQuery,
  KnowledgeBase,
  ScopeMode,
  MetadataMatchMode,
} from "../types";

const VALUE_TYPES = ["text", "number", "list", "date"] as const;
const EXTRACT_MODES = ["field", "section"] as const;

export function useKnowledgeConfig() {
  const { message: messageApi } = App.useApp();
  const messageApiRef = useRef(messageApi);
  messageApiRef.current = messageApi;

  const showError = useCallback((text: string) => {
    queueMicrotask(() => {
      messageApiRef.current.error(text);
    });
  }, []);

  const showSuccess = useCallback((text: string) => {
    queueMicrotask(() => {
      messageApiRef.current.success(text);
    });
  }, []);

  const showWarning = useCallback((text: string) => {
    queueMicrotask(() => {
      messageApiRef.current.warning(text);
    });
  }, []);

  const [scopeMode, setScopeMode] = useState<ScopeMode>("kb");
  const [bizCode, setBizCode] = useState("");
  const [kbId, setKbId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<0 | 1 | undefined>(1);

  const [kbOptions, setKbOptions] = useState<KnowledgeBase[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState<MetadataField[]>([]);
  const [total, setTotal] = useState(0);

  const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
  const [apiMd, setApiMd] = useState("");
  const [apiMdLoading, setApiMdLoading] = useState(false);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldEditing, setFieldEditing] = useState<MetadataField | null>(null);
  
  const [fieldForm] = Form.useForm<{
    field_key: string;
    field_name: string;
    value_type: (typeof VALUE_TYPES)[number];
    extract_mode: (typeof EXTRACT_MODES)[number];
    status: number;
    priority: number;
    aliases?: { alias_text: string; match_mode: MetadataMatchMode; status: number; priority: number }[];
  }>();
  
  const [fieldSubmitting, setFieldSubmitting] = useState(false);

  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [aliasFieldId, setAliasFieldId] = useState<number | null>(null);
  const [aliasEditing, setAliasEditing] = useState<MetadataFieldAlias | null>(null);
  
  const [aliasForm] = Form.useForm<{
    alias_text: string;
    match_mode: MetadataMatchMode;
    status: number;
    priority: number;
  }>();
  
  const [aliasSubmitting, setAliasSubmitting] = useState(false);

  const listQuery = useMemo(() => {
    const q: GetMetadataFieldsQuery = {};
    if (statusFilter !== undefined) {
      q.status = statusFilter;
    }
    if (scopeMode === "global") {
      return q;
    }
    if (scopeMode === "biz") {
      const t = bizCode.trim();
      if (t) q.biz_code = t;
      return q;
    }
    if (kbId != null) {
      q.knowledge_base_id = kbId;
    }
    return q;
  }, [scopeMode, bizCode, kbId, statusFilter]);

  const canQuery = useMemo(() => {
    if (scopeMode === "biz") {
      return bizCode.trim().length > 0;
    }
    if (scopeMode === "kb") {
      return kbId != null;
    }
    return true;
  }, [scopeMode, bizCode, kbId]);

  useEffect(() => {
    let cancelled = false;
    setKbLoading(true);
    void getKnowledgeBases({ page: 1, page_size: 200 })
      .then((data) => {
        if (!cancelled) {
          setKbOptions(data.items);
          if (kbId == null && data.items.length > 0) {
            setKbId(data.items[0].id);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          showError(e instanceof Error ? e.message : "加载知识库列表失败");
        }
      })
      .finally(() => {
        if (!cancelled) setKbLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kbId, showError]);

  const loadList = useCallback(async () => {
    if (!canQuery) {
      setRows([]);
      setTotal(0);
      return;
    }
    setListLoading(true);
    try {
      const data = await getMetadataFields(listQuery);
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      showError(e instanceof Error ? e.message : "加载失败");
      setRows([]);
      setTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [canQuery, listQuery, showError]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openApiDrawer = () => {
    setApiDrawerOpen(true);
    if (apiMd) return;
    setApiMdLoading(true);
    void fetch("/knowledge-config/api.md")
      .then((r) => {
        if (!r.ok) throw new Error(`加载文档失败（${r.status}）`);
        return r.text();
      })
      .then((t) => setApiMd(t))
      .catch((e) => showError(e instanceof Error ? e.message : "加载文档失败"))
      .finally(() => setApiMdLoading(false));
  };

  const openCreateField = () => {
    if (!canQuery) {
      showWarning(
        scopeMode === "biz" ? "请先填写业务编码" : scopeMode === "kb" ? "请先选择知识库" : "请选择作用域"
      );
      return;
    }
    setFieldEditing(null);
    fieldForm.resetFields();
    fieldForm.setFieldsValue({
      value_type: "text",
      extract_mode: "field",
      status: 1,
      priority: 10,
      aliases: [{ alias_text: "", match_mode: "exact", status: 1, priority: 10 }],
    });
    setFieldModalOpen(true);
  };

  const openEditField = (row: MetadataField) => {
    setFieldEditing(row);
    fieldForm.setFieldsValue({
      field_key: row.field_key,
      field_name: row.field_name,
      value_type: row.value_type as any,
      extract_mode: row.extract_mode as any,
      status: row.status,
      priority: row.priority,
    });
    setFieldModalOpen(true);
  };

  const submitField = async () => {
    try {
      const v = await fieldForm.validateFields();
      setFieldSubmitting(true);
      if (fieldEditing) {
        await patchMetadataField(fieldEditing.id, {
          field_name: v.field_name,
          priority: v.priority,
          status: v.status,
        });
        showSuccess("已更新字段");
      } else {
        const bodyScope: { biz_code?: string; knowledge_base_id?: number } = {};
        if (scopeMode === "biz") {
          bodyScope.biz_code = bizCode.trim();
        } else if (scopeMode === "kb" && kbId != null) {
          bodyScope.knowledge_base_id = kbId;
        }
        const aliases = (v.aliases ?? [])
          .filter((a) => a.alias_text?.trim())
          .map((a) => ({
            alias_text: a.alias_text.trim(),
            match_mode: a.match_mode,
            status: a.status,
            priority: a.priority,
          }));
        await createMetadataField({
          ...bodyScope,
          field_key: v.field_key.trim(),
          field_name: v.field_name.trim(),
          value_type: v.value_type,
          extract_mode: v.extract_mode,
          status: v.status,
          priority: v.priority,
          aliases: aliases as any,
        });
        showSuccess("已新建字段");
      }
      setFieldModalOpen(false);
      await loadList();
    } catch (e) {
      if (e instanceof Error) showError(e.message);
    } finally {
      setFieldSubmitting(false);
    }
  };

  const handleDeleteField = async (id: number) => {
    try {
      await deleteMetadataField(id);
      showSuccess("已删除字段");
      await loadList();
    } catch (e) {
      showError(e instanceof Error ? e.message : "删除失败");
    }
  };

  const openCreateAlias = (fieldId: number) => {
    setAliasFieldId(fieldId);
    setAliasEditing(null);
    aliasForm.resetFields();
    aliasForm.setFieldsValue({
      match_mode: "exact",
      status: 1,
      priority: 10,
    });
    setAliasModalOpen(true);
  };

  const openEditAlias = (fieldId: number, a: MetadataFieldAlias) => {
    setAliasFieldId(fieldId);
    setAliasEditing(a);
    aliasForm.setFieldsValue({
      alias_text: a.alias_text,
      match_mode: a.match_mode,
      status: a.status,
      priority: a.priority,
    });
    setAliasModalOpen(true);
  };

  const submitAlias = async () => {
    if (aliasFieldId == null) return;
    try {
      const v = await aliasForm.validateFields();
      setAliasSubmitting(true);
      if (aliasEditing) {
        await patchMetadataFieldAlias(aliasEditing.id, {
          alias_text: v.alias_text.trim(),
          match_mode: v.match_mode,
          status: v.status,
          priority: v.priority,
        });
        showSuccess("已更新别名");
      } else {
        await createMetadataFieldAlias(aliasFieldId, {
          alias_text: v.alias_text.trim(),
          match_mode: v.match_mode,
          status: v.status,
          priority: v.priority,
        });
        showSuccess("已新增别名");
      }
      setAliasModalOpen(false);
      await loadList();
    } catch (e) {
      if (e instanceof Error) showError(e.message);
    } finally {
      setAliasSubmitting(false);
    }
  };

  const handleDeleteAlias = async (aliasId: number) => {
    try {
      await deleteMetadataFieldAlias(aliasId);
      showSuccess("已删除别名");
      await loadList();
    } catch (e) {
      showError(e instanceof Error ? e.message : "删除失败");
    }
  };

  return {
    scopeMode,
    setScopeMode,
    bizCode,
    setBizCode,
    kbId,
    setKbId,
    statusFilter,
    setStatusFilter,
    kbOptions,
    kbLoading,
    listLoading,
    rows,
    total,
    apiDrawerOpen,
    setApiDrawerOpen,
    apiMd,
    apiMdLoading,
    fieldModalOpen,
    setFieldModalOpen,
    fieldEditing,
    fieldForm,
    fieldSubmitting,
    aliasModalOpen,
    setAliasModalOpen,
    aliasEditing,
    aliasForm,
    aliasSubmitting,
    canQuery,
    loadList,
    openApiDrawer,
    openCreateField,
    openEditField,
    submitField,
    handleDeleteField,
    openCreateAlias,
    openEditAlias,
    submitAlias,
    handleDeleteAlias,
  };
}
