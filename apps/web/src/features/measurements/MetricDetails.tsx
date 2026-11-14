import { useMemo, useState } from "react";
import type { MetricReading, Recommendation } from "@ahm/contracts";

import { formatClockTime, formatSpan, formatTime, formatValue } from "../../lib/format";
import { TrendChart } from "../history/TrendChart";
import {
  HISTORY_PERIODS,
  filterTrend,
  referenceTime,
  sortTrend,
  type PeriodId,
} from "../history/periods";
import { computeStatistics } from "../history/statistics";

import "./metric-details.css";

const STATUS_TEXT: Record<MetricReading["status"], string> = {
  normal: "No alert",
  watch: "Check needed",
  alert: "Alert",
  unavailable: "No data",
};

const SEVERITY_LABEL: Record<Recommendation["severity"], string> = {
  info: "Info",
  check: "Check",
  urgent: "Urgent",
};

interface MetricDetailsProps {
  reading: MetricReading;
  recommendations: Recommendation[];
  /** Snapshot time, used only when the reading has no timestamp at all. */
  fallbackAt: string;
}

/**
 * Full details for the selected indicator: value and provenance, a chart and
 * statistics over the same selected period, and prepared guidance delivered by
 * the data source. The component calculates only arithmetic over the points.
 */
export function MetricDetails({ reading, recommendations, fallbackAt }: MetricDetailsProps) {
  const [periodId, setPeriodId] = useState<PeriodId>("5m");
  const period = HISTORY_PERIODS.find((item) => item.id === periodId) ?? HISTORY_PERIODS[0]!;

  const sortedTrend = useMemo(() => sortTrend(reading.trend), [reading.trend]);
  const referenceAt = useMemo(
    () => referenceTime({ measuredAt: reading.measuredAt, trend: sortedTrend }, fallbackAt),
    [reading.measuredAt, sortedTrend, fallbackAt],
  );
  const points = useMemo(
    () => filterTrend(sortedTrend, period, referenceAt),
    [sortedTrend, period, referenceAt],
  );
  const statistics = useMemo(() => computeStatistics(points), [points]);

  const missingCurrent = reading.status === "unavailable";
  const hasAnyHistory = sortedTrend.length > 0;

  return (
    <div className="metric-details">
      <header className="metric-details__hero">
        <div>
          <p className="metric-details__label">{reading.label}</p>
          <p className="metric-details__value" data-status={reading.status}>
            {reading.value !== null ? (
              <>
                <span className="metric-details__number">{reading.value}</span>
                <span className="metric-details__unit">{reading.unit}</span>
              </>
            ) : (
              <span className="metric-details__number metric-details__number--empty">No data</span>
            )}
          </p>
        </div>

        <div className="metric-details__meta">
          <span className="metric-details__pill" data-status={reading.status}>
            {STATUS_TEXT[reading.status]}
          </span>
          <span>{formatTime(reading.measuredAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{reading.quality} quality</span>
          <span aria-hidden="true">·</span>
          <span>{reading.source} · synthetic</span>
        </div>
      </header>

      <p className="metric-details__caption">{reading.caption}</p>

      {missingCurrent && (
        <p className="metric-details__warning" role="status">
          No current reading. The chart shows only history that was actually delivered; the gap is
          not connected and is not treated as a normal value.
        </p>
      )}

      <section className="metric-details__block" aria-labelledby="period-heading">
        <div className="metric-details__block-head">
          <div>
            <h3 className="metric-details__block-title" id="period-heading">
              History
            </h3>
            <p className="metric-details__block-note">
              {reading.metric === "sleep"
                ? "Each point is one completed sleep period, not a nightly average."
                : "The chart and statistics below use the same filtered points."}
            </p>
          </div>

          <div className="period-switch" role="group" aria-label="History period">
            {HISTORY_PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="period-switch__button"
                aria-pressed={item.id === period.id}
                onClick={() => setPeriodId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <TrendChart
          points={points}
          label={reading.label}
          unit={reading.unit}
          periodLabel={period.label}
          referenceAt={referenceAt}
        />

        {!hasAnyHistory && (
          <p className="metric-details__history-note">
            The source delivered no trend points for this indicator. Statistics are not shown
            instead of inventing a history.
          </p>
        )}
      </section>

      <section className="metric-details__block" aria-labelledby="stats-heading">
        <div className="metric-details__block-head">
          <div>
            <h3 className="metric-details__block-title" id="stats-heading">
              Statistics · {period.label}
            </h3>
            <p className="metric-details__block-note">
              Calculated from the {statistics?.count ?? 0} delivered reading
              {statistics?.count === 1 ? "" : "s"} in this period.
            </p>
          </div>
        </div>

        {statistics ? (
          <dl className="metric-details__stats">
            <div className="metric-details__stat">
              <dt>Latest</dt>
              <dd>{formatValue(statistics.latest)}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Average</dt>
              <dd>{formatValue(statistics.average)}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Minimum</dt>
              <dd>{formatValue(statistics.min)}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Maximum</dt>
              <dd>{formatValue(statistics.max)}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Range</dt>
              <dd>{formatValue(statistics.range)}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Readings</dt>
              <dd>{statistics.count}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Span</dt>
              <dd>{formatSpan(statistics.spanSeconds)}</dd>
            </div>
            <div className="metric-details__stat">
              <dt>Last reading</dt>
              <dd>{formatClockTime(statistics.latestAt)}</dd>
            </div>
          </dl>
        ) : (
          <p className="metric-details__stats-empty">
            No statistics for this period. Nothing is filled in.
          </p>
        )}
      </section>

      <section className="metric-details__block" aria-labelledby="guidance-heading">
        <div className="metric-details__block-head">
          <div>
            <h3 className="metric-details__block-title" id="guidance-heading">
              Prepared guidance
            </h3>
            <p className="metric-details__block-note">
              Written in advance for the synthetic scenario. Not generated here and not a medical
              protocol.
            </p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <ul className="metric-details__guidance">
            {recommendations.map((recommendation) => (
              <li key={recommendation.id} className="metric-details__guidance-item">
                <span className="metric-details__severity" data-severity={recommendation.severity}>
                  {SEVERITY_LABEL[recommendation.severity]}
                </span>
                <div>
                  <p className="metric-details__guidance-title">{recommendation.title}</p>
                  <p className="metric-details__guidance-body">{recommendation.body}</p>
                  <p className="metric-details__source">{recommendation.source}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="metric-details__stats-empty">
            No prepared guidance was delivered for the current state.
          </p>
        )}

        <p className="metric-details__source">
          Indicator source: {reading.source} · {reading.quality} quality · synthetic data.
        </p>
      </section>

      <p className="metric-details__note">
        Missing readings stay a separate state and are never shown as normal. The demo health index
        is a prepared demo value, not a diagnosis.
      </p>
    </div>
  );
}
