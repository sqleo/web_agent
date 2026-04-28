"use client";

import { Button, Pagination, Space, Spin, Typography } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useKnowledgeBases } from "../hooks/useKnowledgeBases";
import { KnowledgeBaseList } from "./KnowledgeBaseList";
import { CreateKnowledgeBaseModal } from "./CreateKnowledgeBaseModal";

export function KnowledgePageDashboard() {
  const {
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
  } = useKnowledgeBases();

  return (
    <DashboardPageCard>
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
        <KnowledgeBaseList kbRows={kbRows} loading={kbListLoading} />
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

      <CreateKnowledgeBaseModal
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={() => void handleCreate()}
        confirmLoading={creating}
        form={createForm}
      />
    </DashboardPageCard>
  );
}
