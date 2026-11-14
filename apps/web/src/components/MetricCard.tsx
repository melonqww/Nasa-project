import type { MetricId, MetricReading } from "@ahm/contracts";

import { formatTime } from "../lib/format";

import "./metric-card.css";

const STATUS_LABEL: Record<MetricReading["status"], string> = {
  normal: "No alert",
  watch: "Check needed",
  alert: "Alert",
  unavailable: "No data",
};

interface MetricCardProps {
  reading: MetricReading;
  selected: boolean;
  onSelect: (metric: MetricId) => void;
}

/**
 * Compact metric tile. A click selects the metric and shows the compact plaque
 * above the shared bottom panel; details are opened from that plaque.
 */
export function MetricCard({ reading, selected, onSelect }: MetricCardProps) {
  const hasValue = reading.value !== null;

  return (
    <button
      type="button"
      className="metric-card"
      data-status={reading.status}
      data-selected={selected}
      aria-pressed={selected}
      onClick={() => onSelect(reading.metric)}
    >
      <span className="metric-card__head">
        <span className="metric-card__label">{reading.label}</span>
        <span className="metric-card__status" data-status={reading.status}>
          <span className="metric-card__status-dot" aria-hidden="true" />
          {STATUS_LABEL[reading.status]}
        </span>
      </span>

      <span className="metric-card__value">
        {hasValue ? (
          <>
            <span className="metric-card__number">{reading.value}</span>
            <span className="metric-card__unit">{reading.unit}</span>
          </>
        ) : (
          <span className="metric-card__empty">No data</span>
        )}
      </span>

      <span className="metric-card__meta">
        <time dateTime={reading.measuredAt ?? undefined} title={reading.measuredAt ?? undefined}>
          {formatTime(reading.measuredAt)}
        </time>
        <span aria-hidden="true">·</span>
        <span>synthetic</span>
      </span>
    </button>
  );
}
