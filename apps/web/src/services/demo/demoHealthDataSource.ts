import type {
  DemoControlState,
  DemoRunState,
  DemoScenario,
  HealthDataSource,
  HealthSnapshot,
  HealthUpdate,
  ScenarioId,
} from "@ahm/contracts";

import { SCENARIOS, buildSnapshot } from "./scenarios";

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

  listScenarios(): DemoScenario[] {
    return SCENARIOS;
  }

  getUpdate(): HealthUpdate {
    return {
      snapshot: buildSnapshot(this.scenarioId, this.elapsedSeconds),
      control: this.controlState(),
    };
  }

  subscribe(listener: (update: HealthUpdate) => void): () => void {
    this.listeners.add(listener);
    listener(this.getUpdate());
    return () => {
      this.listeners.delete(listener);
    };
  }

  runScenario(id: ScenarioId): void {
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
    this.stopTimer();
    this.runState = "idle";
    this.elapsedSeconds = 0;
    this.publish();
  }

  dispose(): void {
    this.stopTimer();
    this.listeners.clear();
  }

  private controlState(): DemoControlState {
    return {
      scenarioId: this.scenarioId,
      runState: this.runState,
      speedFactor: this.speedFactor,
      scenarioClock: formatClock(this.elapsedSeconds),
    };
  }

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
    const update: HealthUpdate = {
      snapshot: buildSnapshot(this.scenarioId, this.elapsedSeconds),
      control: this.controlState(),
    };
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
