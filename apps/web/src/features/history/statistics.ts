import type { TrendPoint } from "@ahm/contracts";

export interface TrendStatistics {
  count: number;
  latest: number;
  latestAt: string;
  min: number;
  max: number;
  average: number;
  range: number;
  spanSeconds: number;
}

/**
 * Plain arithmetic over the delivered points of the selected period. No
 * medical thresholds and no decorative numbers are calculated here.
 */
export function computeStatistics(points: TrendPoint[]): TrendStatistics | null {
  if (points.length === 0) {
    return null;
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;

  for (const point of points) {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
    sum += point.value;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return null;
  }

  return {
    count: points.length,
    latest: last.value,
    latestAt: last.at,
    min,
    max,
    average: sum / points.length,
    range: max - min,
    spanSeconds: Math.max(0, (Date.parse(last.at) - Date.parse(first.at)) / 1000),
  };
}

/**
 * Split a trend at real gaps so the chart never draws a line through missing
 * data. A gap is longer than 2.5× the median interval of the period.
 */
export function splitAtGaps(points: TrendPoint[]): TrendPoint[][] {
  if (points.length <= 1) {
    return points.length === 1 ? [points] : [];
  }

  const intervals: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) {
      continue;
    }
    intervals.push(Date.parse(current.at) - Date.parse(previous.at));
  }

  const sorted = [...intervals].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
      : (sorted[middle] ?? 0);
  const gapThreshold = Math.max(median * 2.5, 1500);

  const segments: TrendPoint[][] = [];
  let currentSegment: TrendPoint[] = [];

  points.forEach((point, index) => {
    if (index === 0) {
      currentSegment = [point];
      return;
    }

    const previous = points[index - 1];
    const gap = previous ? Date.parse(point.at) - Date.parse(previous.at) : 0;
    if (gap > gapThreshold) {
      segments.push(currentSegment);
      currentSegment = [point];
    } else {
      currentSegment.push(point);
    }
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}
