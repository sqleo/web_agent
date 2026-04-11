"use client";

import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { Button, Card, Modal, Space, Table, Tooltip, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type Key } from "react";
import {
  addKnowledgeBaseFiles,
  getFiles,
  getKnowledgeBaseFiles,
  indexKnowledgeBaseFiles,
  removeKnowledgeBaseFiles,
  type FileUploadItem,
  type KnowledgeBaseFileListItem,
} from "@/api";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import {
  knowledgeBaseFileColumns,
  knowledgeFilePoolColumns,
} from "@/app/(dashboard)/knowledge/knowledge-file-columns";

/** 是否允许再次触发入库：已入库且当前无新版本则不允许 */
function canIndexKnowledgeFile(record: KnowledgeBaseFileListItem): boolean {
  if (record.pipeline_status !== "indexed") return true;
  return record.has_newer_content === true;
}

const POOL_ROW_DISABLED_TITLE =
  "请先在「文件管理」中完成解析（parse-md）后再加入知识库";

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.kbId;
  const kbId = typeof rawId === "string" ? Number(rawId) : Number(Array.isArray(rawId) ? rawId[0] : "");
  const titleFromQuery = searchParams.get("name");

  const [messageApi, messageContextHolder] = message.useMessage();

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
  /** 单行「入库」请求中的文件 id */
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
      messageApi.error(e instanceof Error ? e.message : "加载知识库文件失败");
      setKbFileItems([]);
      setKbFilesTotal(0);
    } finally {
      setKbFilesLoading(false);
    }
  }, [kbFilesQuery, kbId, messageApi, validKbId]);

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
      messageApi.error(e instanceof Error ? e.message : "加载文件列表失败");
      setPoolItems([]);
      setPoolTotal(0);
    } finally {
      setPoolLoading(false);
    }
  }, [messageApi, poolQuery]);

  useEffect(() => {
    if (!addOpen) return;
    void loadPoolFiles();
  }, [addOpen, loadPoolFiles]);

  /** 去掉未解析项的勾选，避免禁用行仍留在选中列表里 */
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
      messageApi.warning("请选择要加入的文件");
      return;
    }
    setAdding(true);
    try {
      const res = await addKnowledgeBaseFiles(kbId, { file_ids: poolSelectedIds });
      messageApi.success(
        `已加入 ${res.affected_file_ids.length} 个，跳过 ${res.skipped_file_ids.length} 个`
      );
      setAddOpen(false);
      setPoolSelectedIds([]);
      await loadKbFiles();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "加入失败");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFiles = async () => {
    if (!validKbId) return;
    if (selectedKbFileIds.length === 0) {
      messageApi.warning("请选择要移出的文件");
      return;
    }
    setRemoving(true);
    try {
      const res = await removeKnowledgeBaseFiles(kbId, { file_ids: selectedKbFileIds });
      messageApi.success(
        `已移出 ${res.affected_file_ids.length} 个，跳过 ${res.skipped_file_ids.length} 个`
      );
      setSelectedKbFileIds([]);
      await loadKbFiles();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "移出失败");
    } finally {
      setRemoving(false);
    }
  };

  const handleIndexFiles = async () => {
    if (!validKbId) return;
    if (selectedKbFileIds.length === 0) {
      messageApi.warning("请选择要入库的文件");
      return;
    }
    const eligibleIds = selectedKbFileIds.filter((id) => {
      const row = kbFileItems.find((f) => f.id === id);
      return row && canIndexKnowledgeFile(row);
    });
    if (eligibleIds.length === 0) {
      messageApi.warning("所选文件均已入库完成，无需再次入库");
      return;
    }
    const skipped = selectedKbFileIds.length - eligibleIds.length;
    setIndexing(true);
    try {
      await indexKnowledgeBaseFiles(kbId, { file_ids: eligibleIds });
      messageApi.success(
        skipped > 0
          ? `已提交 ${eligibleIds.length} 个文件入库（已跳过 ${skipped} 个已入库项），请稍后刷新查看状态`
          : "已提交入库，请稍后刷新查看状态"
      );
      await loadKbFiles();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : "入库失败");
    } finally {
      setIndexing(false);
    }
  };

  const handleIndexOneFile = useCallback(
    async (fileId: number) => {
      if (!validKbId) return;
      const row = kbFileItems.find((f) => f.id === fileId);
      if (!row || !canIndexKnowledgeFile(row)) return;
      setIndexingFileId(fileId);
      try {
        await indexKnowledgeBaseFiles(kbId, { file_ids: [fileId] });
        messageApi.success("已提交入库，请稍后刷新查看状态");
        await loadKbFiles();
      } catch (e) {
        messageApi.error(e instanceof Error ? e.message : "入库失败");
      } finally {
        setIndexingFileId(null);
      }
    },
    [kbFileItems, kbId, loadKbFiles, messageApi, validKbId]
  );

  const kbTableColumns: ColumnsType<KnowledgeBaseFileListItem> = useMemo(
    () => [
      ...knowledgeBaseFileColumns,
      {
        title: "操作",
        key: "actions",
        width: 88,
        fixed: "right",
        render: (_: unknown, record: KnowledgeBaseFileListItem) => {
          const canIndex = canIndexKnowledgeFile(record);
          const busy = indexingFileId === record.id;
          const btn = (
            <Button
              type="link"
              size="small"
              className="!px-0"
              loading={busy}
              disabled={indexing || !canIndex}
              onClick={() => void handleIndexOneFile(record.id)}
            >
              入库
            </Button>
          );
          if (canIndex) return btn;
          return (
            <Tooltip title="当前内容已入库完成，无需重复操作">
              <span className="inline-flex">{btn}</span>
            </Tooltip>
          );
        },
      },
    ],
    [handleIndexOneFile, indexing, indexingFileId]
  );

  const kbFileRowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedKbFileIds,
      onChange: (keys: Key[]) => setSelectedKbFileIds(keys.map(Number)),
    }),
    [selectedKbFileIds]
  );

  const poolRowSelection = useMemo(
    () => ({
      selectedRowKeys: poolSelectedIds,
      onChange: (keys: Key[]) => setPoolSelectedIds(keys.map(Number)),
      getCheckboxProps: (record: FileUploadItem) => {
        const parsed = record.parse_status === "parsed";
        return {
          disabled: !parsed,
          title: !parsed ? POOL_ROW_DISABLED_TITLE : undefined,
        };
      },
    }),
    [poolSelectedIds]
  );

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
      {messageContextHolder}
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
        <Table<KnowledgeBaseFileListItem>
          rowKey="id"
          size="small"
          loading={kbFilesLoading}
          columns={kbTableColumns}
          dataSource={kbFileItems}
          rowSelection={kbFileRowSelection}
          scroll={{ x: 1200 }}
          pagination={{
            current: kbFilesQuery.page,
            pageSize: kbFilesQuery.page_size,
            total: kbFilesTotal,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          onChange={(pagination) => {
            setKbFilesQuery({
              page: pagination.current || 1,
              page_size: pagination.pageSize || 20,
            });
          }}
        />
      </Card>

      <Modal
        title="从文件库加入知识库"
        open={addOpen}
        width={900}
        onCancel={() => {
          setAddOpen(false);
          setPoolSelectedIds([]);
        }}
        okText="加入选中"
        okButtonProps={{ loading: adding, disabled: poolSelectedIds.length === 0 }}
        onOk={() => void handleAddFiles()}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
          数据来源 <Typography.Text code>GET /files</Typography.Text>
        </Typography.Paragraph>
        <Table<FileUploadItem>
          rowKey="id"
          size="small"
          loading={poolLoading}
          columns={knowledgeFilePoolColumns}
          dataSource={poolItems}
          rowSelection={poolRowSelection}
          onRow={(record) => ({
            title:
              record.parse_status !== "parsed" ? POOL_ROW_DISABLED_TITLE : undefined,
          })}
          scroll={{ x: 1000 }}
          pagination={{
            current: poolQuery.page,
            pageSize: poolQuery.page_size,
            total: poolTotal,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
          }}
          onChange={(pagination) => {
            setPoolQuery({
              page: pagination.current || 1,
              page_size: pagination.pageSize || 10,
            });
          }}
        />
      </Modal>
    </DashboardPageCard>
  );
}
