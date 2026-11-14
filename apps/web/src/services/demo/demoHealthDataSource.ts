import type {
  DemoControlState,
  DemoRunState,
  DemoScenario,
  HealthDataSource,
  HealthSnapshot,
  HealthUpdate,
  ScenarioId,
  DemoHistoryDays,
  DemoState,
  HealthEvent,
  DailyPlanRecord,
  WellbeingCheckIn,
} from "@ahm/contracts";

import { SCENARIOS, buildSnapshot } from "./scenarios";
import { applyLiveSamples, configureDemoSnapshot, type LiveSample } from "./demoDataset";
import { DailyPlanStore, applyPlanReadings, browserPlanStorage, validCheckIn, type PlanStorage } from "./dailyPlan";

/** Scenario time advances 60 s for every real second. */
const SPEED_FACTOR = 60;
const TICK_MS = 1000;

function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Browser-side synthetic source.
 *
 * Replaceable at `createHealthDataSource()` with a backend implementation of
 * the same `HealthDataSource` contract; no interface code depends on this file.
 */
export class DemoHealthDataSource implements HealthDataSource {
  readonly kind = "simulator" as const;

  private scenarioId: ScenarioId = "DEMO-01";
  private runState: DemoRunState = "idle";
  private elapsedSeconds = 0;
  private speedFactor = SPEED_FACTOR;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<(update: HealthUpdate) => void>();
  private historyDays: DemoHistoryDays | null = null;
  private demoState: DemoState | null = null;
  private anchor = new Date().toISOString();
  private events: HealthEvent[] = [];
  private eventSequence = 0;
  private liveTimer: ReturnType<typeof setInterval> | null = null;
  private liveSamples: LiveSample[] = [];
  private liveTick = 0;
  private readonly plans: DailyPlanStore;

  constructor(storage: PlanStorage | null = browserPlanStorage()) { this.plans = new DailyPlanStore(storage); }

  setDailyMode(mode: DailyPlanRecord["mode"]): void {
    if (!["activity", "recovery"].includes(mode)) return;
    this.plans.change(record => ({ ...record, mode }));
    this.record("plan", "Daily plan updated", `Today's demo plan: ${mode}. This is not a prescribed medical target.`); this.publish();
  }
  saveActiveMinutes(minutes: number): void {
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440 || this.getUpdate().snapshot.overall.state === "assist") return;
    this.plans.change(record => ({ ...record, activeMinutes: minutes, activeRecordedAt: new Date().toISOString() }));
    this.record("plan", "Activity recorded", `${minutes} active minutes entered for today's demo plan.`); this.publish();
  }
  confirmDailyTask(task: "recovery" | "measurements"): void {
    if (!["recovery", "measurements"].includes(task)) return;
    this.plans.change(record => task === "recovery" ? { ...record, recoveryConfirmed: true } : { ...record, measurementsReviewed: true });
    this.record("plan", "Daily task confirmed", task === "recovery" ? "Recovery plan review confirmed by the user." : "Measurement review confirmed by the user."); this.publish();
  }
  saveCheckIn(input: Omit<WellbeingCheckIn, "savedAt">): void {
    if (!validCheckIn(input)) return;
    this.plans.change(record => ({ ...record, checkIn: { ...input, reflection: input.reflection.trim(), savedAt: new Date().toISOString() } }));
    this.record("plan", "Wellbeing check-in saved", `Today's self-rating: ${input.rating}/10. No diagnosis was inferred.`); this.publish();
  }

  populateHistory(days: 7 | 30 | 90): void {
    if (![7, 30, 90].includes(days)) return;
    this.resetLiveSamples();
    this.stopTimer(); this.runState = "idle"; this.elapsedSeconds = 0;
    this.historyDays = days; this.demoState = "stable"; this.anchor = new Date().toISOString();
    this.record("data", `${days} days of demo data generated`, "Daily synthetic samples replaced the previous measurement history.");
    this.publish();
  }

  clearData(): void {
    this.plans.clear();
    this.resetLiveSamples();
    this.stopTimer(); this.runState = "idle"; this.elapsedSeconds = 0;
    this.historyDays = 0; this.demoState = null; this.events = []; this.anchor = new Date().toISOString();
    this.record("data", "Demo data cleared", "Measurements, saved daily plans and prior event entries were removed.");
    this.publish();
  }

  setDemoState(state: DemoState): void {
    if (this.historyDays === 0 || !["stable", "check", "urgent", "missing"].includes(state)) return;
    this.resetLiveSamples();
    this.stopTimer(); this.runState = "idle"; this.demoState = state;
    this.record("state", `Demo state: ${state}`, "Manually selected synthetic scenario; not an automated diagnosis.");
    this.publish();
  }

  recordReportExport(recipient: "earth" | "crew"): void {
    this.record("report", "Report export prepared", `Intended recipient: ${recipient === "earth" ? "Earth medical team" : "Crew medical officer"}. No transmission was made.`);
    this.publish();
  }

  private record(kind: HealthEvent["kind"], title: string, detail: string): void {
    this.events = [{ id: `event-${++this.eventSequence}`, at: new Date().toISOString(), kind, title, detail }, ...this.events].slice(0, 100);
  }

  listScenarios(): DemoScenario[] {
    return SCENARIOS;
  }

  getUpdate(): HealthUpdate {
    return {
      snapshot: applyPlanReadings(applyLiveSamples(configureDemoSnapshot(buildSnapshot(this.scenarioId, this.elapsedSeconds), this.historyDays, new Date(Date.parse(this.anchor) + (this.historyDays === null ? this.elapsedSeconds * 1000 : 0)).toISOString(), this.demoState), this.liveSamples), this.plans.state()),
      dailyPlan: this.plans.state(),
      control: this.controlState(),
      events: this.events.map(event => ({ ...event })),
    };
  }

  subscribe(listener: (update: HealthUpdate) => void): () => void {
    this.listeners.add(listener);
    if (this.liveTimer === null) this.liveTimer = setInterval(() => {
      if (this.historyDays === 0 || this.runState !== "idle" || (typeof document !== "undefined" && document.hidden)) return;
      this.liveSamples = [...this.liveSamples, { at: new Date().toISOString(), tick: ++this.liveTick }].slice(-60);
      this.publish();
    }, 5000);
    listener(this.getUpdate());
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.liveTimer !== null) { clearInterval(this.liveTimer); this.liveTimer = null; }
    };
  }

  runScenario(id: ScenarioId): void {
    this.resetLiveSamples();
    this.anchor = new Date().toISOString();
    this.historyDays = null; this.demoState = null;
    this.scenarioId = id;
    this.elapsedSeconds = 0;
    this.runState = "running";
    this.startTimer();
    this.publish();
  }

  pause(): void {
    if (this.runState !== "running") {
      return;
    }
    this.runState = "paused";
    this.stopTimer();
    this.publish();
  }

  resume(): void {
    if (this.runState !== "paused") {
      return;
    }
    this.runState = "running";
    this.startTimer();
    this.publish();
  }

  reset(): void {
    this.resetLiveSamples();
    this.anchor = new Date().toISOString();
    this.historyDays = null; this.demoState = null;
    this.stopTimer();
    this.runState = "idle";
    this.elapsedSeconds = 0;
    this.publish();
  }

  dispose(): void {
    this.stopTimer();
    if (this.liveTimer !== null) { clearInterval(this.liveTimer); this.liveTimer = null; }
    this.listeners.clear();
  }

  private controlState(): DemoControlState {
    return {
      historyDays: this.historyDays,
      demoState: this.demoState,
      scenarioId: this.scenarioId,
      runState: this.runState,
      speedFactor: this.speedFactor,
      scenarioClock: formatClock(this.elapsedSeconds),
    };
  }

  private resetLiveSamples(): void { this.liveSamples = []; this.liveTick = 0; }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.elapsedSeconds += this.speedFactor;
      this.publish();
    }, TICK_MS);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private publish(): void {
    const update = this.getUpdate();
    for (const listener of this.listeners) {
      listener(update);
    }
  }
}

let sharedSource: HealthDataSource | null = null;

/**
 * Single entry point for the interface.
 *
 * When the backend is ready, swap the returned implementation here (or point
 * it at an HTTP adapter) without touching components.
 */
export function createHealthDataSource(): HealthDataSource {
  sharedSource ??= new DemoHealthDataSource();
  return sharedSource;
}
