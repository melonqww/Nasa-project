import { useEffect, useRef, useState, type FormEvent } from "react";
import type { DailyPlanRecord, HealthUpdate, WellbeingCheckIn } from "@ahm/contracts";
import { InterfaceIcon } from "../../components/InterfaceIcon";
import { DEMO_ACTIVITY_GOAL, emptyPlan, planProgress } from "../../services/demo/dailyPlan";
import type { DemoActions } from "../demo-control/DemoTools";
import "./daily-plan.css";

const DAY = 86400000;
const displayDate = (date: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
function CheckInForm({ initial, onSave, onCancel }: { initial: WellbeingCheckIn | null; onSave: (input: Omit<WellbeingCheckIn, "savedAt">) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState<number | null>(initial?.energy ?? null);
  const [reflection, setReflection] = useState(initial?.reflection ?? "");
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const submit = (event: FormEvent) => { event.preventDefault(); if (step === 2 && energy !== null && rating !== null) onSave({ energy, reflection, rating }); };
  return <form className="check-in" onSubmit={submit}>
    <p className="check-in__step">Question {step + 1} of 3 · today</p>
    <div className="check-in__question" key={step}>{step === 0 ? <fieldset><legend>How was your energy today?</legend><div className="check-in__ratings" role="group" aria-label="Energy rating">
      {[1,2,3,4,5].map(value => <button key={value} type="button" aria-pressed={energy === value} onClick={() => setEnergy(value)}>{value}</button>)}
    </div><p className="check-in__scale"><span>Very low</span><span>Very high</span></p></fieldset> : step === 1 ? <div>
      <label htmlFor="check-in-note">What went well or felt difficult today?</label><textarea id="check-in-note" rows={3} maxLength={400} value={reflection} onChange={event => setReflection(event.target.value)} placeholder="A short note, if you want to add one" />
      <p className="check-in__step">Optional · {reflection.length}/400</p>
    </div> : <fieldset><legend>How would you rate your overall wellbeing today?</legend><div className="check-in__ratings check-in__ratings--ten" role="group" aria-label="Wellbeing rating">
      {[1,2,3,4,5,6,7,8,9,10].map(value => <button key={value} type="button" aria-pressed={rating === value} onClick={() => setRating(value)}>{value}</button>)}
    </div><p className="check-in__scale"><span>Very poor</span><span>Very good</span></p><p>Your own rating is saved to Health for today. Energy and notes do not generate a diagnosis.</p></fieldset>}</div>
    <div className="daily-plan__buttons">
      {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}
      {step < 2 ? <button type="button" className="daily-plan__primary" disabled={step === 0 && energy === null} onClick={() => setStep(step + 1)}>Continue</button> : <button type="submit" className="daily-plan__primary" disabled={rating === null}>Save today's check-in</button>}
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  </form>;
}

function TaskStatus({ done }: { done: boolean }) { return <span className="daily-task__status" data-done={done}>{done ? <><InterfaceIcon name="check" />Done</> : "To do"}</span>; }

function TodayTasks({ record, actions, urgent, openHealth, startCheckIn }: { record: DailyPlanRecord; actions: DemoActions; urgent: boolean; openHealth: () => void; startCheckIn: boolean }) {
  const [minutes, setMinutes] = useState(String(record.activeMinutes ?? ""));
  const [editingCheckIn, setEditingCheckIn] = useState(startCheckIn);
  const checkInRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!startCheckIn) return;
    const frame = requestAnimationFrame(() => checkInRef.current?.scrollIntoView({ block:"start", behavior:"instant" }));
    return () => cancelAnimationFrame(frame);
  }, [startCheckIn]);
  useEffect(() => setMinutes(String(record.activeMinutes ?? "")), [record.activeMinutes]);
  const activityDone = record.mode === "activity" ? (record.activeMinutes ?? 0) >= DEMO_ACTIVITY_GOAL : record.recoveryConfirmed;
  return <div className="daily-plan__tasks">
    <article className="daily-task">
      <header><div><InterfaceIcon name="activity" /><h2>{record.mode === "activity" ? "Your activity plan" : "Review your recovery plan"}</h2></div><TaskStatus done={activityDone} /></header>
      {record.mode === "activity" ? <>
        <p>Demo goal: {DEMO_ACTIVITY_GOAL} active minutes. Record the minutes you want to use for this demonstration.</p>
        <div className="daily-task__activity"><strong>{record.activeMinutes ?? 0}<small> / {DEMO_ACTIVITY_GOAL} min</small></strong><progress max={DEMO_ACTIVITY_GOAL} value={Math.min(record.activeMinutes ?? 0, DEMO_ACTIVITY_GOAL)} aria-label="Activity goal progress" /></div>
        <form onSubmit={event => { event.preventDefault(); if (minutes.trim() !== "") actions.saveActiveMinutes(Number(minutes)); }} className="daily-task__minutes">
          <label>Active minutes<input type="number" min={0} max={1440} step={1} required value={minutes} disabled={urgent} onChange={event => setMinutes(event.target.value)} /></label><button type="submit" disabled={urgent}>Save minutes</button>
        </form>
        {urgent && <p className="daily-plan__notice">Activity tracking is paused during the urgent demo. Use crew assistance.</p>}
      </> : <><p>Review the recovery schedule assigned by your crew medical team. This demo day has no activity target.</p><button type="button" disabled={record.recoveryConfirmed} onClick={() => actions.confirmDailyTask("recovery")}>{record.recoveryConfirmed ? "Recovery review saved" : "Confirm plan reviewed"}</button></>}
    </article>
    <article className="daily-task">
      <header><div><InterfaceIcon name="heart" /><h2>Review your measurements</h2></div><TaskStatus done={record.measurementsReviewed} /></header>
      <p>Look at the available readings and note any missing measurements or concerns.</p>
      <div className="daily-plan__buttons"><button type="button" onClick={openHealth}>Review in Health</button><button type="button" disabled={record.measurementsReviewed} onClick={() => actions.confirmDailyTask("measurements")}>{record.measurementsReviewed ? "Review saved" : "Mark reviewed"}</button></div>
    </article>
    <article className="daily-task" ref={checkInRef} style={{scrollMarginTop:20}}>
      <header><div><InterfaceIcon name="wellbeing" /><h2>End-of-day check-in</h2></div><TaskStatus done={record.checkIn !== null} /></header>
      <p>Three short questions about today. Any honest rating counts toward completion.</p>
      {record.checkIn && !editingCheckIn && <div className="daily-task__checkin-summary"><strong>{record.checkIn.rating}<small> / 10 wellbeing</small></strong><p>Energy: {record.checkIn.energy}/5</p>{record.checkIn.reflection && <blockquote>{record.checkIn.reflection}</blockquote>}</div>}
      {editingCheckIn ? <CheckInForm initial={record.checkIn} onCancel={() => setEditingCheckIn(false)} onSave={input => { actions.saveCheckIn(input); setEditingCheckIn(false); }} /> :
        <button type="button" className="daily-plan__primary" onClick={() => setEditingCheckIn(true)}>{record.checkIn ? "Edit today's check-in" : "Start today's check-in"}</button>}
    </article>
  </div>;
}

function PastDay({ record, date }: { record?: DailyPlanRecord; date: string }) {
  if (!record) return <div className="daily-plan__empty"><h2>No entries for this day</h2><p>No tasks or check-in were recorded on {displayDate(date)}. Generated measurement history does not fill this calendar.</p></div>;
  return <div className="daily-plan__past"><h2>{planProgress(record)} of 3 tasks completed</h2><ul>
    <li>{record.mode === "activity" ? `Activity: ${record.activeMinutes ?? "not recorded"}${record.activeMinutes === null ? "" : " minutes"}` : `Recovery review: ${record.recoveryConfirmed ? "done" : "not recorded"}`}</li>
    <li>Measurements reviewed: {record.measurementsReviewed ? "yes" : "not recorded"}</li>
    <li>Check-in: {record.checkIn ? `${record.checkIn.rating}/10 wellbeing · ${record.checkIn.energy}/5 energy` : "not recorded"}</li>
  </ul>{record.checkIn?.reflection && <blockquote>{record.checkIn.reflection}</blockquote>}<p>Past entries are read-only.</p></div>;
}

export function DailyPlanScreen({ update, actions, openHealth, startCheckIn = false, temporary = false }: { update: HealthUpdate; actions: DemoActions; openHealth: () => void; startCheckIn?: boolean; temporary?: boolean }) {
  const { today, records, storage } = update.dailyPlan;
  const [selected, setSelected] = useState(today);
  const record = records.find(item => item.date === selected);
  const todayRecord = records.find(item => item.date === today) ?? emptyPlan(today);
  const todayProgress = planProgress(todayRecord);
  const todayTime = Date.parse(today);
  const first = todayTime - new Date(today).getUTCDay() * DAY - 84 * DAY;
  const days = Array.from({ length: 91 }, (_, index) => new Date(first + index * DAY).toISOString().slice(0, 10));
  const completedDays = records.filter(item => planProgress(item) === 3).length;
  return <section className="daily-plan">
    <header className="daily-plan__heading"><div><h1>Daily plan</h1><p>A little structure for today. Your progress stays with each day.</p></div><span>{todayProgress} of 3 completed today</span></header>
    {todayProgress === 3 && <div className="daily-plan__celebration" role="status"><InterfaceIcon name="check" /><div><h2>Today's plan is complete</h2><p>Nice work — you made time for your health today.</p></div></div>}
    <div className="daily-plan__layout">
      <div className="daily-plan__main">
        <div className="daily-plan__date"><h2>{selected === today ? "Today" : displayDate(selected)}</h2>{selected === today ? <span>{displayDate(today)} · UTC</span> : <button type="button" onClick={() => setSelected(today)}>Back to today</button>}</div>
        {selected === today ? <>
          <div className="daily-plan__mode" role="group" aria-label="Demo day plan"><button type="button" aria-pressed={todayRecord.mode === "activity"} onClick={() => actions.setDailyMode("activity")}>Activity day</button><button type="button" aria-pressed={todayRecord.mode === "recovery"} onClick={() => actions.setDailyMode("recovery")}>Recovery day</button></div>
          <p className="daily-plan__disclosure">Illustrative demo plan. Real activity targets come from your mission medical team. Steps are not measured in this prototype.</p>
          <TodayTasks key={today} record={todayRecord} actions={actions} urgent={update.snapshot.overall.state === "assist"} openHealth={openHealth} startCheckIn={startCheckIn} />
        </> : <PastDay record={record} date={selected} />}
      </div>
      <aside className="plan-calendar" aria-label="Daily completion calendar">
        <h2>Your recent days</h2><p>Select a day to see its tasks and check-in.</p>
        <div className="plan-calendar__grid"><div className="plan-calendar__weekdays" aria-hidden="true">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => <span key={day}>{day}</span>)}</div>
          <div className="plan-calendar__days">{days.map(date => {
            const item = records.find(entry => entry.date === date);
            const count = item ? planProgress(item) : 0;
            const future = date > today;
            return <button type="button" key={date} disabled={future} data-date={date} tabIndex={selected === date ? 0 : -1} data-level={future ? "future" : count === 3 ? "complete" : count > 0 ? "partial" : "empty"} aria-pressed={selected === date} aria-label={`${displayDate(date)}: ${future ? "future day" : `${count} of 3 tasks completed`}`} title={`${displayDate(date)} · ${count}/3`} onClick={() => setSelected(date)} onKeyDown={event => {
              const offset = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key];
              if (offset === undefined) return;
              event.preventDefault();
              const next = days[days.indexOf(date) + offset];
              if (next && next <= today) { event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(); setSelected(next); }
            }} />;
          })}</div>
        </div>
        <div className="plan-calendar__legend"><span><i data-level="empty" />No completion</span><span><i data-level="partial" />Partial</span><span><i data-level="complete" />Complete</span></div>
        <div className="plan-calendar__recognition"><InterfaceIcon name="plan" /><strong>{completedDays}<span>completed {completedDays === 1 ? "day" : "days"}</span></strong></div>
        <p>Each completed day earns a mark in your calendar. Your wellbeing rating does not affect the reward.</p>
        <p className="plan-calendar__storage">{temporary ? "Temporary walkthrough data. Discarded when you finish or exit." : storage === "browser" ? "Saved only in this browser. Days follow UTC." : "Browser storage is unavailable. Entries last until reload."}</p>
      </aside>
    </div>
  </section>;
}
