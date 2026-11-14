import { useState } from "react";
import type { DemoScenario, HealthUpdate, MetricId, MetricReading, ScenarioId } from "@ahm/contracts";

import { MetricCard } from "../../components/MetricCard";
import { RecommendationBar } from "../../components/RecommendationBar";
import { SimulationBadge } from "../../components/SimulationBadge";
import { StatusBall } from "../../components/StatusBall";
import { BottomPanel, useOverlayController } from "../../components/overlays";
import { CommunicationPanel } from "../communication/CommunicationPanel";
import { DemoControlBar } from "../demo-control/DemoControlBar";
import { MetricDetails, MetricPlaque } from "../measurements/MetricSummary";

import "./overview-screen.css";

interface OverviewScreenProps {
  update: HealthUpdate;
  scenarios: DemoScenario[];
  onRun: (scenarioId: ScenarioId) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/**
 * Crew-facing main screen: guidance row, centered jelly ball with the five
 * metric tiles beside it and the shared bottom panels.
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
  const { overall, metrics, recommendations } = snapshot;

  const [selectedMetric, setSelectedMetric] = useState<MetricId | null>(null);
  const { modeOf, showPeek } = useOverlayController();

  const selectedReading = metrics.find((reading) => reading.metric === selectedMetric) ?? null;

  const handleSelect = (metric: MetricId) => {
    setSelectedMetric(metric);
    if (modeOf("details") !== "expanded") {
      showPeek("details");
    }
  };

  const renderCard = (reading: MetricReading) => (
    <MetricCard
      key={reading.metric}
      reading={reading}
      selected={reading.metric === selectedMetric}
      onSelect={handleSelect}
    />
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <div className="site-badge">
        <SimulationBadge />
      </div>

      <DemoControlBar
        control={control}
        scenarios={scenarios}
        onRun={onRun}
        onPause={onPause}
        onResume={onResume}
        onReset={onReset}
      />

      <main id="main" className="layout">
        <div className="layout__bar">
          <RecommendationBar recommendations={recommendations} />
        </div>

        <section className="ball-layout" aria-label="Current health index">
          <div className="ball-layout__side">{metrics.slice(0, 2).map(renderCard)}</div>
          <div className="ball-layout__center">
            <StatusBall
              state={overall.state}
              score={overall.healthScore}
              label={overall.scoreLabel}
            />
          </div>
          <div className="ball-layout__side">{metrics.slice(2).map(renderCard)}</div>
        </section>

        <p className="demo-note">
          Demo health index (0–100) calculated from synthetic data · not a diagnosis
        </p>

        <div className="panel-stack">
          <BottomPanel
            id="details"
            title={selectedReading ? `${selectedReading.label} details` : "Metric details"}
            peek={selectedReading ? <MetricPlaque reading={selectedReading} /> : undefined}
          >
            {selectedReading ? (
              <MetricDetails reading={selectedReading} />
            ) : (
              <p className="panel-empty">Select a metric to see its details.</p>
            )}
          </BottomPanel>
          <CommunicationPanel />
        </div>
      </main>
    </div>
  );
}
