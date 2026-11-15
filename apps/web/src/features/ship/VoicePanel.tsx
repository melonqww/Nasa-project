import { useEffect, useRef, useState } from 'react';
import type { MetricReading } from '@ahm/contracts';
import { OverlayPanel, useOverlayController } from '../../components/overlays';
import { InterfaceIcon } from '../../components/InterfaceIcon';
import { Disclosure } from '../../components/Disclosure';
import { explainContext } from './telemetry';
import type { ShipController } from './useShipTelemetry';
interface Recognition {
 lang: string; continuous: boolean; interimResults: boolean;
 onresult: ((e: {results: ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;
 onerror: ((e: {error:string})=>void)|null; onend: (()=>void)|null;
 start: ()=>void; stop: ()=>void; abort: ()=>void;
}
function recognitionConstructor() {
 const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
 return w.SpeechRecognition??w.webkitSpeechRecognition;
}
export function VoicePanel({ship,onHelp,readings}:{ship:ShipController;onHelp:()=>void;readings:MetricReading[]}) {
 const {isOpen}=useOverlayController();
 const open=isOpen('voice');
 const [tab,setTab]=useState<'new'|'history'>('new');
 const [text,setText]=useState('');
 const [input,setInput]=useState<'voice'|'text'>('text');
 const [recording,setRecording]=useState(false);
 const [message,setMessage]=useState('');
 const [lang]=useState(()=>navigator.languages.find(code=>/^(ru|en|kk)(-|$)/i.test(code))??navigator.language??'en-US');
 const recorder=useRef<Recognition|null>(null);
 const supported=!!recognitionConstructor();
 useEffect(()=>{
  if(!open){recorder.current?.abort();recorder.current=null;setRecording(false);}
  return()=>{recorder.current?.abort();};
 },[open]);
 const start=()=>{
  const Constructor=recognitionConstructor();if(!Constructor)return;
  const r=new Constructor();recorder.current=r;r.lang=lang;r.continuous=false;r.interimResults=false;
  r.onresult=e=>{
   setText(Array.from(e.results).map(x=>x[0]?.transcript??'').join(' ').slice(0,2000));
   setInput('voice');setMessage('Review the transcript, then confirm to save.');
  };
  r.onerror=e=>{setRecording(false);setMessage(e.error==='not-allowed'?'Microphone permission denied. You can type below.':`Dictation unavailable (${e.error}). You can type below.`);};
  r.onend=()=>setRecording(false);
  try{r.start();setRecording(true);setMessage('Listening…');}
  catch{setRecording(false);setMessage('Dictation is unavailable. Please type below.');}
 };
 return <OverlayPanel id="voice" title="Personal check-ins">
  <div className="voice-content">
   <div className="context-tabs" role="group" aria-label="Check-in view">
    <button type="button" aria-pressed={tab==='new'} onClick={()=>setTab('new')}>New check-in</button>
    <button type="button" aria-pressed={tab==='history'} disabled={recording} onClick={()=>setTab('history')}>History · {ship.notes.length}</button>
   </div>
   {tab==='new'?<>
    <p className="context-eyebrow">Alex · personal demo profile</p>
    <h3>How are you feeling?</h3>
    <div className="voice-record"><button type="button" className="voice-record__button" disabled={!supported} aria-pressed={recording} onClick={()=>recording?recorder.current?.stop():start()}><InterfaceIcon name="mic"/>{recording?'Stop dictation':'Start dictation'}</button><span>Automatic browser language · {lang}</span></div>
    <p className="voice-privacy">Dictation may use your browser provider’s online service. {!supported&&'Unavailable here; type below.'}</p>
    <label className="voice-draft">Your note<textarea maxLength={2000} value={text} disabled={recording} onChange={e=>{setText(e.target.value);setInput('text');setMessage('');}} placeholder="What do you feel? When did it start?"/></label>
    <div className="voice-controls"><button type="button" disabled={recording||!text.trim()} onClick={()=>{ship.saveNote(text,input,readings);setText('');setMessage('Confirmed note saved with its context.');}}>Confirm and save</button><button type="button" onClick={onHelp}>Need help?</button></div>
    <p role="status">{message}</p>
    <Disclosure title="Privacy and how it works"><p>Optional browser dictation may send audio to the browser provider and require internet. Only confirmed text is saved by this app, never audio. Language follows browser settings; automatic identification of any spoken language is not guaranteed.</p><p>The context assistant uses prepared local rules, without a diagnostic AI model. Notes stay on this device and are included in a report only if you choose. Up to 100 check-ins are retained. {ship.storageError&&'Browser storage is unavailable: notes last for this session only.'}</p></Disclosure>
   </>:<>
    {!ship.notes.length&&<p>No confirmed notes yet.</p>}
    {ship.notes.map(note=>{
     const context=explainContext(note);
     return <article className="voice-note" key={note.id}>
      <time>{new Date(note.at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</time><p>{note.text}</p><span>{note.input==='voice'?'Dictated transcript':'Typed note'} · {note.moduleId??'Location unknown'}</span>
      <Disclosure title="Context and possible connections"><h4>{context.title}</h4><p>{context.explanation}</p><strong>Available evidence</strong><ul>{context.evidence.map(x=><li key={x}>{x}</li>)}</ul><strong>Still needed</strong><ul>{context.missing.map(x=><li key={x}>{x}</li>)}</ul></Disclosure>
     </article>;
    })}
   </>}
  </div>
 </OverlayPanel>;
}
