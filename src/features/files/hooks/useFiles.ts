"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { App, Form } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { DataNode } from "antd/es/tree";
import {
  getFiles,
  getFolderTree,
  createFolder,
  uploadFile,
  reuploadFile,
  parseFileMd,
  deleteFile,
} from "../api/files";
import type { FileItem, FileFolderTreeNode, FileLifecycleStatus } from "../types";
import { resolveApiPublicUrl } from "@/lib/api-public-url";

export type QueryState = {
  page: number;
  page_size: number;
  status?: FileLifecycleStatus;
  project_code?: string;
};

function flattenFolders(tree: FileFolderTreeNode[]): FileFolderTreeNode[] {
  const out: FileFolderTreeNode[] = [];
  const walk = (nodes: FileFolderTreeNode[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(tree);
  return out;
}

function treeToData(nodes: FileFolderTreeNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: String(node.id),
    title: node.name,
    children: node.children?.length ? treeToData(node.children) : undefined,
  }));
}

export function useFiles() {
  const { message: messageApi } = App.useApp();
  
  const [query, setQuery] = useState<QueryState>({ page: 1, page_size: 20 });
  const [listLoading, setListLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [items, setItems] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [folderTree, setFolderTree] = useState<FileFolderTreeNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [parsingId, setParsingId] = useState<number | null>(null);
  const [reuploadingId, setReuploadingId] = useState<number | null>(null);

  const [createFolderForm] = Form.useForm<{
    name: string;
    parent_folder_id?: number;
    project_code?: string;
    description?: string;
  }>();
  const [uploadForm] = Form.useForm<{
    folder_id?: number;
    project_code?: string;
    source?: string;
  }>();

  const folderFlatList = useMemo(() => flattenFolders(folderTree), [folderTree]);
  const folderSelectOptions = useMemo(
    () => folderFlatList.map((f) => ({ label: `${f.name} (#${f.id})`, value: f.id })),
    [folderFlatList]
  );
  const treeData = useMemo(() => treeToData(folderTree), [folderTree]);

  const loadFolders = useCallback(async (projectCode?: string) => {
    setFoldersLoading(true);
    try {
      const tree = await getFolderTree({ project_code: projectCode });
      setFolderTree(tree);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "查询文件夹树失败");
      setFolderTree([]);
    } finally {
      setFoldersLoading(false);
    }
  }, [messageApi]);

  const loadFiles = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await getFiles(query);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "查询文件列表失败");
      setItems([]);
      setTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [messageApi, query]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    void loadFolders(query.project_code);
  }, [loadFolders, query.project_code]);

  const handleDeleteFile = useCallback(
    async (fileId: number) => {
      setDeletingId(fileId);
      try {
        await deleteFile(fileId);
        messageApi.success("已删除");
        await loadFiles();
      } catch (e) {
        messageApi.error(e instanceof Error ? e.message : "删除失败");
      } finally {
        setDeletingId(null);
      }
    },
    [loadFiles, messageApi]
  );

  const handleParseFile = useCallback(
    async (fileId: number) => {
      const row = items.find((f) => f.id === fileId);
      if (row?.parse_status === "parsed") return;
      setParsingId(fileId);
      try {
        const res = await parseFileMd(fileId);
        const href = resolveApiPublicUrl(res.parsed_md_url);
        messageApi.success(`解析成功: ${href}`);
        await loadFiles();
      } catch (e) {
        messageApi.error(e instanceof Error ? e.message : "解析失败");
      } finally {
        setParsingId(null);
      }
    },
    [items, loadFiles, messageApi]
  );

  const handleReuploadFile = useCallback(
    async (record: FileItem, file: File) => {
      setReuploadingId(record.id);
      try {
        await reuploadFile(record.id, {
          file,
          folder_id: record.folder_id ?? undefined,
          project_code: record.project_code ?? undefined,
          source: record.source || "manual_upload",
        });
        messageApi.success("文件已更新");
        await Promise.all([loadFiles(), loadFolders(query.project_code)]);
      } catch (e) {
        messageApi.error(e instanceof Error ? e.message : "更新失败");
      } finally {
        setReuploadingId(null);
      }
    },
    [loadFiles, loadFolders, messageApi, query.project_code]
  );

  const handleCreateFolder = async () => {
    try {
      const values = await createFolderForm.validateFields();
      setCreatingFolder(true);
      await createFolder({
        name: values.name,
        parent_folder_id: values.parent_folder_id,
        project_code: values.project_code,
        description: values.description,
      });
      messageApi.success("文件夹创建成功");
      setFolderModalOpen(false);
      createFolderForm.resetFields();
      await loadFolders(query.project_code);
    } catch (e) {
      if (e instanceof Error) {
        messageApi.error(e.message);
      }
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields();
      if (!uploadList[0]?.originFileObj) {
        messageApi.error("请选择文件");
        return;
      }
      setUploading(true);
      const { didAutoReupload } = await uploadFile({
        file: uploadList[0].originFileObj as File,
        folder_id: values.folder_id,
        project_code: values.project_code,
        source: values.source || "manual_upload",
      });
      messageApi.success(
        didAutoReupload ? "同名文件内容已变更，已自动覆盖更新" : "文件上传成功"
      );
      setUploadModalOpen(false);
      setUploadList([]);
      uploadForm.resetFields();
      await Promise.all([loadFiles(), loadFolders(query.project_code)]);
    } catch (e) {
      if (e instanceof Error) {
        messageApi.error(e.message);
      }
    } finally {
      setUploading(false);
    }
  };

  return {
    query,
    setQuery,
    listLoading,
    foldersLoading,
    items,
    total,
    selectedFolderId,
    setSelectedFolderId,
    folderModalOpen,
    setFolderModalOpen,
    creatingFolder,
    uploadModalOpen,
    setUploadModalOpen,
    uploading,
    uploadList,
    setUploadList,
    deletingId,
    parsingId,
    reuploadingId,
    createFolderForm,
    uploadForm,
    folderSelectOptions,
    treeData,
    loadFiles,
    loadFolders,
    handleDeleteFile,
    handleParseFile,
    handleReuploadFile,
    handleCreateFolder,
    handleUpload,
  };
}
