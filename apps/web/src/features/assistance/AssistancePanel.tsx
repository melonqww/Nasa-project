import { ShipContext } from "../ship/ShipContext";
import type { ShipController } from "../ship/useShipTelemetry";
import { useEffect, useRef, useState } from "react";
import { OverlayPanel, useOverlayController } from "../../components/overlays";
import { Disclosure } from "../../components/Disclosure";
import { GUIDANCE_FLOW, GUIDANCE_SOURCES, GUIDANCE_VERSION } from "./guidanceFlow";
import "./assistance.css";

interface Turn { node: string; answer?: string }
export function AssistancePanel({ onOpenReport, initialNode = "start", onContinueTour, ship, onOpenVoice, onOpenModules }: { onOpenReport: () => void; initialNode?: "start" | "sensor"; onContinueTour?: () => void; ship: ShipController; onOpenVoice: () => void; onOpenModules: () => void }) {
  const [view, setView] = useState<"guidance" | "context">("guidance");
  const [turns, setTurns] = useState<Turn[]>([{ node: initialNode }]);
  const { isOpen, closePanel } = useOverlayController();
  const open = isOpen("assistance");
  const latest = useRef<HTMLDivElement>(null);
  const current = GUIDANCE_FLOW[turns.at(-1)!.node]!;
  useEffect(() => {
    if (open && turns.length > 1) {
      latest.current?.focus({ preventScroll: true });
      latest.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, [turns, open]);
  return <OverlayPanel id="assistance" title="Crew assistance">
    <div className="assistance">
      <div className="context-tabs" role="group" aria-label="Assistance view"><button type="button" aria-pressed={view === "guidance"} onClick={()=>setView("guidance")}>Step-by-step help</button><button type="button" aria-pressed={view === "context"} onClick={()=>setView("context")}>Ship context</button></div>
      {view === "context" ? <ShipContext ship={ship} onVoice={onOpenVoice} onModules={onOpenModules} onReport={()=>{closePanel();onOpenReport();}} /> : <>
      <p className="assistance__scope">Prepared guidance · onboard demo. No approved flight emergency checklist is loaded. This chat does not contact anyone.</p>
      <div className="assistance__conversation" aria-label="Assistance conversation">
        {turns.map((turn, index) => {
          const node = GUIDANCE_FLOW[turn.node]!;
          return <div key={`${index}-${turn.node}`} className="assistance__turn" tabIndex={-1} ref={index === turns.length - 1 ? latest : undefined}>
            {turn.answer && <p className="assistance__answer">{turn.answer}</p>}
            <article className="assistance__message" data-urgent={node.urgent}>
              <span className="assistance__speaker">{node.urgent ? "Urgent crew assistance" : "Assistance guide"}</span>
              {node.body.map(text => <p key={text}>{text}</p>)}
              {node.question && <h3>{node.question}</h3>}
              <div className="assistance__sources">{node.sources.map(key => <a key={key} href={GUIDANCE_SOURCES[key].url} target="_blank" rel="noreferrer">{GUIDANCE_SOURCES[key].label}</a>)}</div>
            </article>
          </div>;
        })}
      </div>
      <div className="assistance__actions" aria-label="Quick replies" key={turns.at(-1)!.node}>
        {current.choices?.map(choice => <button key={choice.label} type="button" onClick={() => setTurns(previous => [...previous, { node: choice.next, answer: choice.label }])}>{choice.label}</button>)}
      </div>
      <p className="sr-only" role="status">{current.body[0]} {current.question}</p>
      {!current.choices && <p className="assistance__end" role="status">End of this prepared branch. Continue with the crew medical team when assistance is needed.</p>}
      <div className="assistance__controls">
        {onContinueTour && <button type="button" onClick={onContinueTour}>Continue walkthrough</button>}
        {turns.length > 1 && <button type="button" onClick={() => setTurns(previous => previous.slice(0, -1))}>Previous question</button>}
        {turns.length > 1 && <button type="button" onClick={() => setTurns([{ node: "start" }])}>Start again</button>}
        <button type="button" onClick={() => { closePanel(); onOpenReport(); }}>Open report settings</button>
      </div>
      </>}
      <Disclosure title="Sources and scope" className="assistance__details">
        <p>Version {GUIDANCE_VERSION}. Public sources checked on 14 Nov 2026. These prepared branches have not been reviewed or approved by a flight medical team.</p>
        <p>General first-aid sources inform the questions. NASA sources provide mission context, not approval of this chat. Microgravity care requires trained crew and mission-specific procedures.</p>
        <p>Replies describe what the user reports. They do not detect unconsciousness, connect equipment, notify crew or add observations to the health record. Closing this panel retains the conversation until the page reloads.</p>
      </Disclosure>
    </div>
  </OverlayPanel>;
}
