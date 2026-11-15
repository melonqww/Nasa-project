import type { HealthUpdate, HealthEvent } from '@ahm/contracts';
import { explainContext, type ShipEvent } from './telemetry';
import type { ShipController } from './useShipTelemetry';
export function IncidentTimeline({ship,update}:{ship:ShipController;update:HealthUpdate}) {
 const health: ShipEvent[]=update.events.map(e=>({id:e.id,at:e.at,kind:'measurement',text:`${e.title}: ${e.detail}`}));
 const notes: ShipEvent[]=ship.notes.map(n=>({id:n.id,at:n.at,kind:'complaint',text:n.text,person:n.person,moduleId:n.moduleId??undefined}));
 const all=[...new Map([...ship.events,...notes,...health].map(e=>[e.id,e])).values()].sort((a,b)=>b.at.localeCompare(a.at));
 return <section className="incident-timeline"><h2>Incident timeline</h2><p>UTC · simulated movements and measurements, confirmed personal notes and actions. No automatic diagnosis.</p><div className="voice-controls"><button type="button" onClick={()=>ship.confirmAction('Confirmed: reviewed available telemetry with crew.')}>Confirm crew review completed</button></div><ol>{all.slice(0,60).map(e=><li key={e.id}><time>{new Date(e.at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</time><span>{e.kind}{e.person?` · ${e.person}`:''}</span><p>{e.text}</p></li>)}</ol>{!all.length&&<p>No entries yet. Start the simulator or confirm a check-in.</p>}</section>;
}
export function buildShipReport(ship:ShipController,includeNotes:boolean,healthEvents:HealthEvent[]=[]) {
 return {synthetic:true,source:'Simulated read-only ship adapter; no hardware connected',snapshot:{...ship.frame,positions:ship.frame.locationQuality==="fresh"?ship.frame.positions:null,modules:ship.frame.modules.map(m=>({...m,crew:ship.frame.locationQuality==="fresh"?m.crew:null,co2:ship.frame.environmentQuality==="fresh"?m.co2:null,temperature:ship.frame.environmentQuality==="fresh"?m.temperature:null,humidity:ship.frame.environmentQuality==="fresh"?m.humidity:null}))},scenario:ship.scenario,
 timeline:[...ship.events.filter(e=>includeNotes||e.kind!=='complaint'),...healthEvents.map(e=>({id:e.id,at:e.at,kind:e.kind,text:e.title+': '+e.detail}))].sort((a,b)=>a.at.localeCompare(b.at)),
 ...(includeNotes?{personalCheckIns:ship.notes,contextSummaries:ship.notes.map(note=>({noteId:note.id,...explainContext(note)}))}:{}),
 limitations:['Temporal associations do not establish causation or a diagnosis.','Crew positions and conditions are simulated.','Missing or stale data does not establish safety.']};
}
