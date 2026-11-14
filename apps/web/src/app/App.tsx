import { useEffect, useState } from "react";
import type { HealthDataSource, HealthUpdate } from "@ahm/contracts";

import { OverlayProvider } from "../components/overlays";
import { OverviewScreen } from "../features/overview/OverviewScreen";
import { createHealthDataSource } from "../services/demo";

import "./app.css";

export function App() {
  const [source] = useState<HealthDataSource>(() => createHealthDataSource());
  const [update, setUpdate] = useState<HealthUpdate | null>(null);

  useEffect(() => {
    return source.subscribe(setUpdate);
  }, [source]);

  if (!update) {
    return <p className="app-loading">Loading demo state…</p>;
  }

  return (
    <OverlayProvider>
      <OverviewScreen
        update={update}
        scenarios={source.listScenarios()}
        onRun={(scenarioId) => source.runScenario(scenarioId)}
        onPause={() => source.pause()}
        onResume={() => source.resume()}
        onReset={() => source.reset()}
      />
    </OverlayProvider>
  );
}
