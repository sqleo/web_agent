"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import {
  getMonitorErrors,
  getMonitorModels,
  getMonitorOverview,
  getMonitorRecentRequests,
  getMonitorTrendLatency,
  getMonitorTrendRequests,
  getMonitorTrendSuccessRate,
  getMonitorTrendTokens,
} from "../api/monitor";
import type {
  MonitorErrorItem,
  MonitorModelStat,
  MonitorOverview,
  MonitorPeriod,
  MonitorRequestRow,
  MonitorTrendPoint,
} from "../types";
import { mapTrendPointsForAxis } from "@/lib/monitor-chart-time";

const TOKEN_CATEGORY_LABEL: Record<string, string> = {
  input_cache_hit: "输入缓存命中",
  input_cache_miss: "输入缓存未命中",
  output_tokens: "输出 Tokens",
};

function modelChartData(stats: MonitorModelStat[]) {
  const rows: { model: string; metric: string; value: number }[] = [];
  for (const m of stats) {
    rows.push(
      { model: m.model, metric: "请求数", value: m.requests },
      { model: m.model, metric: "Tokens", value: m.tokens }
    );
  }
  return rows;
}

export function useMonitorData() {
  const [period, setPeriod] = useState<MonitorPeriod>("day");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<MonitorOverview>({});
  const [reqTrend, setReqTrend] = useState<MonitorTrendPoint[]>([]);
  const [tokenTrend, setTokenTrend] = useState<MonitorTrendPoint[]>([]);
  const [latencyTrend, setLatencyTrend] = useState<MonitorTrendPoint[]>([]);
  const [successTrend, setSuccessTrend] = useState<MonitorTrendPoint[]>([]);
  const [errors, setErrors] = useState<MonitorErrorItem[]>([]);
  const [models, setModels] = useState<MonitorModelStat[]>([]);
  const [recent, setRecent] = useState<MonitorRequestRow[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        getMonitorOverview(),
        getMonitorTrendRequests(period),
        getMonitorTrendTokens(period),
        getMonitorTrendLatency(period),
        getMonitorTrendSuccessRate(period),
        getMonitorErrors(),
        getMonitorModels(),
        getMonitorRecentRequests(20),
      ]);

      const warnPartial = settled.some((s) => s.status === "rejected");
      if (warnPartial) {
        message.warning("部分监控数据加载失败，请检查网络或接口");
      }

      if (settled[0].status === "fulfilled") setOverview(settled[0].value);
      if (settled[1].status === "fulfilled") setReqTrend(settled[1].value);
      if (settled[2].status === "fulfilled") setTokenTrend(settled[2].value);
      if (settled[3].status === "fulfilled") setLatencyTrend(settled[3].value);
      if (settled[4].status === "fulfilled") setSuccessTrend(settled[4].value);
      if (settled[5].status === "fulfilled") setErrors(settled[5].value);
      if (settled[6].status === "fulfilled") setModels(settled[6].value);
      if (settled[7].status === "fulfilled") setRecent(settled[7].value);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加载监控数据失败");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const modelColumnData = useMemo(() => modelChartData(models), [models]);

  const reqTrendAxis = useMemo(
    () => mapTrendPointsForAxis(reqTrend, period),
    [reqTrend, period]
  );
  const tokenTrendAxis = useMemo(
    () =>
      mapTrendPointsForAxis(tokenTrend, period).map((p) => ({
        ...p,
        category: TOKEN_CATEGORY_LABEL[p.category] ?? p.category,
      })),
    [tokenTrend, period]
  );
  const latencyTrendAxis = useMemo(
    () => mapTrendPointsForAxis(latencyTrend, period),
    [latencyTrend, period]
  );
  const successTrendAxis = useMemo(
    () => mapTrendPointsForAxis(successTrend, period),
    [successTrend, period]
  );

  return {
    period,
    setPeriod,
    loading,
    overview,
    reqTrendAxis,
    tokenTrendAxis,
    latencyTrendAxis,
    successTrendAxis,
    reqTrendEmpty: reqTrend.length === 0,
    tokenTrendEmpty: tokenTrend.length === 0,
    latencyTrendEmpty: latencyTrend.length === 0,
    successTrendEmpty: successTrend.length === 0,
    errors,
    modelColumnData,
    recent,
  };
}
