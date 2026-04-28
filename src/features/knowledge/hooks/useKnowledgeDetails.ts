"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { App } from "antd";
import {
  getKnowledgeBaseFiles,
  addKnowledgeBaseFiles,
  removeKnowledgeBaseFiles,
  indexKnowledgeBaseFiles,
} from "../api/knowledge";
import { getFiles } from "@/features/files/api/files";
import type { KnowledgeBaseFileListItem, FileUploadItem } from "../types";

export function useKnowledgeDetails(kbId: number) {
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

  const [kbFilesLoading, setKbFilesLoading] = useState(false);
  const [kbFileItems, setKbFileItems] = useState<KnowledgeBaseFileListItem[]>([]);
  const [kbFilesTotal, setKbFilesTotal] = useState(0);
  const [kbFilesQuery, setKbFilesQuery] = useState({ page: 1, page_size: 20 });
  const [selectedKbFileIds, setSelectedKbFileIds] = useState<number[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolItems, setPoolItems] = useState<FileUploadItem[]>([]);
  const [poolTotal, setPoolTotal] = useState(0);
  const [poolQuery, setPoolQuery] = useState({ page: 1, page_size: 10 });
  const [poolSelectedIds, setPoolSelectedIds] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexingFileId, setIndexingFileId] = useState<number | null>(null);

  const validKbId = Number.isFinite(kbId) && kbId > 0;

  const loadKbFiles = useCallback(async () => {
    if (!validKbId) return;
    setKbFilesLoading(true);
    try {
      const data = await getKnowledgeBaseFiles(kbId, kbFilesQuery);
      setKbFileItems(data.items);
      setKbFilesTotal(data.total);
    } catch (e) {
      showError(e instanceof Error ? e.message : "加载知识库文件失败");
      setKbFileItems([]);
      setKbFilesTotal(0);
    } finally {
      setKbFilesLoading(false);
    }
  }, [kbFilesQuery, kbId, showError, validKbId]);

  useEffect(() => {
    void loadKbFiles();
  }, [loadKbFiles]);

  const loadPoolFiles = useCallback(async () => {
    setPoolLoading(true);
    try {
      const data = await getFiles(poolQuery);
      setPoolItems(data.items);
      setPoolTotal(data.total);
    } catch (e) {
      showError(e instanceof Error ? e.message : "加载文件列表失败");
      setPoolItems([]);
      setPoolTotal(0);
    } finally {
      setPoolLoading(false);
    }
  }, [poolQuery, showError]);

  useEffect(() => {
    if (!addOpen) return;
    void loadPoolFiles();
  }, [addOpen, loadPoolFiles]);

  useEffect(() => {
    if (!addOpen || poolItems.length === 0) return;
    setPoolSelectedIds((prev) =>
      prev.filter((id) => {
        const row = poolItems.find((f) => f.id === id);
        return row?.parse_status === "parsed";
      })
    );
  }, [addOpen, poolItems]);

  const handleAddFiles = async () => {
    if (!validKbId) return;
    if (poolSelectedIds.length === 0) {
      showWarning("请选择要加入的文件");
      return;
    }
    setAdding(true);
    try {
      const res = await addKnowledgeBaseFiles(kbId, { file_ids: poolSelectedIds });
      showSuccess(
        `已加入 ${res.affected_file_ids.length} 个，跳过 ${res.skipped_file_ids.length} 个`
      );
      setAddOpen(false);
      setPoolSelectedIds([]);
      await loadKbFiles();
    } catch (e) {
      showError(e instanceof Error ? e.message : "加入失败");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFiles = async () => {
    if (!validKbId) return;
    if (selectedKbFileIds.length === 0) {
      showWarning("请选择要移出的文件");
      return;
    }
    setRemoving(true);
    try {
      const res = await removeKnowledgeBaseFiles(kbId, { file_ids: selectedKbFileIds });
      showSuccess(
        `已移出 ${res.affected_file_ids.length} 个，跳过 ${res.skipped_file_ids.length} 个`
      );
      setSelectedKbFileIds([]);
      await loadKbFiles();
    } catch (e) {
      showError(e instanceof Error ? e.message : "移出失败");
    } finally {
      setRemoving(false);
    }
  };

  const canIndexKnowledgeFile = (record: KnowledgeBaseFileListItem): boolean => {
    if (record.pipeline_status !== "indexed") return true;
    return record.has_newer_content === true;
  };

  const handleIndexFiles = async () => {
    if (!validKbId) return;
    if (selectedKbFileIds.length === 0) {
      showWarning("请选择要入库的文件");
      return;
    }
    const eligibleIds = selectedKbFileIds.filter((id) => {
      const row = kbFileItems.find((f) => f.id === id);
      return row && canIndexKnowledgeFile(row);
    });
    if (eligibleIds.length === 0) {
      showWarning("所选文件均已入库完成，无需再次入库");
      return;
    }
    const skipped = selectedKbFileIds.length - eligibleIds.length;
    setIndexing(true);
    try {
      await indexKnowledgeBaseFiles(kbId, { file_ids: eligibleIds });
      showSuccess(
        skipped > 0
          ? `已提交 ${eligibleIds.length} 个文件入库（已跳过 ${skipped} 个已入库项），请稍后刷新查看状态`
          : "已提交入库，请稍后刷新查看状态"
      );
      await loadKbFiles();
    } catch (e) {
      showError(e instanceof Error ? e.message : "入库失败");
    } finally {
      setIndexing(false);
    }
  };

  const handleIndexOneFile = useCallback(
    async (fileId: number) => {
      if (!validKbId) return;
      const row = kbFileItems.find((f) => f.id === fileId);
      if (!row) return;
      setIndexingFileId(fileId);
      try {
        await indexKnowledgeBaseFiles(kbId, { file_ids: [fileId] });
        showSuccess("已提交入库，请稍后刷新查看状态");
        await loadKbFiles();
      } catch (e) {
        showError(e instanceof Error ? e.message : "入库失败");
      } finally {
        setIndexingFileId(null);
      }
    },
    [kbFileItems, kbId, loadKbFiles, showError, validKbId]
  );

  return {
    kbFilesLoading,
    kbFileItems,
    kbFilesTotal,
    kbFilesQuery,
    setKbFilesQuery,
    selectedKbFileIds,
    setSelectedKbFileIds,
    addOpen,
    setAddOpen,
    poolLoading,
    poolItems,
    poolTotal,
    poolQuery,
    setPoolQuery,
    poolSelectedIds,
    setPoolSelectedIds,
    adding,
    removing,
    indexing,
    indexingFileId,
    loadKbFiles,
    handleAddFiles,
    handleRemoveFiles,
    handleIndexFiles,
    handleIndexOneFile,
    canIndexKnowledgeFile,
  };
}
