import type { MonitorPeriod, MonitorTrendPoint } from "@/api/monitor";

/**
 * 按 period 格式化趋势图横轴时间（与接口 `date` 字段解析一致）
 * - realtime：分钟（HH:mm）
 * - day：按小时 MM-DD HH:00
 * - week：按日 MM-DD
 * - month：按日 MM-DD
 */
export function formatMonitorTrendAxisLabel(raw: string, period: MonitorPeriod): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw.length > 16 ? raw.slice(0, 16) : raw;
  }

  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  switch (period) {
    case "realtime":
      return `${h}:${min}`;
    case "day":
      return `${mo}-${day}`;
    case "week":
      return `${mo}-${day}`;
    case "month":
      return `${mo}-${day}`;
    default:
      return `${mo}-${day}`;
  }
}

/** 保证时间序，并把横轴字段替换为短标签（堆叠/多系列共用同一时间戳） */
export function mapTrendPointsForAxis(
  rows: MonitorTrendPoint[],
  period: MonitorPeriod
): MonitorTrendPoint[] {
  return [...rows]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => ({
      ...r,
      date: formatMonitorTrendAxisLabel(r.date, period),
    }));
}
