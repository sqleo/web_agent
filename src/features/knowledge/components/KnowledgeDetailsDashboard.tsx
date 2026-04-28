"use client";

import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useKnowledgeDetails } from "../hooks/useKnowledgeDetails";
import { KnowledgeFileTable } from "./KnowledgeFileTable";
import { AddFilesModal } from "./AddFilesModal";

export function KnowledgeDetailsDashboard() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.kbId;
  const kbId = typeof rawId === "string" ? Number(rawId) : Number(Array.isArray(rawId) ? rawId[0] : "");
  const titleFromQuery = searchParams.get("name");

  const {
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
  } = useKnowledgeDetails(kbId);

  const validKbId = Number.isFinite(kbId) && kbId > 0;

  if (!validKbId) {
    return (
      <DashboardPageCard>
        <Typography.Text type="danger">无效的知识库 ID</Typography.Text>
        <div className="mt-4">
          <Button type="link" onClick={() => router.push("/knowledge")}>
            返回知识库列表
          </Button>
        </div>
      </DashboardPageCard>
    );
  }

  const heading = titleFromQuery?.trim() ? titleFromQuery : `知识库 #${kbId}`;

  return (
    <DashboardPageCard>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Space className="!mb-2">
            <Link href="/knowledge">
              <Button type="text" icon={<ArrowLeftOutlined />}>
                返回
              </Button>
            </Link>
          </Space>
          <Typography.Title level={4} className="!mb-1 !mt-0">
            {heading}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0">
            库内文件 · ID {kbId} · 表格展示入库流水线状态；若提示「有新版本待入库」，请先完成文件解析再索引。可单行「入库」或勾选后「入库选中」。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void loadKbFiles()}>
            刷新
          </Button>
          <Button
            icon={<CloudUploadOutlined />}
            loading={indexing}
            disabled={indexingFileId !== null}
            onClick={() => void handleIndexFiles()}
          >
            入库选中
          </Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAddOpen(true)}>
            从文件库加入
          </Button>
          <Button
            danger
            icon={<UserDeleteOutlined />}
            loading={removing}
            disabled={indexingFileId !== null}
            onClick={() => void handleRemoveFiles()}
          >
            移出选中
          </Button>
        </Space>
      </div>

      <Card size="small" variant="borderless">
        <KnowledgeFileTable
          loading={kbFilesLoading}
          items={kbFileItems}
          total={kbFilesTotal}
          page={kbFilesQuery.page}
          pageSize={kbFilesQuery.page_size}
          selectedIds={selectedKbFileIds}
          onSelectedChange={setSelectedKbFileIds}
          onPageChange={(page, pageSize) => {
            setKbFilesQuery({ page, page_size: pageSize });
          }}
          canIndexFile={canIndexKnowledgeFile}
          indexingFileId={indexingFileId}
          indexing={indexing}
          onIndexOne={handleIndexOneFile}
        />
      </Card>

      <AddFilesModal
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          setPoolSelectedIds([]);
        }}
        loading={poolLoading}
        items={poolItems}
        total={poolTotal}
        page={poolQuery.page}
        pageSize={poolQuery.page_size}
        selectedIds={poolSelectedIds}
        onSelectedChange={setPoolSelectedIds}
        onPageChange={(page, pageSize) => {
          setPoolQuery({ page, page_size: pageSize });
        }}
        onOk={handleAddFiles}
        submitting={adding}
      />
    </DashboardPageCard>
  );
}
