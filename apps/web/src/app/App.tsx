import { useEffect, useState } from "react";
import type { HealthDataSource, HealthUpdate } from "@ahm/contracts";

import { OverlayProvider } from "../components/overlays";
import { OverviewScreen } from "../features/overview/OverviewScreen";
import { createHealthDataSource } from "../services/demo";
import { DemoHealthDataSource } from "../services/demo/demoHealthDataSource";

import "./app.css";

export function App() {
  const [source] = useState<HealthDataSource>(() => createHealthDataSource());
  const [tourSource, setTourSource] = useState<HealthDataSource | null>(null);
  const activeSource = tourSource ?? source;
  useEffect(() => () => tourSource?.dispose(), [tourSource]);
  const [update, setUpdate] = useState<HealthUpdate | null>(null);

  useEffect(() => {
    return activeSource.subscribe(setUpdate);
  }, [activeSource]);

  if (!update) {
    return <p className="app-loading">Loading demo state…</p>;
  }

  return (
    <OverlayProvider>
      <OverviewScreen key={tourSource ? "walkthrough" : "main"} update={update} touring={tourSource !== null} onStartTour={() => { const next = new DemoHealthDataSource(null); next.populateHistory(7); setTourSource(next); }} onEndTour={() => setTourSource(null)} actions={{
        runScenario: id => activeSource.runScenario(id),
        pauseScenario: () => activeSource.pause(),
        resumeScenario: () => activeSource.resume(),
        resetScenario: () => activeSource.reset(),
        setDailyMode: mode => activeSource.setDailyMode(mode),
        saveActiveMinutes: minutes => activeSource.saveActiveMinutes(minutes),
        confirmDailyTask: task => activeSource.confirmDailyTask(task),
        saveCheckIn: input => activeSource.saveCheckIn(input),
        populate: days => activeSource.populateHistory(days),
        clear: () => activeSource.clearData(),
        setState: state => activeSource.setDemoState(state),
        recordExport: recipient => activeSource.recordReportExport(recipient),
      }} />
    </OverlayProvider>
  );
}
