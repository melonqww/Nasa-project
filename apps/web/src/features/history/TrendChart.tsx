import { useId } from "react";
import type { TrendPoint } from "@ahm/contracts";

import { formatClockTime, formatSpan, formatValue } from "../../lib/format";
import { splitAtGaps } from "../history/statistics";

import "./trend-chart.css";

const WIDTH = 720;
const HEIGHT = 250;
const PADDING = { top: 18, right: 18, bottom: 34, left: 50 };

interface TrendChartProps {
  points: TrendPoint[];
  label: string;
  unit: string;
  periodLabel: string;
  referenceAt: string;
}

interface ChartGeometry {
  x: (at: string) => number;
  y: (value: number) => number;
  minValue: number;
  maxValue: number;
  startAt: string;
  endAt: string;
}

function buildGeometry(points: TrendPoint[]): ChartGeometry {
  const times = points.map((point) => Date.parse(point.at));
  const values = points.map((point) => point.value);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const valueSpan = maxValue - minValue;
  const padding = valueSpan === 0 ? Math.max(1, Math.abs(maxValue) * 0.05) : valueSpan * 0.12;
  const low = minValue - padding;
  const high = maxValue + padding;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  return {
    x: (at) => {
      if (maxTime === minTime) {
        return PADDING.left + plotWidth / 2;
      }
      return PADDING.left + ((Date.parse(at) - minTime) / (maxTime - minTime)) * plotWidth;
    },
    y: (value) => PADDING.top + (1 - (value - low) / (high - low)) * plotHeight,
    minValue,
    maxValue,
    startAt: points[0]?.at ?? "",
    endAt: points[points.length - 1]?.at ?? "",
  };
}

/**
 * Local SVG line chart. Lines are drawn per segment, so missing data is a gap,
 * never a straight connection through a period with no readings.
 */
export function TrendChart({ points, label, unit, periodLabel, referenceAt }: TrendChartProps) {
  const titleId = useId();

  if (points.length === 0) {
    return (
      <div className="trend-chart trend-chart--empty" role="img" aria-label={`${label}: no history in ${periodLabel}`}>
        <p className="trend-chart__empty-title">No readings in this period</p>
        <p className="trend-chart__empty-note">
          The data source delivered no {label.toLowerCase()} history for {periodLabel.toLowerCase()}.
          Nothing is filled in or connected.
        </p>
      </div>
    );
  }

  const geometry = buildGeometry(points);
  const segments = splitAtGaps(points);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const gridLines = [0, 0.5, 1];
  const ariaLabel = `${label} history for ${periodLabel}: ${points.length} readings from ${formatClockTime(
    geometry.startAt,
  )} to ${formatClockTime(geometry.endAt)}. Reference ${formatClockTime(referenceAt)}.`;

  return (
    <figure className="trend-chart">
      <svg
        className="trend-chart__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{ariaLabel}</title>

        {gridLines.map((fraction) => {
          const y = PADDING.top + fraction * plotHeight;
          const value = geometry.maxValue - fraction * (geometry.maxValue - geometry.minValue);
          return (
            <g key={fraction}>
              <line
                className="trend-chart__grid"
                x1={PADDING.left}
                x2={PADDING.left + plotWidth}
                y1={y}
                y2={y}
              />
              <text className="trend-chart__axis-label" x={PADDING.left - 10} y={y + 4} textAnchor="end">
                {formatValue(value)}
              </text>
            </g>
          );
        })}

        {segments.map((segment, index) => {
          const path = segment
            .map((point, pointIndex) => {
              const x = geometry.x(point.at);
              const y = geometry.y(point.value);
              return `${pointIndex === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(" ");

          return (
            <g key={`segment-${index}`}>
              {segment.length > 1 && (
                <path
                  className="trend-chart__line"
                  d={path}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {segment.map((point) => (
                <circle
                  key={point.at}
                  className="trend-chart__point"
                  cx={geometry.x(point.at)}
                  cy={geometry.y(point.value)}
                  r={segment.length === 1 ? 4 : 2.6}
                />
              ))}
            </g>
          );
        })}

        <text className="trend-chart__axis-label" x={PADDING.left} y={HEIGHT - 12} textAnchor="start">
          {formatClockTime(geometry.startAt)}
        </text>
        <text
          className="trend-chart__axis-label"
          x={PADDING.left + plotWidth}
          y={HEIGHT - 12}
          textAnchor="end"
        >
          {formatClockTime(geometry.endAt)}
        </text>
      </svg>

      <figcaption className="trend-chart__caption">
        <span>{periodLabel}</span>
        <span aria-hidden="true">·</span>
        <span>
          {points.length} readings · {formatSpan((Date.parse(geometry.endAt) - Date.parse(geometry.startAt)) / 1000)}
        </span>
        <span aria-hidden="true">·</span>
        <span>{unit}</span>
        {segments.length > 1 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{segments.length} separate segments (gaps not connected)</span>
          </>
        )}
      </figcaption>
    </figure>
  );
}
