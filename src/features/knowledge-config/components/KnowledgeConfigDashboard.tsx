"use client";

import { BookOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useKnowledgeConfig } from "../hooks/useKnowledgeConfig";
import { ConfigScopeSelector } from "./ConfigScopeSelector";
import { ConfigFieldTable } from "./ConfigFieldTable";
import { FieldEditModal } from "./FieldEditModal";
import { AliasEditModal } from "./AliasEditModal";
import { ApiDocDrawer } from "./ApiDocDrawer";

export function KnowledgeConfigDashboard() {
  const {
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
  } = useKnowledgeConfig();

  return (
    <DashboardPageCard>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography.Title level={4} className="!mb-1 !mt-0 flex items-center gap-2">
            <BookOutlined />
            知识库配置
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-0">
            管理 metadata 抽取字段与别名；作用域与后端约定一致（全局 / 业务 / 知识库）。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<FileTextOutlined />} onClick={openApiDrawer}>
            查看 API 文档
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void loadList()}
            disabled={!canQuery}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateField}>
            新建字段
          </Button>
        </Space>
      </div>

      <ConfigScopeSelector
        scopeMode={scopeMode}
        setScopeMode={setScopeMode}
        bizCode={bizCode}
        setBizCode={setBizCode}
        kbId={kbId}
        setKbId={setKbId}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        kbOptions={kbOptions}
        kbLoading={kbLoading}
        canQuery={canQuery}
        total={total}
      />

      <ConfigFieldTable
        rows={rows}
        canQuery={canQuery}
        listLoading={listLoading}
        openEditField={openEditField}
        handleDeleteField={handleDeleteField}
        openCreateAlias={openCreateAlias}
        openEditAlias={openEditAlias}
        handleDeleteAlias={handleDeleteAlias}
      />

      <FieldEditModal
        open={fieldModalOpen}
        setOpen={setFieldModalOpen}
        fieldEditing={fieldEditing}
        form={fieldForm}
        submitting={fieldSubmitting}
        onSubmit={submitField}
      />

      <AliasEditModal
        open={aliasModalOpen}
        setOpen={setAliasModalOpen}
        aliasEditing={aliasEditing}
        form={aliasForm}
        submitting={aliasSubmitting}
        onSubmit={submitAlias}
      />

      <ApiDocDrawer
        open={apiDrawerOpen}
        onClose={() => setApiDrawerOpen(false)}
        apiMd={apiMd}
        loading={apiMdLoading}
      />
    </DashboardPageCard>
  );
}
