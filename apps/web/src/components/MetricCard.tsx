import type { MetricReading } from "@ahm/contracts";

import "./metric-card.css";

const STATUS_LABEL: Record<MetricReading["status"], string> = {
  normal: "No alert",
  watch: "Check needed",
  alert: "Alert",
  unavailable: "No data",
};

function formatTime(iso: string | null): string {
  if (!iso) {
    return "no reading";
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

interface MetricCardProps {
  reading: MetricReading;
}

/**
 * Compact metric tile. Interaction (selection, details) is added in the
 * measurements stage; the tile itself only presents the received state.
 */
export function MetricCard({ reading }: MetricCardProps) {
  const hasValue = reading.value !== null;

  return (
    <article className="metric-card" data-status={reading.status}>
      <header className="metric-card__head">
        <h3 className="metric-card__label">{reading.label}</h3>
        <span className="metric-card__status" data-status={reading.status}>
          <span className="metric-card__status-dot" aria-hidden="true" />
          {STATUS_LABEL[reading.status]}
        </span>
      </header>

      <p className="metric-card__value">
        {hasValue ? (
          <>
            <span className="metric-card__number">{reading.value}</span>
            <span className="metric-card__unit">{reading.unit}</span>
          </>
        ) : (
          <span className="metric-card__empty">No data</span>
        )}
      </p>

      <p className="metric-card__meta">
        <time dateTime={reading.measuredAt ?? undefined} title={reading.measuredAt ?? undefined}>
          {formatTime(reading.measuredAt)}
        </time>
        <span aria-hidden="true">·</span>
        <span>synthetic</span>
      </p>
    </article>
  );
}
