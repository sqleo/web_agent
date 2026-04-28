"use client";

import { Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useEntityCandidates } from "../hooks/useEntityCandidates";
import { CandidatesFilterForm } from "./CandidatesFilterForm";
import { CandidatesTable } from "./CandidatesTable";
import { ApproveModal } from "./ApproveModal";
import { RejectModal } from "./RejectModal";
import { MergeModal } from "./MergeModal";
import type { GetEntityCandidatesQuery } from "../types";

export function EntityCandidatesDashboard() {
  const {
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
  } = useEntityCandidates();

  return (
    <DashboardPageCard>
      <div className="mb-4">
        <Typography.Title level={4} className="!mb-1 !mt-0">
          候选实体审核
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0">
          面向运营与审核：批量处理候选实体，支持通过、驳回、合并至已有正式实体；操作后状态可追溯。
        </Typography.Paragraph>
      </div>

      <CandidatesFilterForm
        form={filterForm}
        kbList={kbList}
        kbLoading={kbLoading}
        handleSearch={handleSearch}
        handleReset={handleReset}
        loadList={loadList}
      />

      <CandidatesTable
        rows={rows}
        loading={loading}
        total={total}
        page={applied.page ?? 1}
        pageSize={applied.page_size ?? 20}
        onPaginationChange={(page, pageSize) => {
          setApplied((q: GetEntityCandidatesQuery) => ({ ...q, page, page_size: pageSize ?? q.page_size }));
        }}
        openApprove={openApprove}
        openReject={openReject}
        openMerge={openMerge}
      />

      <ApproveModal
        open={approveOpen}
        setOpen={setApproveOpen}
        form={approveForm}
        submitting={submitApprove}
        onSubmit={submitApproveOk}
      />

      <RejectModal
        open={rejectOpen}
        setOpen={setRejectOpen}
        form={rejectForm}
        submitting={submitReject}
        onSubmit={submitRejectOk}
      />

      <MergeModal
        open={mergeOpen}
        setOpen={setMergeOpen}
        form={mergeForm}
        submitting={submitMerge}
        onSubmit={submitMergeOk}
        mergeOptions={mergeOptions}
        mergeSearchLoading={mergeSearchLoading}
        onMergeSearch={onMergeSearch}
      />
    </DashboardPageCard>
  );
}
