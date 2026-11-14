import type { TrendPoint } from "@ahm/contracts";

export type PeriodId = "1m" | "5m" | "all";

export interface HistoryPeriod {
  id: PeriodId;
  label: string;
  /** Fixed window length; `null` means all delivered history. */
  seconds: number | null;
}

/**
 * Fixed short windows from the latest delivered reading. The demo source only
 * provides a few minutes of history, so the interface never implies a week of
 * measurements that does not exist.
 */
export const HISTORY_PERIODS: HistoryPeriod[] = [
  { id: "1m", label: "1 min", seconds: 60 },
  { id: "5m", label: "5 min", seconds: 300 },
  { id: "all", label: "All available", seconds: null },
];

/** Chronological copy; the contract already sends points in order. */
export function sortTrend(points: TrendPoint[]): TrendPoint[] {
  return [...points].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
}

/**
 * The reference point is the latest delivered value, not the wall clock: a
 * sensor that stopped reporting must not produce an empty-looking period.
 */
export function referenceTime(
  reading: { measuredAt: string | null; trend: TrendPoint[] },
  fallback: string,
): string {
  const lastPoint = reading.trend[reading.trend.length - 1];
  return reading.measuredAt ?? lastPoint?.at ?? fallback;
}

/** Filter one period. The same filtered points feed the chart and the stats. */
export function filterTrend(
  points: TrendPoint[],
  period: HistoryPeriod,
  referenceAt: string,
): TrendPoint[] {
  if (period.seconds === null) {
    return points;
  }

  const referenceMs = Date.parse(referenceAt);
  if (Number.isNaN(referenceMs)) {
    return [];
  }

  const from = referenceMs - period.seconds * 1000;
  return points.filter((point) => {
    const at = Date.parse(point.at);
    return !Number.isNaN(at) && at >= from && at <= referenceMs;
  });
}
