import type { MetricReading } from "@ahm/contracts";
import { useEffect, useRef, useState } from 'react';
import { shipFrame, type ShipEvent, type VoiceNote, type TelemetryScenario } from './telemetry';
const KEY='ahm-ship-notes-v1';
const EVENT_KEY='ahm-ship-events-v1';
function readEvents():ShipEvent[]{try{const e=JSON.parse(localStorage.getItem(EVENT_KEY)??'[]');return Array.isArray(e)?e.filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string'&&Number.isFinite(Date.parse(x.at))).slice(0,300):[];}catch{return [];}}
function readNotes(): VoiceNote[] { try { const n=JSON.parse(localStorage.getItem(KEY)??'[]'); return Array.isArray(n)?n.filter(x=>x&&typeof x.text==='string'&&x.text.length<=2000&&typeof x.at==='string'&&x.person==='Alex'&&Array.isArray(x.recentPresence)).slice(0,100):[]; } catch {return [];} }
export function useShipTelemetry(temporary: boolean) {
 const [scenario,setScenarioState]=useState<TelemetryScenario>('nominal');
 const [running,setRunning]=useState(true);
 const tick=useRef(0);
 const [frame,setFrame]=useState(()=>shipFrame(Date.now(),0,'nominal'));
 const [events,setEvents]=useState<ShipEvent[]>(()=>temporary?[]:readEvents());
 const [notes,setNotes]=useState<VoiceNote[]>(()=>temporary?[]:readNotes());
 const [storageError,setStorageError]=useState(false);
 const previous=useRef<typeof frame | null>(null);
 const addEvents=(next:ShipEvent[])=>setEvents(old=>[...next,...old].slice(0,300));
 useEffect(()=>{ if(!running)return; const timer=window.setInterval(()=>{tick.current++;setFrame(shipFrame(Date.now(),tick.current,scenario));},5000);return()=>clearInterval(timer);},[running,scenario]);
 useEffect(()=>{
  const old=previous.current; if(old===frame)return; previous.current=frame;
  const next:ShipEvent[]=[];
  if(frame.locationQuality==='fresh') Object.keys(frame.positions).forEach(person=>{ if(!old||old.locationQuality!=='fresh'||frame.positions[person]!==old.positions[person])next.push({id:crypto.randomUUID(),at:frame.at,kind:'movement',person,moduleId:frame.positions[person],text:`${person} entered ${frame.positions[person]} (simulated positioning).`}); });
  if(frame.environmentQuality==='fresh'&&tick.current%3===0) frame.modules.forEach(m=>next.push({id:crypto.randomUUID(),at:frame.at,kind:'measurement',moduleId:m.id,scenario,text:m.name+' sample: ppCO2 '+m.co2.toFixed(2)+' mmHg, '+m.temperature+' °C, '+m.humidity+'% RH (synthetic).',conditions:{co2:m.co2,temperature:m.temperature,humidity:m.humidity}}));
  if(next.length)addEvents(next);
 },[frame]);
 // Pausing or browser throttling must age the last sample, rather than keeping a green label.
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),5000);return()=>clearInterval(timer);},[]);
 const environmentQuality=frame.environmentQuality==='fresh'&&now-Date.parse(frame.at)>30000?'stale':frame.environmentQuality;
 const locationQuality=frame.locationQuality==='fresh'&&now-Date.parse(frame.at)>30000?'stale':frame.locationQuality;
 useEffect(()=>{if(temporary)return;try{localStorage.setItem(KEY,JSON.stringify(notes));localStorage.setItem(EVENT_KEY,JSON.stringify(events));setStorageError(false);}catch{setStorageError(true);}},[notes,events,temporary]);
 const setScenario=(value:TelemetryScenario)=>{
  setScenarioState(value);tick.current=0;setFrame(shipFrame(Date.now(),0,value));
  const at=new Date().toISOString();
  const next:ShipEvent[]=[{id:crypto.randomUUID(),at,kind:'scenario',text:`Demo scenario changed to ${value}.`}];
  if(value==='environment')next.push({id:crypto.randomUUID(),at,kind:'complaint',person:'Sam',moduleId:'habitat-a',synthetic:true,text:'Synthetic crew report: Sam reports a headache while working in Habitat A.'});
  addEvents(next);
 };
 const saveNote=(text:string,input:'voice'|'text',readings:MetricReading[]=[])=>{
  if(!text.trim())return;
  const moduleId=locationQuality==='fresh'?frame.positions.Alex!:null;
  const m=frame.modules.find(x=>x.id===moduleId);
  const at=new Date().toISOString();
  const note:VoiceNote={id:crypto.randomUUID(),at,person:'Alex',text:text.trim().slice(0,2000),input,moduleId,locationQuality,environmentQuality,scenario,readings:readings.map(({trend,...r})=>r),conditions:environmentQuality==='fresh'&&m?{co2:m.co2,temperature:m.temperature,humidity:m.humidity}:null,recentPresence:events.filter(e=>e.kind==='movement'&&e.person==='Alex'&&Date.parse(at)-Date.parse(e.at)<=1800000).slice(0,12),sharedReports:events.filter(e=>e.synthetic&&e.kind==='complaint'&&e.moduleId===moduleId&&Date.parse(at)-Date.parse(e.at)<=1800000).slice(0,10)};
  setNotes(old=>[note,...old].slice(0,100));addEvents([{id:note.id,at,kind:'complaint',person:'Alex',moduleId:moduleId??undefined,text:note.text}]);
 };
 const confirmAction=(text:string)=>addEvents([{id:crypto.randomUUID(),at:new Date().toISOString(),kind:'action',person:'Alex',text}]);
 const clear=()=>{setNotes([]);setEvents([]);setRunning(false);setScenarioState('nominal');tick.current=0;const empty=shipFrame(Date.now(),0,'missing');setFrame({...empty,locationQuality:'missing',positions:{},modules:empty.modules.map(m=>({...m,crew:[]}))});};
 return {frame:{...frame,environmentQuality,locationQuality,modules:frame.modules.map(m=>({...m,locationQuality,state:environmentQuality!=='fresh'?'unavailable' as const:m.state,crew:locationQuality==='fresh'?m.crew:[]}))},scenario,setScenario,running,setRunning,events,notes,saveNote,confirmAction,clear,storageError};
}
export type ShipController=ReturnType<typeof useShipTelemetry>;
