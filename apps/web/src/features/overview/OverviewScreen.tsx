import { useEffect, useState } from "react";
import type { HealthUpdate, MetricId, OverallState } from "@ahm/contracts";
import { Disclosure } from "../../components/Disclosure";
import { EarthClock } from "../../components/EarthClock";
import { InterfaceIcon, type IconName } from "../../components/InterfaceIcon";
import { StatusBall } from "../../components/StatusBall";
import { OverlayPanel, useOverlayController } from "../../components/overlays";
import { MetricDetails } from "../measurements/MetricDetails";
import { DailyPlanScreen } from "../daily-plan/DailyPlanScreen";
import { ReportPreview } from "../communication/ReportPreview";
import { DemoTools, type DemoActions } from "../demo-control/DemoTools";
import { SelectMenu } from "../../components/SelectMenu";
import { AssistancePanel } from "../assistance/AssistancePanel";
import { measurementContext, statusReason } from "../../lib/measurementContext";
import { GuidedWalkthrough } from "../demo-control/GuidedWalkthrough";
import { ShipOverview } from "../ship/ShipOverview";
import { ModulesScreen } from "../ship/ModulesScreen";
import { OrbitalBackdrop } from "../ship/OrbitalBackdrop";
import { type ModuleId } from "../ship/shipData";
import { useShipTelemetry } from '../ship/useShipTelemetry';
import { ChangeNotice } from "../ship/ChangeNotice";
import { VoicePanel } from '../ship/VoicePanel';
import { ShipDemoControls } from '../ship/ShipDemoControls';

import "./overview-screen.css";
import "../ship/ship.css";
import '../ship/telemetry.css';

type Section = "status" | "health" | "plan" | "connection";
const SECTIONS: { id: Section; label: string; icon: IconName }[] = [
  { id: "status", label: "Status", icon: "status" },
  { id: "health", label: "Health", icon: "heart" },
  { id: "plan", label: "Daily plan", icon: "plan" },
  { id: "connection", label: "Connection", icon: "send" },
];
const METRICS: { id: MetricId; label: string; icon: IconName }[] = [
  { id: "heartRate", label: "Heart rate", icon: "heart" },
  { id: "spo2", label: "Blood oxygen", icon: "oxygen" },
  { id: "sleep", label: "Sleep", icon: "sleep" },
  { id: "wellbeing", label: "Wellbeing", icon: "wellbeing" },
  { id: "activity", label: "Activity", icon: "activity" },
];
const HEALTH_METRICS: typeof METRICS = [...METRICS,
  { id: "respiratoryRate", label: "Breathing", icon: "oxygen" },
  { id: "temperature", label: "Temperature", icon: "temperature" },
  { id: "systolicPressure", label: "Pressure · upper", icon: "pressure" },
  { id: "diastolicPressure", label: "Pressure · lower", icon: "pressure" },
];
const STATUS: Record<OverallState, { title: string; body: string }> = {
  clear: { title: "Your status is stable", body: "No new warnings in the available measurements." },
  check: { title: "A check is needed", body: "Review the measurement that needs your attention." },
  assist: { title: "Crew assistance needed", body: "A simulated urgent event requires attention." },
  insufficient: { title: "Some data is missing", body: "Check the source before assessing your status." },
};
const utcTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

function metricValue(id: MetricId, value: number | null, unit: string) {
  if (value === null) return <><span className="metric-tray__number">—</span><span className="metric-tray__unit">No data</span></>;
  if (id === "sleep") {
    const totalMinutes = Math.round(value * 60);
    return <><span className="metric-tray__number">{Math.floor(totalMinutes / 60)}</span><span className="metric-tray__unit">h</span><span className="metric-tray__number">{totalMinutes % 60}</span><span className="metric-tray__unit">min</span></>;
  }
  return <><span className="metric-tray__number">{value}</span><span className="metric-tray__unit">{id === "wellbeing" ? "/ 10" : unit}</span></>;
}

export function OverviewScreen({ update, actions, touring, onStartTour, onEndTour }: { update: HealthUpdate; actions: DemoActions; touring: boolean; onStartTour: () => void; onEndTour: () => void }) {
  const { overall, metrics, recommendations, generatedAt } = update.snapshot;
  const [section, setSection] = useState<Section>("status");
  const [mode, setMode] = useState<"personal" | "ship">("personal");
  const [departingMode, setDepartingMode] = useState<"personal" | "ship" | null>(null);
  useEffect(() => {
    if (!departingMode) return;
    const timer = window.setTimeout(() => setDepartingMode(null), 700);
    return () => window.clearTimeout(timer);
  }, [departingMode, mode]);
  const [selectedModule, setSelectedModule] = useState<ModuleId>("command");
  const [selectedMetric, setSelectedMetric] = useState<MetricId>("heartRate");
  const [tourStep, setTourStep] = useState(0);
  const [helpEntry, setHelpEntry] = useState<{node:"start"|"sensor"; id:number}>({node:"start",id:0});
  const [startCheckIn, setStartCheckIn] = useState(false);
  const { isOpen, openPanel, closePanel } = useOverlayController();
  const selected = metrics.find(item => item.metric === selectedMetric);
  const status = overall.dataCoverage === "none"
    ? { title: "No measurements loaded", body: "Use Demo tools to add synthetic sample history." }
    : STATUS[overall.state];

  const ship = useShipTelemetry(touring);
  const modules = ship.frame.modules;
  const showMetric = (id: MetricId) => { setMode("personal"); setSelectedMetric(id); setSection("health"); };
  const showModule = (id: ModuleId) => { setSelectedModule(id); setSection("health"); };
  const switchMode = (next: "personal" | "ship") => {
    if (next === mode) return;
    closePanel();
    setDepartingMode(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? null : mode);
    setMode(next);
  };
  const checkIn = () => { setStartCheckIn(true); setSection("plan"); };
  const sensorCheck = () => { setHelpEntry(entry => ({node:"sensor",id:entry.id+1})); openPanel("assistance"); };
  const changeTourStep = (step: number) => {
    if (step < 0 || step > 5) return;
    closePanel(); setTourStep(step);
    actions.setState(step === 2 || step === 3 ? "missing" : "stable");
    if (step === 1) showMetric("heartRate");
    else if (step === 5) checkIn();
    else { setSection("status"); if (step === 3) sensorCheck(); }
  };


  return <div className="app-shell" data-mode={mode} data-state={overall.state} data-touring={touring}>
    <OrbitalBackdrop active />
    <a className="skip-link" href="#main">Skip to main content</a>
    <header className="overview-header">
      <span className="demo-brand">Synthetic demonstration data</span>
      <DemoTools control={update.control} actions={{...actions, clear: () => { actions.clear(); ship.clear(); }}} onStartTour={onStartTour} touring={touring} workspaceMode={mode} shipControls={<ShipDemoControls ship={ship} />} />
      <EarthClock />
      <div className="nav-island">
      <svg className="nav-island__contour" viewBox="0 0 690 88" preserveAspectRatio="none" aria-hidden="true"><path d="M26 12H219C237 12 232 62 258 62H432C458 62 453 12 471 12H664Q689 12 689 37V61Q689 87 663 87H27Q1 87 1 61V38Q1 12 26 12Z" /></svg>
      <nav className="nav-island__half" aria-label="Overview navigation">
        {SECTIONS.slice(0,2).map(item => <button key={item.id} type="button" className="nav-island__item" aria-current={section === item.id ? "page" : undefined} onClick={() => setSection(item.id)}>
          <InterfaceIcon name={item.id === "health" && mode === "ship" ? "modules" : item.icon} /><span>{item.id === "health" && mode === "ship" ? "Modules" : item.label}</span>
        </button>)}
      </nav>
      <div className="mode-bubble" role="group" aria-label="Workspace mode">
        <span className="mode-bubble__selection" data-mode={mode} aria-hidden="true" />
        <button type="button" aria-pressed={mode === "personal"} disabled={touring} onClick={() => switchMode("personal")}><InterfaceIcon name="person" /><span>Personal</span></button>
        <button type="button" aria-pressed={mode === "ship"} disabled={touring} onClick={() => switchMode("ship")}><InterfaceIcon name="ship" /><span>Ship</span></button>
      </div>
      <nav className="nav-island__half" aria-label="Plan and connection navigation">
        {SECTIONS.slice(2).map(item => <button key={item.id} type="button" className="nav-island__item"
          aria-current={section === item.id ? "page" : undefined}
          onClick={() => setSection(item.id)}>
          <InterfaceIcon name={item.id === "health" && mode === "ship" ? "modules" : item.icon} />
          <span>{item.id === "health" && mode === "ship" ? "Modules" : item.label}</span>
        </button>)}
      </nav>
      </div>
      <div className="crew-tools"><button type="button" className="assistance-trigger" aria-label="Open crew assistance" title="Crew assistance" aria-haspopup="dialog" aria-expanded={isOpen("assistance")} onClick={() => openPanel("assistance")}><InterfaceIcon name="help" /><span>Help</span></button><button type="button" className="assistance-trigger voice-trigger" aria-label="Open personal check-ins" aria-haspopup="dialog" aria-expanded={isOpen("voice")} onClick={() => openPanel("voice")}><InterfaceIcon name="mic" /><span>Voice</span></button></div>
    </header>

    <nav className="mobile-dock" aria-label="Mobile navigation">
      {SECTIONS.map(item=><button key={item.id} type="button" aria-current={section===item.id?"page":undefined} onClick={()=>setSection(item.id)}><InterfaceIcon name={item.id==="health"&&mode==="ship"?"modules":item.icon}/><span>{item.id==="health"&&mode==="ship"?"Modules":item.label}</span></button>)}
    </nav>
    <main id="main" key={section} className={section === "status" ? "status-page" : "workspace-page"}>
      {section === "status" ? <div className="workspace-stage" data-mode={mode} data-transitioning={departingMode !== null}>
        {(mode === "ship" || departingMode === "ship") && <div className="workspace-layer workspace-layer--ship" aria-hidden={mode !== "ship"} inert={mode !== "ship"}><ShipOverview modules={modules} locationQuality={ship.frame.locationQuality} onSelect={showModule} /></div>}
        {(mode === "personal" || departingMode === "personal") && <div className="workspace-layer workspace-layer--personal" aria-hidden={mode !== "personal"} inert={mode !== "personal"}>
        <section className="status-composition" aria-labelledby="status-heading">
          <div className="status-visual">
            <StatusBall state={overall.state} expanded={isOpen("health")} onOpen={() => openPanel("health")} />
            {recommendations.filter(item => item.id !== "rec-routine").length > 0 && <aside className="status-guidance" aria-label="Recommendations" data-urgent={recommendations.some(item => item.severity === "urgent")} aria-live="polite">
              <h2>Recommended next</h2>
              {recommendations.filter(item => item.id !== "rec-routine").slice(0,2).map(item => <p key={item.id}>{item.body}</p>)}
            </aside>}
          </div>
          <div className="status-readout">
            <h1 id="status-heading" className="status-readout__title"><span className="status-dot" aria-hidden="true" />{status.title}</h1>
            <p className="status-readout__description">{statusReason(update)}</p>
            {overall.dataCoverage !== "none" && update.control.demoState === "missing" && <button type="button" className="next-action" onClick={sensorCheck}>Check the sensor</button>}
            <button type="button" className="summary-link" onClick={() => openPanel("health")}>View health summary<InterfaceIcon name="chevron" /></button>
          </div>
        </section>
        <section className="metric-overview" aria-label="Latest health measurements">
          <div className="metric-tray">
            {METRICS.map(meta => {
              const reading = metrics.find(item => item.metric === meta.id);
              if (!reading) return null;
              const pending = reading.value === null;
              const quickAction = pending && (meta.id === "wellbeing" || meta.id === "spo2");
              return <button type="button" key={meta.id} className="metric-tray__item" data-status={reading.status} title={quickAction ? (meta.id === "wellbeing" ? "Open today's check-in" : "Open prepared sensor check") : `Open ${meta.label.toLowerCase()} details and history`} onClick={() => quickAction ? (meta.id === "wellbeing" ? checkIn() : sensorCheck()) : showMetric(meta.id)}>
                <span className="metric-tray__label"><InterfaceIcon name={meta.icon} />{meta.label}</span>
                <span key={reading.value} className="metric-tray__reading">{metricValue(meta.id, reading.value, reading.unit)}</span>
                <span className="metric-tray__context">{measurementContext(reading)}</span>
                <span className="metric-tray__hint">{quickAction ? (meta.id === "wellbeing" ? "Complete check-in" : "Check sensor") : "View details"}<InterfaceIcon name="chevron" /></span>
              </button>;
            })}
          </div>
          <p className="measurement-time">Last snapshot: <time dateTime={generatedAt}>{utcTime(generatedAt)} UTC</time><span>Live simulation · 5 s</span></p>
        </section>
      </div>}</div> : section === "plan" ? <DailyPlanScreen update={update} actions={actions} startCheckIn={startCheckIn} temporary={touring} openHealth={() => showMetric(selectedMetric)} /> : section === "connection" ? <ReportPreview update={update} onExport={actions.recordExport} ship={ship} /> : mode === "ship" ? <ModulesScreen modules={modules} selectedId={selectedModule} onSelect={setSelectedModule} generatedAt={ship.frame.sourceAt ?? ship.frame.at} ship={ship} /> : <section className="health-workspace">
        <div className="measurement-picker"><h1>Health</h1><SelectMenu label="Measurement" value={selectedMetric} options={HEALTH_METRICS.map(meta => {
          const reading = metrics.find(item => item.metric === meta.id);
          return { value: meta.id, label: meta.label, description: reading?.value === null || !reading ? "No current reading" : `${reading.value} ${reading.unit}` };
        })} onChange={value => setSelectedMetric(value as MetricId)} /></div>
        <aside className="measurement-selector" aria-label="Choose a measurement">
          <h1>Health</h1>
          {HEALTH_METRICS.map(meta => {
            const reading = metrics.find(item => item.metric === meta.id);
            return <button type="button" key={meta.id} data-status={reading?.status} aria-pressed={selectedMetric === meta.id} onClick={() => setSelectedMetric(meta.id)}>
              <InterfaceIcon name={meta.icon} /><span>{meta.label}<small>{reading?.value ?? "No data"} {reading?.unit}</small></span>
            </button>;
          })}
        </aside>
        <div className="measurement-workspace">
          {selected && <MetricDetails key={selected.metric + String(update.control.historyDays)} reading={selected} recommendations={recommendations} fallbackAt={generatedAt} onCheckIn={checkIn} onSensorCheck={sensorCheck} />}
        </div>
      </section>}
    </main>
    <p className="site-art-credit">AI-generated background image</p>
    {touring && <GuidedWalkthrough step={tourStep} onStep={changeTourStep} onEnd={() => { closePanel(); onEndTour(); }} />}
    <ChangeNotice ship={ship} update={update} onModule={id=>{setMode("ship");showModule(id);}} onMetric={showMetric} />
    <VoicePanel ship={ship} readings={metrics} onHelp={() => openPanel("assistance")} />
    <AssistancePanel ship={ship} onOpenVoice={() => openPanel("voice")} onOpenModules={() => {closePanel();setMode("ship");setSection("health");}} key={helpEntry.id} initialNode={helpEntry.node} onContinueTour={touring && tourStep === 3 ? () => changeTourStep(4) : undefined} onOpenReport={() => setSection("connection")} />
    <OverlayPanel id="health" title="Health summary">
      <div className="summary-content summary-clean">
        <p className="context-eyebrow">Current simulated snapshot · {utcTime(generatedAt)} UTC</p>
        <h3>{status.title}</h3>
        <p className="summary-coverage">Data coverage: {overall.dataCoverage}. This summary is not a diagnosis.</p>
        <div className="summary-grid">{METRICS.map(meta=>{const r=metrics.find(m=>m.metric===meta.id);return <button className="summary-metric" type="button" key={meta.id} onClick={()=>{showMetric(meta.id);closePanel();}}><InterfaceIcon name={meta.icon}/><span>{meta.label}<strong>{r?.value??"No data"} {r?.value===null?"":r?.unit}</strong></span><InterfaceIcon name="chevron"/></button>;})}</div>
        <Disclosure title="What this status is based on"><ul>{overall.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul><p>Only available simulated measurements are assessed. A reassuring value does not rule out a medical problem.</p></Disclosure>
      </div>    </OverlayPanel>
  </div>;
}
