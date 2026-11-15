import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { DailyPlanRecord, DemoControlState, DemoState, ScenarioId, WellbeingCheckIn } from "@ahm/contracts";
import { InterfaceIcon } from "../../components/InterfaceIcon";
import "../../components/interactions.css";
import "./demo-tools.css";

export interface DemoActions {
  runScenario: (id: ScenarioId) => void;
  pauseScenario: () => void;
  resumeScenario: () => void;
  resetScenario: () => void;
  setDailyMode: (mode: DailyPlanRecord["mode"]) => void;
  saveActiveMinutes: (minutes: number) => void;
  confirmDailyTask: (task: "recovery" | "measurements") => void;
  saveCheckIn: (input: Omit<WellbeingCheckIn, "savedAt">) => void;
  populate: (days: 7 | 30 | 90) => void;
  clear: () => void;
  setState: (state: DemoState) => void;
  recordExport: (recipient: "earth" | "crew") => void;
}
export function DemoTools({ control, actions, onStartTour, touring, shipControls, workspaceMode = "personal" }: { control: DemoControlState; actions: DemoActions; onStartTour: () => void; touring: boolean; shipControls?: ReactNode; workspaceMode?: "personal" | "ship" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [toolView, setToolView] = useState<"personal" | "ship">(workspaceMode);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false); trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className="demo-tools" ref={ref} data-open={open} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button type="button" ref={trigger} className="demo-tools__trigger" aria-expanded={open} aria-controls={panelId} onClick={() => { if(!open)setToolView(workspaceMode); setOpen(!open); }}><InterfaceIcon name="sliders" />Demo tools <InterfaceIcon name="chevron" className="expand-chevron" /></button>
    <div id={panelId} className="demo-tools__panel animated-popover" data-open={open} inert={!open} aria-hidden={!open}>
      <button type="button" className="demo-tools__tour" disabled={touring} onClick={() => { setOpen(false); onStartTour(); }}>Start guided walkthrough</button>
      <p>Temporary demo session. Your saved plans and measurements stay separate.</p>
      <div className="context-tabs" role="group" aria-label="Demo workspace"><button type="button" aria-pressed={toolView==="personal"} onClick={()=>setToolView("personal")}>Personal tools</button><button type="button" aria-pressed={toolView==="ship"} onClick={()=>setToolView("ship")}>Ship tools</button></div>
      {toolView === "personal" ? <>
      <h2>Personal measurements</h2><p>Choose a prepared state or play a changing scenario.</p>
      <h2>Sample history</h2><p>Replaces measurements with daily synthetic samples.</p>
      <div className="demo-tools__days">{([7,30,90] as const).map(days => <button key={days} type="button" disabled={touring} aria-pressed={control.historyDays === days} onClick={() => actions.populate(days)}>Fill {days} days</button>)}</div>
      <h2>Demo state</h2>
      <div className="demo-tools__states">{([
        ["stable", "Stable"], ["check", "Check needed"], ["urgent", "Urgent event"], ["missing", "Missing sensor"],
      ] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={control.demoState === id} disabled={touring || control.historyDays === 0} onClick={() => actions.setState(id)}>{label}</button>)}</div>
      <h2>Scenario playback</h2>
      <div className="demo-tools__states">{([["DEMO-01","Nominal shift"],["DEMO-02","Escalating event"],["DEMO-03","Signal loss"]] as const).map(([id,label])=><button type="button" key={id} disabled={touring} aria-pressed={control.scenarioId===id&&control.runState!=="idle"} onClick={()=>actions.runScenario(id)}>{label}</button>)}</div>
      <div className="demo-playback"><button type="button" disabled={touring||control.runState!=="running"} onClick={actions.pauseScenario}>Pause</button><button type="button" disabled={touring||control.runState!=="paused"} onClick={actions.resumeScenario}>Resume</button><button type="button" disabled={touring} onClick={actions.resetScenario}>Reset</button></div>
      <p>Playback: {control.runState} · {control.scenarioClock} · synthetic time ×{control.speedFactor}</p>
      </> : shipControls}
      <button type="button" className="demo-tools__clear" disabled={touring} onClick={actions.clear}>Clear demo data</button>
      <p>{touring ? "Walkthrough data is temporary. Finish or exit to return to your own session." : "Measurements reset on reload. Daily plans and check-ins are saved in this browser. Clear demo data removes measurements, daily plans, personal notes and the incident timeline."}</p>
    </div>
  </div>;
}
