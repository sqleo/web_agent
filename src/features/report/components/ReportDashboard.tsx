"use client";

import { useReport } from "../hooks/useReport";
import { LeftSidebar } from "./LeftSidebar";
import { AgentHub } from "./AgentHub";
import { RightConfigPanel } from "./RightConfigPanel";
import { NewReportForm } from "./NewReportForm";

export function ReportDashboard() {
  const {
    loading,
    reports,
    selectedReport,
    setSelectedReport,
    createModalOpen: isCreating,
    setCreateModalOpen: setIsCreating,
    submitting,
    handleCreate,
    handleResume,
  } = useReport();

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0b0f19]">
      {/* Left Sidebar */}
      <div className="w-64 shrink-0 h-full">
        <LeftSidebar
          items={reports}
          selectedId={selectedReport?.id}
          onSelect={(item) => {
            setSelectedReport(item);
            setIsCreating(false);
          }}
          onAddNew={() => setIsCreating(true)}
          isCreating={isCreating}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden">
        {isCreating ? (
          <div className="h-full overflow-y-auto bg-[#0b0f19]">
            <NewReportForm
              onSubmit={async (values) => {
                await handleCreate(values);
                setIsCreating(false);
              }}
              confirmLoading={submitting}
            />
          </div>
        ) : selectedReport ? (
          <div className="flex h-full w-full">
            {/* Middle Column (Narrower) */}
            <div
              className="w-[380px] shrink-0 h-full"
              style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
            >
              <AgentHub item={selectedReport} />
            </div>

            {/* Right Column (Expanded) */}
            <div className="flex-1 h-full">
              <RightConfigPanel
                item={selectedReport}
                onConfirm={() => {
                  void handleResume(selectedReport.id);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm">
            请在左侧选择或新建一份研究报告
          </div>
        )}
      </div>
    </div>
  );
}
