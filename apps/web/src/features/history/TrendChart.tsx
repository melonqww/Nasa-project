import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { TrendPoint } from "@ahm/contracts";

import { formatClockTime, formatSpan, formatValue } from "../../lib/format";
import { splitAtGaps } from "../history/statistics";

import "./trend-chart.css";

const PADDING = { top: 18, right: 18, bottom: 38, left: 72 };

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
  low: number;
  high: number;
  startAt: string;
  endAt: string;
}

function buildGeometry(points: TrendPoint[], width: number, height: number, left: number): ChartGeometry {
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

  const plotWidth = width - left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  return {
    x: (at) => {
      if (maxTime === minTime) {
        return left + plotWidth / 2;
      }
      return left + ((Date.parse(at) - minTime) / (maxTime - minTime)) * plotWidth;
    },
    y: (value) => PADDING.top + (1 - (value - low) / (high - low)) * plotHeight,
    minValue,
    maxValue,
    low,
    high,
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
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 640px)").matches);
  const [inspected, setInspected] = useState<{ point: TrendPoint; left: number; top: number } | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(360);
  const empty = points.length === 0;
  useEffect(() => {
    if (!plotRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setMeasuredWidth(Math.round(width));
    });
    observer.observe(plotRef.current);
    return () => observer.disconnect();
  }, [empty]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const change = () => setCompact(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const WIDTH = compact ? Math.max(200, measuredWidth) : 720;
  const HEIGHT = compact ? 280 : 250;
  const leftPadding = compact ? 52 : PADDING.left;
  const visibleInspection = inspected && points.some(point => point.at === inspected.point.at && point.value === inspected.point.value) ? inspected : null;

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

  const geometry = buildGeometry(points, WIDTH, HEIGHT, leftPadding);
  const segments = splitAtGaps(points);
  const plotWidth = WIDTH - leftPadding - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const gridLines = [0, 0.5, 1];
  const longRange = Date.parse(geometry.endAt) - Date.parse(geometry.startAt) >= 86400000;
  const axisTime = (at: string) => longRange ? new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC", day: "2-digit", month: "short", ...(compact ? {} : { year: "numeric" as const }),
  }).format(new Date(at)) : formatClockTime(at);
  const ariaLabel = `${label} history for ${periodLabel}: ${points.length} readings from ${axisTime(
    geometry.startAt,
  )} to ${axisTime(geometry.endAt)}. Reference ${axisTime(referenceAt)}.`;
  const inspect = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * WIDTH;
    if (x < leftPadding - 10 || x > WIDTH - PADDING.right + 10) { setInspected(null); return; }
    const point = points.reduce((nearest, candidate) => Math.abs(geometry.x(candidate.at) - x) < Math.abs(geometry.x(nearest.at) - x) ? candidate : nearest);
    setInspected({ point, left: (event.clientX - bounds.left) / bounds.width * 100, top: (event.clientY - bounds.top) / bounds.height * 100 });
  };
  const keyboard = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "Escape") { setInspected(null); return; }
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = visibleInspection ? points.findIndex(point => point.at === visibleInspection.point.at) : -1;
    const index = event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : Math.max(0, Math.min(points.length - 1, current + (event.key === "ArrowLeft" ? -1 : 1)));
    const point = points[index]!;
    setInspected({ point, left: geometry.x(point.at) / WIDTH * 100, top: geometry.y(point.value) / HEIGHT * 100 });
  };
  const dateTime = (at: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(at));

  return (
    <figure className="trend-chart">
      <div className="trend-chart__plot" ref={plotRef}>
      <svg
        className="trend-chart__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
        tabIndex={0}
        aria-describedby={`${titleId}-help`}
        onPointerMove={inspect}
        onPointerDown={inspect}
        onPointerLeave={event => { if (event.pointerType !== "touch") setInspected(null); }}
        onKeyDown={keyboard}
        onBlur={() => setInspected(null)}
      >
        <title id={titleId}>{ariaLabel}</title>

        {gridLines.map((fraction) => {
          const y = PADDING.top + fraction * plotHeight;
          const value = geometry.high - fraction * (geometry.high - geometry.low);
          return (
            <g key={fraction}>
              <line
                className="trend-chart__grid"
                x1={leftPadding}
                x2={leftPadding + plotWidth}
                y1={y}
                y2={y}
              />
              <text className="trend-chart__axis-label" x={leftPadding - 10} y={y + 4} textAnchor="end">
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

        {visibleInspection && <g className="trend-chart__selection" pointerEvents="none">
          <line x1={geometry.x(visibleInspection.point.at)} x2={geometry.x(visibleInspection.point.at)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} />
          <circle cx={geometry.x(visibleInspection.point.at)} cy={geometry.y(visibleInspection.point.value)} r={5} />
        </g>}
        <text className="trend-chart__axis-label" x={leftPadding} y={HEIGHT - 12} textAnchor="start">
          {axisTime(geometry.startAt)}
        </text>
        <text
          className="trend-chart__axis-label"
          x={leftPadding + plotWidth}
          y={HEIGHT - 12}
          textAnchor="end"
        >
          {axisTime(geometry.endAt)}
        </text>
      </svg>
      {visibleInspection && <div className="trend-chart__tooltip" role="tooltip" style={{ left: `clamp(8px, calc(${visibleInspection.left}% ${visibleInspection.left > 50 ? `- ${compact ? 184 : 222}px` : "+ 12px"}), calc(100% - ${compact ? 180 : 218}px))`, top: `${Math.max(8, Math.min(82, visibleInspection.top))}%` }} data-above={visibleInspection.top > 45}>
        <span>{label}</span><strong>{formatValue(visibleInspection.point.value)} <small>{unit}</small></strong>
        <time dateTime={visibleInspection.point.at}>{dateTime(visibleInspection.point.at)} UTC</time><small>Synthetic sample</small>
      </div>}
      </div>
      <p id={`${titleId}-help`} className="trend-chart__help">{compact ? "Tap the chart to inspect a sample." : "Hover over the chart or use the left and right arrow keys to inspect a sample."}</p>

      <figcaption className="trend-chart__caption">
        <span>{periodLabel}</span>
        <span aria-hidden="true">·</span>
        <span>
          {points.length} readings · {formatSpan((Date.parse(geometry.endAt) - Date.parse(geometry.startAt)) / 1000)}
        </span>
        <span aria-hidden="true">·</span>
        <span>{unit} · UTC</span>
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
