import { useEffect, useId, useRef, useState } from "react";
import type { DailyPlanRecord, DemoControlState, DemoState, WellbeingCheckIn } from "@ahm/contracts";
import { InterfaceIcon } from "../../components/InterfaceIcon";
import "../../components/interactions.css";
import "./demo-tools.css";

export interface DemoActions {
  setDailyMode: (mode: DailyPlanRecord["mode"]) => void;
  saveActiveMinutes: (minutes: number) => void;
  confirmDailyTask: (task: "recovery" | "measurements") => void;
  saveCheckIn: (input: Omit<WellbeingCheckIn, "savedAt">) => void;
  populate: (days: 7 | 30 | 90) => void;
  clear: () => void;
  setState: (state: DemoState) => void;
  recordExport: (recipient: "earth" | "crew") => void;
}
export function DemoTools({ control, actions, onStartTour, touring }: { control: DemoControlState; actions: DemoActions; onStartTour: () => void; touring: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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
  return <div className="demo-tools" ref={ref} data-open={open} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button type="button" ref={trigger} className="demo-tools__trigger" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}><InterfaceIcon name="sliders" />Demo tools <InterfaceIcon name="chevron" className="expand-chevron" /></button>
    <div id={panelId} className="demo-tools__panel animated-popover" data-open={open} inert={!open} aria-hidden={!open}>
      <button type="button" className="demo-tools__tour" disabled={touring} onClick={() => { setOpen(false); onStartTour(); }}>Start guided walkthrough</button>
      <p>Temporary demo session. Your saved plans and measurements stay separate.</p>
      <h2>Sample history</h2><p>Replaces measurements with daily synthetic samples.</p>
      <div className="demo-tools__days">{([7,30,90] as const).map(days => <button key={days} type="button" disabled={touring} aria-pressed={control.historyDays === days} onClick={() => actions.populate(days)}>Fill {days} days</button>)}</div>
      <h2>Demo state</h2>
      <div className="demo-tools__states">{([
        ["stable", "Stable"], ["check", "Check needed"], ["urgent", "Urgent event"], ["missing", "Missing sensor"],
      ] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={control.demoState === id} disabled={touring || control.historyDays === 0} onClick={() => actions.setState(id)}>{label}</button>)}</div>
      <button type="button" className="demo-tools__clear" disabled={touring} onClick={actions.clear}>Clear demo data</button>
      <p>{touring ? "Walkthrough data is temporary. Finish or exit to return to your own session." : "Measurements reset on reload. Daily plans and check-ins are saved in this browser. Clear demo data removes both."}</p>
    </div>
  </div>;
}
