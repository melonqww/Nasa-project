import type { MetricReading } from "@ahm/contracts";

import { formatTime } from "../../lib/format";

const STATUS_TEXT: Record<MetricReading["status"], string> = {
  normal: "No alert",
  watch: "Check needed",
  alert: "Alert",
  unavailable: "No data",
};

interface MetricSummaryCardProps {
  reading: MetricReading;
  selected: boolean;
  onSelect: (metric: MetricReading["metric"]) => void;
}

/**
 * Compact summary for one indicator inside the health overlay. All five
 * summaries are shown at once; the selected one is highlighted.
 */
export function MetricSummaryCard({ reading, selected, onSelect }: MetricSummaryCardProps) {
  return (
    <button
      type="button"
      className="metric-summary"
      data-status={reading.status}
      data-selected={selected}
      aria-pressed={selected}
      onClick={() => onSelect(reading.metric)}
    >
      <span className="metric-summary__head">
        <span className="metric-summary__label">{reading.label}</span>
        <span className="metric-summary__status" data-status={reading.status}>
          <span className="metric-summary__dot" aria-hidden="true" />
          {STATUS_TEXT[reading.status]}
        </span>
      </span>

      <span className="metric-summary__value">
        {reading.value !== null ? (
          <>
            <span className="metric-summary__number">{reading.value}</span>
            <span className="metric-summary__unit">{reading.unit}</span>
          </>
        ) : (
          <span className="metric-summary__empty">No data</span>
        )}
      </span>

      <span className="metric-summary__meta">
        <time dateTime={reading.measuredAt ?? undefined} title={reading.measuredAt ?? undefined}>
          {formatTime(reading.measuredAt)}
        </time>
        <span aria-hidden="true">·</span>
        <span>{reading.quality} quality</span>
      </span>
    </button>
  );
}
