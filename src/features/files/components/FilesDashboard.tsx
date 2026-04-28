"use client";

import { Button, Input, Select, Space, Typography } from "antd";
import { FolderAddOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useFiles } from "../hooks/useFiles";
import { FolderTreeCard } from "./FolderTreeCard";
import { FileListTable } from "./FileListTable";
import { CreateFolderModal } from "./CreateFolderModal";
import { UploadFileModal } from "./UploadFileModal";
import type { FileLifecycleStatus } from "../types";

const FILE_STATUS_OPTIONS: { label: string; value: FileLifecycleStatus }[] = [
  { label: "草稿", value: "draft" },
  { label: "已审阅", value: "reviewed" },
  { label: "已批准", value: "approved" },
  { label: "已归档", value: "archived" },
];

export function FilesDashboard() {
  const {
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
  } = useFiles();

  return (
    <DashboardPageCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Title level={4} className="!mb-1 !mt-0">
            文件管理
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0">
            支持文件夹树、上传文件与文件列表筛选查询。
          </Typography.Paragraph>
        </div>
        <Space>
          <Button icon={<FolderAddOutlined />} onClick={() => setFolderModalOpen(true)}>
            新建文件夹
          </Button>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}>
            上传文件
          </Button>
        </Space>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          allowClear
          placeholder="业务状态"
          className="!w-[180px]"
          value={query.status}
          options={FILE_STATUS_OPTIONS}
          onChange={(v) => setQuery((prev) => ({ ...prev, page: 1, status: v }))}
        />
        <Input
          allowClear
          placeholder="project_code"
          className="!w-[220px]"
          value={query.project_code}
          onChange={(e) =>
            setQuery((prev) => ({ ...prev, page: 1, project_code: e.target.value || undefined }))
          }
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void Promise.all([loadFiles(), loadFolders(query.project_code)])}
        >
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <FolderTreeCard
          loading={foldersLoading}
          treeData={treeData}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
        />

        <FileListTable
          items={items}
          loading={listLoading}
          total={total}
          page={query.page}
          pageSize={query.page_size}
          onPaginationChange={(page, pageSize) => {
            setQuery((prev) => ({ ...prev, page, page_size: pageSize }));
          }}
          deletingId={deletingId}
          parsingId={parsingId}
          reuploadingId={reuploadingId}
          handleDeleteFile={handleDeleteFile}
          handleParseFile={handleParseFile}
          handleReuploadFile={handleReuploadFile}
        />
      </div>

      <CreateFolderModal
        open={folderModalOpen}
        onCancel={() => setFolderModalOpen(false)}
        onOk={() => void handleCreateFolder()}
        confirmLoading={creatingFolder}
        form={createFolderForm}
        folderSelectOptions={folderSelectOptions}
      />

      <UploadFileModal
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        onOk={() => void handleUpload()}
        confirmLoading={uploading}
        form={uploadForm}
        uploadList={uploadList}
        setUploadList={setUploadList}
        folderSelectOptions={folderSelectOptions}
      />
    </DashboardPageCard>
  );
}
