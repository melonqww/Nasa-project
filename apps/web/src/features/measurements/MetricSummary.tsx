import type { MetricReading } from "@ahm/contracts";

import { formatTime } from "../../lib/format";

import "./metric-summary.css";

const STATUS_TEXT: Record<MetricReading["status"], string> = {
  normal: "No alert",
  watch: "Check needed",
  alert: "Alert",
  unavailable: "No data",
};

function valueText(reading: MetricReading): string {
  if (reading.value === null) {
    return "No data";
  }
  return `${reading.value} ${reading.unit}`;
}

/** Compact plaque shown above the panel handle in the peek state. */
export function MetricPlaque({ reading }: { reading: MetricReading }) {
  return (
    <span className="metric-plaque">
      <span className="metric-plaque__name">{reading.label}</span>
      <span className="metric-plaque__value" data-status={reading.status}>
        {valueText(reading)}
      </span>
      <span className="metric-plaque__meta">
        {formatTime(reading.measuredAt)} · {STATUS_TEXT[reading.status]}
      </span>
    </span>
  );
}

/**
 * Expanded summary for one metric. Chart, statistics and prepared guidance are
 * added in the measurements stage; values here come from the snapshot.
 */
export function MetricDetails({ reading }: { reading: MetricReading }) {
  return (
    <div className="metric-details">
      <div className="metric-details__hero">
        <p className="metric-details__label">{reading.label}</p>
        <p className="metric-details__value" data-status={reading.status}>
          {reading.value !== null ? (
            <>
              <span className="metric-details__number">{reading.value}</span>
              <span className="metric-details__unit">{reading.unit}</span>
            </>
          ) : (
            <span className="metric-details__number">No data</span>
          )}
        </p>
        <p className="metric-details__meta">
          {formatTime(reading.measuredAt)} · {STATUS_TEXT[reading.status]} · {reading.quality} quality
        </p>
      </div>

      <dl className="metric-details__facts">
        <div className="metric-details__fact">
          <dt>What it is</dt>
          <dd>{reading.caption}</dd>
        </div>
        <div className="metric-details__fact">
          <dt>Source</dt>
          <dd>
            {reading.source} · synthetic data
          </dd>
        </div>
        <div className="metric-details__fact">
          <dt>Status</dt>
          <dd>{STATUS_TEXT[reading.status]}</dd>
        </div>
      </dl>

      <p className="metric-details__note">
        The chart, statistics and prepared guidance for this metric are connected in the next
        interface stage. Missing readings stay a separate state and are never shown as normal.
      </p>
    </div>
  );
}
