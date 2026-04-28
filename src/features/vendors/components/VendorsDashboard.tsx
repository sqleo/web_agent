"use client";

import { Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useVendors } from "../hooks/useVendors";
import { DefaultModelsCard } from "./DefaultModelsCard";
import { InstalledVendorsCard } from "./InstalledVendorsCard";
import { AvailableVendorsCard } from "./AvailableVendorsCard";
import { VendorAddModal } from "./VendorAddModal";

export function VendorsDashboard() {
  const {
    market,
    installed,
    globalSettings,
    availableModels,
    search,
    setSearch,
    filterCap,
    setFilterCap,
    defaults,
    modalOpen,
    setModalOpen,
    modalVendor,
    modalInstalled,
    installedByCode,
    allCapabilities,
    filteredMarket,
    loadingMarket,
    loadingInstalled,
    settingsBusy,
    updateDefault,
    openAddModal,
    handleModalSuccess,
  } = useVendors();

  return (
    <DashboardPageCard>
      <Typography.Title level={4} className="!mb-2 !mt-0">
        模型管理
      </Typography.Title>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-h-0 min-w-0 flex-1 space-y-4">
          <DefaultModelsCard
            globalSettings={globalSettings}
            availableModels={availableModels}
            defaults={defaults}
            settingsBusy={settingsBusy}
            updateDefault={updateDefault}
          />

          <InstalledVendorsCard
            installed={installed}
            market={market}
            loadingInstalled={loadingInstalled}
            openAddModal={openAddModal}
          />
        </div>

        <div className="w-full shrink-0 lg:w-[400px]">
          <AvailableVendorsCard
            filteredMarket={filteredMarket}
            loadingMarket={loadingMarket}
            search={search}
            setSearch={setSearch}
            filterCap={filterCap}
            setFilterCap={setFilterCap}
            allCapabilities={allCapabilities}
            installedByCode={installedByCode}
            openAddModal={openAddModal}
          />
        </div>
      </div>

      <VendorAddModal
        open={modalOpen}
        vendor={modalVendor}
        isInstalled={modalInstalled}
        installedVendorId={modalVendor ? installedByCode.get(modalVendor.code)?.id : undefined}
        onClose={() => {
          setModalOpen(false);
        }}
        onSuccess={() => void handleModalSuccess()}
      />
    </DashboardPageCard>
  );
}
