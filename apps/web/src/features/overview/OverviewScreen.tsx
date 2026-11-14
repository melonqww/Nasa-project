import type { DemoScenario, HealthUpdate, MetricReading, ScenarioId } from "@ahm/contracts";

import { MetricCard } from "../../components/MetricCard";
import { RecommendationBar } from "../../components/RecommendationBar";
import { SimulationBadge } from "../../components/SimulationBadge";
import { StatusBall } from "../../components/StatusBall";
import { DemoControlBar } from "../demo-control/DemoControlBar";

import "./overview-screen.css";

const COVERAGE_LABEL = {
  complete: "All expected demo metrics are reporting.",
  partial: "Part of the expected data is missing.",
  none: "No current measurements are available.",
} as const;

function formatUpdated(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

interface OverviewScreenProps {
  update: HealthUpdate;
  scenarios: DemoScenario[];
  onRun: (scenarioId: ScenarioId) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/**
 * Crew-facing main screen: header, guidance, jelly ball, short summary and
 * the five metric tiles. Panels and detailed views are added in the next
 * interface stages.
 */
export function OverviewScreen({
  update,
  scenarios,
  onRun,
  onPause,
  onResume,
  onReset,
}: OverviewScreenProps) {
  const { snapshot, control } = update;
  const { mission, overall, metrics, recommendations } = snapshot;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="topbar">
        <div className="topbar__identity">
          <p className="topbar__eyebrow">Crew health monitor</p>
          <h1 className="topbar__name">{mission.astronautName}</h1>
          <p className="topbar__context">
            {mission.astronautRole} · {mission.missionPhase} · {mission.environment}
          </p>
        </div>
        <div className="topbar__meta">
          <SimulationBadge />
          <p className="topbar__timeline">{mission.timelineLabel}</p>
        </div>
      </header>

      <main id="main" className="layout">
        <RecommendationBar recommendations={recommendations} />

        <section className="main-grid" aria-label="Current status">
          <div className="main-grid__ball">
            <StatusBall state={overall.state} headline={overall.headline} />
          </div>

          <aside className="summary" aria-labelledby="summary-title">
            <h2 className="summary__title" id="summary-title">
              Why this state
            </h2>
            <ul className="summary__reasons">
              {overall.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="summary__facts">
              <p className="summary__fact">
                <span className="summary__fact-label">Data coverage</span>
                <span>{COVERAGE_LABEL[overall.dataCoverage]}</span>
              </p>
              <p className="summary__fact">
                <span className="summary__fact-label">Evaluated</span>
                <span>{formatUpdated(overall.updatedAt)} · demo clock</span>
              </p>
            </div>
            <p className="summary__note">
              The ball shows the action priority from the demo rules. It is not a health score and
              a missing reading is never shown as normal.
            </p>
          </aside>
        </section>

        <section className="metrics" aria-label="Metrics">
          <div className="metrics__head">
            <h2 className="metrics__title">Metrics</h2>
            <p className="metrics__hint">Synthetic values · updated by the scenario clock</p>
          </div>
          <div className="metrics__grid">
            {metrics.map((reading: MetricReading) => (
              <MetricCard key={reading.metric} reading={reading} />
            ))}
          </div>
        </section>
      </main>

      <DemoControlBar
        control={control}
        scenarios={scenarios}
        onRun={onRun}
        onPause={onPause}
        onResume={onResume}
        onReset={onReset}
      />
    </div>
  );
}
