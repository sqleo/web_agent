"use client";

import { DatabaseOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, Modal, Pagination, Space, Spin, Typography, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createKnowledgeBase, getKnowledgeBases, type KnowledgeBase } from "@/api";
import { DashboardPageCard } from "@/components/dashboard-page-card";

function kbHref(kb: KnowledgeBase): string {
  const q = new URLSearchParams();
  if (kb.name) q.set("name", kb.name);
  const qs = q.toString();
  return qs ? `/knowledge/${kb.id}?${qs}` : `/knowledge/${kb.id}`;
}

export default function KnowledgePage() {
  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();

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
      setKbListLoading(true);
      try {
        const data = await getKnowledgeBases(listQuery);
        setKbRows(data.items);
        setKbListTotal(data.total);
      } catch (e) {
        messageApi.error(e instanceof Error ? e.message : "刷新列表失败");
      } finally {
        setKbListLoading(false);
      }
      if (kb?.id != null) {
        router.push(kbHref(kb));
      }
    } catch (e) {
      if (e instanceof Error) messageApi.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardPageCard>
      {messageContextHolder}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Title level={4} className="!mb-1 !mt-0">
            知识库
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0">
            点击卡片进入该知识库，管理库内文件。
          </Typography.Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadKnowledgeBaseList()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            新建知识库
          </Button>
        </Space>
      </div>

      <Spin spinning={kbListLoading}>
        {kbRows.length === 0 && !kbListLoading ? (
          <Empty description="暂无知识库，请先新建" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kbRows.map((kb) => (
              <Link key={kb.id} href={kbHref(kb)} className="block min-w-0">
                <Card
                  hoverable
                  className="h-full"
                  cover={
                    kb.thumbnail_url ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--ant-color-fill-secondary)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt=""
                          src={kb.thumbnail_url}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-[var(--ant-color-fill-secondary)] text-[var(--ant-color-text-tertiary)]">
                        <DatabaseOutlined className="text-4xl" />
                      </div>
                    )
                  }
                >
                  <Typography.Title level={5} className="!mb-1 !mt-0 line-clamp-2">
                    {kb.name}
                  </Typography.Title>
                  {kb.code ? (
                    <Typography.Text type="secondary" className="mb-2 block text-xs">
                      {kb.code}
                    </Typography.Text>
                  ) : null}
                  <Typography.Paragraph type="secondary" className="!mb-0 line-clamp-3 text-sm">
                    {kb.description?.trim() ? kb.description : "暂无描述"}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" className="mt-2 block text-xs">
                    ID {kb.id}
                  </Typography.Text>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Spin>

      {kbListTotal > 0 ? (
        <div className="mt-6 flex justify-end">
          <Pagination
            current={kbListQuery.page}
            pageSize={kbListQuery.page_size}
            total={kbListTotal}
            showSizeChanger
            pageSizeOptions={[12, 24, 48]}
            onChange={(page, pageSize) => {
              setKbListQuery({ page, page_size: pageSize });
            }}
          />
        </div>
      ) : null}

      <Modal
        title="新建知识库"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        okText="创建"
        confirmLoading={creating}
        onOk={() => void handleCreate()}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
          <Typography.Text code>POST /knowledge-bases</Typography.Text>
        </Typography.Paragraph>
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
            <Input placeholder="知识库名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
          <Form.Item name="thumbnail_url" label="缩略图 URL">
            <Input placeholder="可选，将显示在卡片封面" />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardPageCard>
  );
}
