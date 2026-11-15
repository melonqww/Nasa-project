import { useEffect, useRef, useState } from 'react';
import type { HealthUpdate, MetricId } from '@ahm/contracts';
import type { ModuleId } from './shipData';
import type { ShipController } from './useShipTelemetry';
import { SCENARIO_LABELS } from './telemetry';
interface Notice {title:string;body:string;severity:'info'|'review'|'attention';module?:ModuleId;metric?:MetricId}
export function ChangeNotice({ship,update,onModule,onMetric}:{ship:ShipController;update:HealthUpdate;onModule:(id:ModuleId)=>void;onMetric:(id:MetricId)=>void}) {
 const [notice,setNotice]=useState<Notice|null>(null);
 const previous=useRef({scenario:ship.scenario,quality:ship.frame.environmentQuality,state:update.snapshot.overall.state,demo:update.control.demoState});
 useEffect(()=>{
  const old=previous.current;
  const next={scenario:ship.scenario,quality:ship.frame.environmentQuality,state:update.snapshot.overall.state,demo:update.control.demoState};
  previous.current=next;
  if(old.scenario!==next.scenario||old.quality!==next.quality){
   const module=next.scenario==='thermal'?'laboratory':next.scenario==='environment'||next.scenario==='urgent'?'habitat-a':'command';
   setNotice({title:next.scenario==='thermal'?'Laboratory · climate review':next.scenario==='environment'?'Habitat A · environment changed':next.scenario==='urgent'?'Habitat A · attention requested':'Ship · telemetry updated',body:SCENARIO_LABELS[next.scenario]+'. Synthetic scenario; review the available source data.',severity:next.scenario==='urgent'?'attention':next.scenario==='nominal'&&next.quality==='fresh'?'info':'review',module});
  }else if(old.state!==next.state||old.demo!==next.demo){
   const reading=update.snapshot.metrics.find(m=>m.status==='alert')??update.snapshot.metrics.find(m=>m.status==='watch')??update.snapshot.metrics.find(m=>m.metric==='spo2'&&m.value===null);
   setNotice({title:reading?`Personal · ${reading.label}`:'Personal · scenario updated',body:next.state==='assist'?'Simulated urgent event. Open crew assistance and review the flagged measurements.':next.state==='insufficient'?'Some personal measurements are unavailable. Missing data does not confirm a normal condition.':next.state==='check'?'A prepared demo measurement needs review.':'Personal demo status has been updated.',severity:next.state==='assist'?'attention':next.state==='clear'?'info':'review',metric:reading?.metric??'heartRate'});
  }
 },[ship.scenario,ship.frame.environmentQuality,update.snapshot.overall.state,update.control.demoState]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),8000);return()=>clearTimeout(timer);},[notice]);
 if(!notice)return null;
 return <aside className="change-notice" data-severity={notice.severity} aria-live="polite" aria-atomic="true"><button type="button" className="change-notice__dismiss" aria-label="Dismiss notification" onClick={()=>setNotice(null)}>×</button><strong>{notice.title}</strong><p>{notice.body}</p><button type="button" className="change-notice__open" onClick={()=>{if(notice.module)onModule(notice.module);else if(notice.metric)onMetric(notice.metric);setNotice(null);}}>Review details →</button></aside>;
}
