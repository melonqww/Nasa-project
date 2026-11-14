import type {
  DataCoverage,
  MetricId,
  MetricReading,
  OverallStatus,
  Recommendation,
} from "@ahm/contracts";

import { formatClockTime } from "../../lib/format";
import { MetricDetails } from "./MetricDetails";
import { MetricSummaryCard } from "./MetricSummaryCard";

import "./health-indicators.css";

const STATE_LABEL: Record<OverallStatus["state"], string> = {
  clear: "Clear",
  check: "Check",
  assist: "Assist",
  insufficient: "Data incomplete",
};

const COVERAGE_TEXT: Record<DataCoverage, string> = {
  complete: "All expected demo indicators are reporting.",
  partial: "Part of the demo data is missing; missing readings stay separate.",
  none: "No current demo data is available.",
};

interface HealthIndicatorsProps {
  overall: OverallStatus;
  metrics: MetricReading[];
  recommendations: Recommendation[];
  generatedAt: string;
  selectedMetric: MetricId | null;
  onSelectMetric: (metric: MetricId) => void;
}

/**
 * Aggregated health view opened from the ball or any indicator: the demo index,
 * current reasons, all five indicators at once, and full details for the
 * selected one. Guidance is prepared by the data source, not generated here.
 */
export function HealthIndicators({
  overall,
  metrics,
  recommendations,
  generatedAt,
  selectedMetric,
  onSelectMetric,
}: HealthIndicatorsProps) {
  const selectedReading =
    metrics.find((reading) => reading.metric === selectedMetric) ?? null;

  return (
    <div className="health-indicators">
      <section className="health-summary" data-state={overall.state} aria-label="Current health summary">
        <div className="health-summary__score">
          <p className="health-summary__eyebrow">Health index · demo</p>
          <p className="health-summary__number">{overall.healthScore}</p>
          <p className="health-summary__label">{overall.scoreLabel}</p>
          <p className="health-summary__note">
            Prepared demo value from synthetic data · not a diagnosis.
          </p>
        </div>

        <div className="health-summary__detail">
          <div className="health-summary__state-row">
            <span className="health-summary__state" data-state={overall.state}>
              {STATE_LABEL[overall.state]}
            </span>
            <span className="health-summary__coverage">{COVERAGE_TEXT[overall.dataCoverage]}</span>
          </div>

          <ul className="health-summary__reasons">
            {overall.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>

          <p className="health-summary__time">
            Evaluated {formatClockTime(overall.updatedAt)} · snapshot {formatClockTime(generatedAt)}
          </p>
        </div>
      </section>

      <section className="health-indicators__section" aria-labelledby="all-indicators-heading">
        <div className="health-indicators__section-head">
          <div>
            <h3 className="health-indicators__title" id="all-indicators-heading">
              All indicators
            </h3>
            <p className="health-indicators__note">
              All five indicators are shown together. Select one to open its history, statistics and
              prepared guidance below.
            </p>
          </div>
        </div>

        <div className="health-indicators__gallery">
          {metrics.map((reading) => (
            <MetricSummaryCard
              key={reading.metric}
              reading={reading}
              selected={reading.metric === selectedMetric}
              onSelect={onSelectMetric}
            />
          ))}
        </div>
      </section>

      <section className="health-indicators__section" aria-labelledby="indicator-detail-heading">
        <div className="health-indicators__section-head">
          <div>
            <h3 className="health-indicators__title" id="indicator-detail-heading">
              {selectedReading ? `${selectedReading.label} details` : "Indicator details"}
            </h3>
            <p className="health-indicators__note">
              {selectedReading
                ? "History, arithmetic statistics and prepared demo guidance for the selected indicator."
                : "Select any indicator above to see its history, statistics and prepared guidance."}
            </p>
          </div>
        </div>

        <div className="health-indicators__detail">
          {selectedReading ? (
            <MetricDetails
              key={selectedReading.metric}
              reading={selectedReading}
              recommendations={recommendations}
              fallbackAt={generatedAt}
            />
          ) : (
            <p className="health-indicators__empty">
              No indicator is selected. All current values remain visible above; nothing is hidden.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
