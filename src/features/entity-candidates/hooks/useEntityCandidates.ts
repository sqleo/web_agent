"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { App, Form } from "antd";
import {
  getEntityCandidates,
  approveEntityCandidate,
  rejectEntityCandidate,
  mergeEntityCandidate,
  getTargetEntitiesForMerge,
} from "../api/entity-candidates";
import { getKnowledgeBases } from "@/features/knowledge/api/knowledge";
import type {
  EntityCandidate,
  EntityCandidateStatus,
  GetEntityCandidatesQuery,
  KnowledgeBase,
  TargetEntityOption,
} from "../types";

function normalizeAliasList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const t = s?.trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function useEntityCandidates() {
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

  const [filterForm] = Form.useForm<{
    status?: EntityCandidateStatus;
    biz_code?: string;
    knowledge_base_id?: number;
    file_id?: number;
    keyword?: string;
  }>();

  const [applied, setApplied] = useState<GetEntityCandidatesQuery>({
    page: 1,
    page_size: 20,
    status: "pending",
  });

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EntityCandidate[]>([]);
  const [total, setTotal] = useState(0);

  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<EntityCandidate | null>(null);

  const [approveForm] = Form.useForm<{
    canonical_name: string;
    entity_type: string;
    aliases: { text: string }[];
    review_comment?: string;
  }>();
  const [rejectForm] = Form.useForm<{ review_comment: string }>();
  const [mergeForm] = Form.useForm<{ target_entity_id: number; review_comment?: string }>();

  const [submitApprove, setSubmitApprove] = useState(false);
  const [submitReject, setSubmitReject] = useState(false);
  const [submitMerge, setSubmitMerge] = useState(false);

  const [mergeOptions, setMergeOptions] = useState<TargetEntityOption[]>([]);
  const [mergeSearchLoading, setMergeSearchLoading] = useState(false);
  const mergeSearchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadKb = useCallback(() => {
    setKbLoading(true);
    void getKnowledgeBases({ page: 1, page_size: 200 })
      .then((d) => setKbList(d.items))
      .catch((e) => showError(e instanceof Error ? e.message : "加载知识库失败"))
      .finally(() => setKbLoading(false));
  }, [showError]);

  useEffect(() => {
    loadKb();
  }, [loadKb]);

  useEffect(() => {
    return () => {
      if (mergeSearchTimer.current) {
        clearTimeout(mergeSearchTimer.current);
      }
    };
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntityCandidates(applied);
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      showError(e instanceof Error ? e.message : "加载失败");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [applied, showError]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleSearch = async () => {
    const v = await filterForm.validateFields().catch(() => null);
    if (!v) return;
    setApplied({
      page: 1,
      page_size: applied.page_size ?? 20,
      status: v.status ?? "pending",
      biz_code: v.biz_code?.trim() || undefined,
      knowledge_base_id: v.knowledge_base_id,
      file_id: v.file_id,
      keyword: v.keyword?.trim() || undefined,
    });
  };

  const handleReset = () => {
    filterForm.setFieldsValue({
      status: "pending",
      biz_code: undefined,
      knowledge_base_id: undefined,
      file_id: undefined,
      keyword: undefined,
    });
    setApplied({
      page: 1,
      page_size: 20,
      status: "pending",
    });
  };

  const openApprove = (c: EntityCandidate) => {
    setActiveCandidate(c);
    approveForm.resetFields();
    approveForm.setFieldsValue({
      canonical_name: c.candidate_text,
      entity_type: c.entity_type,
      aliases: [{ text: c.candidate_text }],
      review_comment: undefined,
    });
    setApproveOpen(true);
  };

  const openReject = (c: EntityCandidate) => {
    setActiveCandidate(c);
    rejectForm.resetFields();
    setRejectOpen(true);
  };

  const fetchMergeTargets = useCallback(
    (c: EntityCandidate | null, keyword: string) => {
      if (!c) return;
      setMergeSearchLoading(true);
      void getTargetEntitiesForMerge({
        biz_code: c.biz_code ?? undefined,
        knowledge_base_id: c.knowledge_base_id ?? undefined,
        entity_type: c.entity_type,
        keyword: keyword.trim() || undefined,
        limit: 50,
      })
        .then((list) => setMergeOptions(list))
        .catch((e) => {
          showError(e instanceof Error ? e.message : "加载目标实体失败");
          setMergeOptions([]);
        })
        .finally(() => setMergeSearchLoading(false));
    },
    [showError]
  );

  const openMerge = (c: EntityCandidate) => {
    setActiveCandidate(c);
    mergeForm.resetFields();
    setMergeOptions([]);
    setMergeOpen(true);
    fetchMergeTargets(c, "");
  };

  const onMergeSearch = (kw: string) => {
    if (mergeSearchTimer.current) {
      clearTimeout(mergeSearchTimer.current);
    }
    mergeSearchTimer.current = setTimeout(() => {
      fetchMergeTargets(activeCandidate, kw);
    }, 320);
  };

  const submitApproveOk = async () => {
    if (!activeCandidate) return;
    try {
      const v = await approveForm.validateFields();
      const aliasStrings = normalizeAliasList(v.aliases.map((a) => a.text));
      if (aliasStrings.length === 0) {
        showError("请至少填写一个有效别名");
        return;
      }
      setSubmitApprove(true);
      await approveEntityCandidate(activeCandidate.id, {
        canonical_name: v.canonical_name.trim(),
        entity_type: v.entity_type.trim(),
        aliases: aliasStrings,
        review_comment: v.review_comment?.trim() || undefined,
      });
      showSuccess("已通过并生成/归并实体");
      setApproveOpen(false);
      await loadList();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      showError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitApprove(false);
    }
  };

  const submitRejectOk = async () => {
    if (!activeCandidate) return;
    try {
      const v = await rejectForm.validateFields();
      setSubmitReject(true);
      await rejectEntityCandidate(activeCandidate.id, {
        review_comment: v.review_comment.trim(),
      });
      showSuccess("已驳回");
      setRejectOpen(false);
      await loadList();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      showError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitReject(false);
    }
  };

  const submitMergeOk = async () => {
    if (!activeCandidate) return;
    try {
      const v = await mergeForm.validateFields();
      setSubmitMerge(true);
      await mergeEntityCandidate(activeCandidate.id, {
        target_entity_id: v.target_entity_id,
        review_comment: v.review_comment?.trim() || undefined,
      });
      showSuccess("已合并到目标实体");
      setMergeOpen(false);
      await loadList();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      showError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitMerge(false);
    }
  };

  return {
    filterForm,
    applied,
    setApplied,
    loading,
    rows,
    total,
    kbList,
    kbLoading,
    approveOpen,
    setApproveOpen,
    rejectOpen,
    setRejectOpen,
    mergeOpen,
    setMergeOpen,
    activeCandidate,
    approveForm,
    rejectForm,
    mergeForm,
    submitApprove,
    submitReject,
    submitMerge,
    mergeOptions,
    mergeSearchLoading,
    handleSearch,
    handleReset,
    loadList,
    openApprove,
    openReject,
    openMerge,
    onMergeSearch,
    submitApproveOk,
    submitRejectOk,
    submitMergeOk,
  };
}
