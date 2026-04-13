"use client";

import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Tree,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DataNode } from "antd/es/tree";
import type { UploadFile } from "antd/es/upload/interface";
import { FolderAddOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFolder,
  deleteFile,
  getFolderTree,
  getFiles,
  parseFileMd,
  reuploadFile,
  uploadFile,
  type FileFolderTreeNode,
  type FileItem,
  type FileLifecycleStatus,
} from "@/api";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { resolveApiPublicUrl } from "@/lib/api-public-url";
import {
  fileCreatorLabel,
  fileLifecycleLabel,
  fileParseStatusLabel,
  fileParseStatusTagColor,
} from "@/lib/file-item-display";

type QueryState = {
  page: number;
  page_size: number;
  status?: FileLifecycleStatus;
  project_code?: string;
};

const FILE_STATUS_OPTIONS: { label: string; value: FileLifecycleStatus }[] = [
  { label: "草稿", value: "draft" },
  { label: "已审阅", value: "reviewed" },
  { label: "已批准", value: "approved" },
  { label: "已归档", value: "archived" },
];

function formatSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return "-";
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes / 1024;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[idx]}`;
}

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

export default function FilesPage() {
  const [messageApi, messageContextHolder] = message.useMessage();
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
        messageApi.success(
          <span>
            解析成功
            <Typography.Link href={href} target="_blank" rel="noopener noreferrer" className="ml-2">
              查看 Markdown
            </Typography.Link>
          </span>
        );
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

  const columns: ColumnsType<FileItem> = useMemo(
    () => [
      {
        title: "文件名",
        dataIndex: "file_name",
        key: "file_name",
        ellipsis: true,
      },
      {
        title: "解析",
        dataIndex: "parse_status",
        key: "parse_status",
        width: 96,
        responsive: ["md"],
        render: (v: FileItem["parse_status"]) => (
          <Tag color={fileParseStatusTagColor(v)}>{fileParseStatusLabel(v)}</Tag>
        ),
      },
      {
        title: "内容版本",
        dataIndex: "content_semver",
        key: "content_semver",
        width: 96,
        responsive: ["sm"],
        render: (v: string) => v || "—",
      },
      {
        title: "后缀",
        dataIndex: "file_ext",
        key: "file_ext",
        width: 90,
        responsive: ["md"],
      },
      {
        title: "大小",
        dataIndex: "size_bytes",
        key: "size_bytes",
        width: 100,
        align: "right",
        responsive: ["sm"],
        render: (v: number) => formatSize(v),
      },
      {
        title: "项目",
        dataIndex: "project_code",
        key: "project_code",
        width: 140,
        responsive: ["lg"],
        render: (v: string | null) => v || "-",
      },
      {
        title: "业务状态",
        dataIndex: "status",
        key: "status",
        width: 88,
        responsive: ["md"],
        render: (v: FileItem["status"]) => fileLifecycleLabel(v),
      },
      {
        title: "创建人",
        key: "creator",
        width: 110,
        responsive: ["md"],
        ellipsis: true,
        render: (_: unknown, record: FileItem) => fileCreatorLabel(record),
      },
      {
        title: "创建时间",
        dataIndex: "created_at",
        key: "created_at",
        width: 160,
        responsive: ["xl"],
        render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
      },
      {
        title: "操作",
        key: "actions",
        width: 236,
        fixed: "right",
        render: (_: unknown, record: FileItem) => {
          const canParse = record.parse_status !== "parsed";
          const parseBtn = (
            <Button
              type="link"
              size="small"
              className="!px-0"
              loading={parsingId === record.id}
              disabled={deletingId === record.id || !canParse}
              onClick={() => void handleParseFile(record.id)}
            >
              解析
            </Button>
          );
          return (
          <Space size="small" wrap>
            {canParse ? (
              parseBtn
            ) : (
              <Tooltip title="已生成中间 Markdown，如需重新解析请先覆盖上传该文件">
                <span className="inline-flex">{parseBtn}</span>
              </Tooltip>
            )}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                void handleReuploadFile(record, file);
                return false;
              }}
            >
              <Button
                type="link"
                size="small"
                className="!px-0"
                loading={reuploadingId === record.id}
                disabled={deletingId === record.id || parsingId === record.id}
              >
                更新文件
              </Button>
            </Upload>
            <Popconfirm
              title="确认删除该文件？"
              description="软删除后列表中将不再显示。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => void handleDeleteFile(record.id)}
            >
              <Button
                type="link"
                danger
                size="small"
                className="!px-0"
                loading={deletingId === record.id}
                disabled={parsingId === record.id}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
          );
        },
      },
    ],
    [deletingId, handleDeleteFile, handleParseFile, handleReuploadFile, parsingId, reuploadingId]
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
        file: uploadList[0].originFileObj,
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

  return (
    <DashboardPageCard>
      {messageContextHolder}
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
        <Button icon={<ReloadOutlined />} onClick={() => void Promise.all([loadFiles(), loadFolders(query.project_code)])}>
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card size="small" title="文件夹树" loading={foldersLoading}>
          <Typography.Paragraph type="secondary" className="!mb-2 text-xs">
            点击节点可快速带入 folder_id 到上传弹窗
          </Typography.Paragraph>
          <Tree
            showLine
            treeData={treeData}
            selectedKeys={selectedFolderId ? [String(selectedFolderId)] : []}
            onSelect={(keys) => {
              const first = keys[0];
              setSelectedFolderId(first ? Number(first) : null);
            }}
          />
        </Card>

        <Card size="small" title="文件列表" className="min-w-0">
          <Table<FileItem>
            rowKey="id"
            loading={listLoading}
            columns={columns}
            dataSource={items}
            scroll={{ x: "max-content" }}
            pagination={{
              current: query.page,
              pageSize: query.page_size,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
            }}
            onChange={(pagination) => {
              setQuery((prev) => ({
                ...prev,
                page: pagination.current || 1,
                page_size: pagination.pageSize || 20,
              }));
            }}
          />
        </Card>
      </div>

      <Modal
        title="新建文件夹"
        open={folderModalOpen}
        onCancel={() => setFolderModalOpen(false)}
        onOk={() => void handleCreateFolder()}
        confirmLoading={creatingFolder}
        destroyOnHidden
      >
        <Form layout="vertical" form={createFolderForm}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: "请输入文件夹名称" }]}>
            <Input placeholder="例如：需求文档" />
          </Form.Item>
          <Form.Item label="父级文件夹" name="parent_folder_id">
            <Select allowClear options={folderSelectOptions} placeholder="不选则创建在根目录" />
          </Form.Item>
          <Form.Item label="项目标识" name="project_code">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="可选" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传文件"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        onOk={() => void handleUpload()}
        confirmLoading={uploading}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={uploadForm}
          initialValues={{
            folder_id: selectedFolderId ?? undefined,
            source: "manual_upload",
          }}
        >
          <Form.Item label="文件" required>
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              fileList={uploadList}
              onChange={({ fileList }) => setUploadList(fileList)}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="目录" name="folder_id">
            <Select allowClear options={folderSelectOptions} placeholder="不选则上传到根目录" />
          </Form.Item>
          <Form.Item label="项目标识" name="project_code">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item label="来源 source" name="source">
            <Input placeholder="默认 manual_upload" />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardPageCard>
  );
}
