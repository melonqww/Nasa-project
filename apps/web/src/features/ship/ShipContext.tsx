import type { ShipController } from './useShipTelemetry';
import { explainContext } from './telemetry';
export function ShipContext({ship,onVoice,onModules,onReport}:{ship:ShipController;onVoice:()=>void;onModules:()=>void;onReport:()=>void}) {
 const note=ship.notes[0];
 const context=note?explainContext(note):null;
 const location=ship.frame.locationQuality==='fresh'?ship.frame.positions.Alex:'Unknown';
 return <section className="assistant-context">
  <h3>Your available context</h3><p className="context-eyebrow">Alex · prepared local assistant · simulated ship adapter</p>
  <dl><div><dt>Current module</dt><dd>{location}</dd></div><div><dt>Position source</dt><dd>{ship.frame.locationQuality}</dd></div><div><dt>Environment source</dt><dd>{ship.frame.environmentQuality}</dd></div></dl>
  {ship.frame.environmentQuality!=='fresh'&&<p className="context-caution">Current module conditions cannot be confirmed. Missing or stale readings are not evidence that conditions are normal.</p>}
  {note&&context?<><h4>Latest confirmed note</h4><p className="assistant-context__note">{note.text}</p><p className="context-eyebrow">{new Date(note.at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC · {note.moduleId??'Location unknown at check-in'}</p><h4>{context.title}</h4><p>{context.explanation}</p><details><summary>Evidence and missing information</summary><strong>Recorded evidence</strong><ul>{context.evidence.map(e=><li key={e}>{e}</li>)}</ul><strong>Still needed</strong><ul>{context.missing.map(e=><li key={e}>{e}</li>)}</ul></details></>:<p>No personal check-in is recorded. A note can preserve your symptoms, timing and the available module conditions for review.</p>}
  <div className="assistance__actions"><button type="button" onClick={onVoice}>{note?'Add a personal check-in':'Record how you feel'}</button><button type="button" onClick={onModules}>Review module conditions</button><button type="button" onClick={onReport}>Prepare an incident report</button><button type="button" onClick={()=>ship.confirmAction('Confirmed by Alex: available context reviewed with crew.')}>Confirm: reviewed with crew</button></div>
  <p className="voice-privacy">A confirmation records your statement only. This assistant does not contact crew, send a report, identify medical causes or control life support.</p>
 </section>;
}
