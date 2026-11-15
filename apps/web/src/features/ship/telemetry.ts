import type { MetricReading } from '@ahm/contracts';
import { createModuleSnapshot, type ModuleId, type ShipModule } from './shipData';
export type TelemetryScenario = 'nominal' | 'environment' | 'stale' | 'missing' | 'location' | 'thermal' | 'urgent' | 'offline';
export type Quality = 'fresh' | 'stale' | 'missing';
export interface ShipEvent { id: string; at: string; kind: 'movement' | 'measurement' | 'complaint' | 'action' | 'scenario'; text: string; moduleId?: ModuleId; person?: string; conditions?: {co2:number;temperature:number;humidity:number}; scenario?: TelemetryScenario; synthetic?: boolean }
export interface VoiceNote { id: string; at: string; person: 'Alex'; text: string; input: 'voice' | 'text'; moduleId: ModuleId | null; locationQuality: Quality; environmentQuality: Quality; conditions: {co2: number; temperature: number; humidity: number} | null; recentPresence: ShipEvent[]; scenario?: TelemetryScenario; readings?: Omit<MetricReading,'trend'>[]; sharedReports?: ShipEvent[] }
export interface ShipFrame { at: string; modules: ShipModule[]; environmentQuality: Quality; locationQuality: Quality; sourceAt: string | null; positions: Record<string, ModuleId> }
export const SCENARIO_LABELS: Record<TelemetryScenario,string> = { nominal:'Routine movement', environment:'Module environment change', stale:'Stale environment feed', missing:'Environment feed lost', location:'Position feed lost', thermal:'Laboratory climate change', urgent:'Module attention event', offline:'All ship feeds offline' };
export function qualityAt(at: string | null, now: number): Quality { return !at || !Number.isFinite(Date.parse(at)) ? 'missing' : now-Date.parse(at)>30000 ? 'stale' : 'fresh'; }
export function shipFrame(now: number, tick: number, scenario: TelemetryScenario): ShipFrame {
 const at=new Date(now).toISOString();
 const sourceAt=scenario==='missing'||scenario==='offline'?null:new Date(now-(scenario==='stale'?120000:0)).toISOString();
 const environmentQuality=qualityAt(sourceAt,now);
 const locationQuality: Quality=scenario==='location'||scenario==='offline'?'missing':'fresh';
 const route: ModuleId[]=['habitat-a','laboratory','exercise','habitat-b','command','medical'];
 const positions: Record<string,ModuleId>={Alex:route[Math.floor(tick/3)%route.length]!,Sam:route[(Math.floor(tick/4)+1)%route.length]!,Dana:'command'};
 if(scenario==='environment'&&tick<3)positions.Sam='habitat-a';
 const modules=createModuleSnapshot('stable',true).map((m,i)=>({...m, crew:locationQuality==='fresh'?Object.keys(positions).filter(p=>positions[p]===m.id):[],
 co2: Math.round((m.co2+Math.sin(tick*.3+i)*.08+((scenario==='environment'||scenario==='urgent')&&m.id==='habitat-a'?(scenario==='urgent'?2.1:1.2):0))*100)/100,
 temperature:Math.round((m.temperature+Math.sin(tick*.2+i)*.2+(scenario==='thermal'&&m.id==='laboratory'?3.2:0))*10)/10,
 humidity:scenario==='thermal'&&m.id==='laboratory'?62:m.humidity,
 state:environmentQuality!=='fresh'?'unavailable':scenario==='urgent'&&m.id==='habitat-a'?'attention':((scenario==='environment'&&m.id==='habitat-a')||(scenario==='thermal'&&m.id==='laboratory'))?'review':'nominal'} as ShipModule));
 return {at,modules,environmentQuality,locationQuality,sourceAt,positions};
}
export function explainContext(note: VoiceNote) {
 const evidence=[`Confirmed self-report at ${note.at}.`, note.moduleId?`Simulated position: ${note.moduleId}.`:'Position was not available.'];
 const missing=['Symptom onset time and duration are not established.','No clinical examination or verified spacecraft telemetry is available.'];
 if(note.environmentQuality!=='fresh') missing.push('Fresh environmental readings are missing; conditions cannot be assessed.');
 if(note.locationQuality!=='fresh') missing.push('Current location is unknown; a module association cannot be established.');
 const previous=note.recentPresence.filter(e=>e.moduleId==='habitat-a');
 const raised=note.scenario==='environment'&&note.moduleId==='habitat-a'&&note.environmentQuality==='fresh';
 if(note.conditions) evidence.push(`Recorded cabin ppCO₂ ${note.conditions.co2.toFixed(2)} mmHg, ${note.conditions.temperature} °C, ${note.conditions.humidity}% RH. These are synthetic samples.`);
 if(note.readings?.length) evidence.push(`${note.readings.filter(r=>r.value!==null).length} personal measurements were captured, each with its own source and timestamp.`);
 if(note.sharedReports?.length) evidence.push('Another synthetic crew report was recorded in the same module within the previous 30 minutes. This does not prove a shared medical cause.');
 if(previous.length) evidence.push('The demo presence history includes Habitat A.');
 return {title:raised&&note.environmentQuality==='fresh'?'Self-report overlaps a prepared environment-change scenario':'Context recorded; no cause established', evidence, missing,
 explanation:raised?'The report and a simulated change in cabin conditions occurred together. This is a temporal association, not proof of exposure or a diagnosis. The value is not a validated medical threshold.':'A personal report alone does not establish a connection to the environment. Other causes and missing information must be considered.'};
}
