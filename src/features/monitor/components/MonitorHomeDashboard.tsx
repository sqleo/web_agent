"use client";

import { Segmented, Spin, Typography } from "antd";
import { DashboardPageCard } from "@/components/dashboard-page-card";
import { useMonitorData } from "../hooks/useMonitorData";
import { StatCards } from "./StatCards";
import { TrendCharts } from "./TrendCharts";
import { DistributionCharts } from "./DistributionCharts";
import { RecentRequestsTable } from "./RecentRequestsTable";
import type { MonitorPeriod } from "../types";

const PERIOD_OPTIONS: { label: string; value: MonitorPeriod }[] = [
  { label: "实时", value: "realtime" },
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
];

export function MonitorHomeDashboard() {
  const {
    period,
    setPeriod,
    loading,
    overview,
    reqTrendAxis,
    tokenTrendAxis,
    latencyTrendAxis,
    successTrendAxis,
    reqTrendEmpty,
    tokenTrendEmpty,
    latencyTrendEmpty,
    successTrendEmpty,
    errors,
    modelColumnData,
    recent,
  } = useMonitorData();

  return (
    <DashboardPageCard>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Typography.Title level={4} className="!mb-0 !mt-0 !font-semibold">
          监控概览
        </Typography.Title>
        <Segmented<MonitorPeriod>
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(v) => setPeriod(v)}
        />
      </div>

      <Spin spinning={loading}>
        <StatCards overview={overview} loading={loading} />

        <Typography.Text type="secondary" className="mb-3 mt-6 block text-xs">
          时间范围：{PERIOD_OPTIONS.find((p) => p.value === period)?.label}（粒度见接口说明）
        </Typography.Text>

        <TrendCharts
          reqTrendAxis={reqTrendAxis}
          tokenTrendAxis={tokenTrendAxis}
          latencyTrendAxis={latencyTrendAxis}
          successTrendAxis={successTrendAxis}
          reqTrendEmpty={reqTrendEmpty}
          tokenTrendEmpty={tokenTrendEmpty}
          latencyTrendEmpty={latencyTrendEmpty}
          successTrendEmpty={successTrendEmpty}
        />

        <div className="mt-4">
          <DistributionCharts errors={errors} modelColumnData={modelColumnData} />
        </div>

        <RecentRequestsTable recent={recent} />
      </Spin>
    </DashboardPageCard>
  );
}
