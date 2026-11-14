import { useState } from "react";
import type { DemoScenario, HealthUpdate, MetricId, ScenarioId } from "@ahm/contracts";

import { RecommendationBar } from "../../components/RecommendationBar";
import { SimulationBadge } from "../../components/SimulationBadge";
import { OverlayPanel, useOverlayController } from "../../components/overlays";
import { CommunicationPanel } from "../communication/CommunicationPanel";
import { DemoControlBar } from "../demo-control/DemoControlBar";
import { HealthIndicators } from "../measurements/HealthIndicators";
import { HealthOrbit } from "./HealthOrbit";

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
 * Crew-facing main screen: guidance row, centered ball with five circular
 * indicators on its lower arc, and the communication block on the left.
 * The ball and every indicator open one aggregated health overlay.
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
  const { overall, metrics, recommendations, generatedAt } = snapshot;

  const [selectedMetric, setSelectedMetric] = useState<MetricId | null>(null);
  const { isOpen, openPanel } = useOverlayController();
  const overlayOpen = isOpen("health");

  const openMetric = (metric: MetricId) => {
    setSelectedMetric(metric);
    openPanel("health");
  };

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

      <CommunicationPanel />

      <main id="main" className="layout">
        <div className="layout__bar">
          <RecommendationBar recommendations={recommendations} />
        </div>

        <section className="stage" aria-label="Current health index and indicators">
          <HealthOrbit
            state={overall.state}
            score={overall.healthScore}
            label={overall.scoreLabel}
            metrics={metrics}
            selectedMetric={selectedMetric}
            overlayOpen={overlayOpen}
            onOpenHealth={() => openPanel("health")}
            onSelectMetric={openMetric}
            onLongPressMetric={openMetric}
          />
        </section>

        <p className="demo-note">
          Demo health index (0–100) calculated from synthetic data · not a diagnosis
        </p>
      </main>

      <OverlayPanel id="health" title="Health indicators">
        <HealthIndicators
          overall={overall}
          metrics={metrics}
          recommendations={recommendations}
          generatedAt={generatedAt}
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />
      </OverlayPanel>
    </div>
  );
}
