import type { DailyPlanRecord, DailyPlanState, HealthSnapshot, WellbeingCheckIn } from "@ahm/contracts";

export const PLAN_STORAGE_KEY = "ahm.daily-plan.v1";
export const DEMO_ACTIVITY_GOAL = 30;
export interface PlanStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export const utcDay = (at = new Date().toISOString()) => at.slice(0, 10);
export const emptyPlan = (date: string): DailyPlanRecord => ({ date, mode: "activity", activeMinutes: null, activeRecordedAt: null, recoveryConfirmed: false, measurementsReviewed: false, checkIn: null });
export function planProgress(record: DailyPlanRecord): number {
  return Number(record.mode === "activity" ? (record.activeMinutes ?? 0) >= DEMO_ACTIVITY_GOAL : record.recoveryConfirmed)
    + Number(record.measurementsReviewed) + Number(record.checkIn !== null);
}
export function browserPlanStorage(): PlanStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validCheckIn(input: Omit<WellbeingCheckIn, "savedAt">): boolean {
  return !!input && Number.isInteger(input.energy) && input.energy >= 1 && input.energy <= 5 && Number.isInteger(input.rating) && input.rating >= 1 && input.rating <= 10
    && typeof input.reflection === "string" && input.reflection.length <= 400;
}
function isRecord(value: unknown): value is DailyPlanRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as DailyPlanRecord;
  return validDate(item.date) && ["activity", "recovery"].includes(item.mode)
    && (item.activeMinutes === null || (Number.isInteger(item.activeMinutes) && item.activeMinutes >= 0 && item.activeMinutes <= 1440))
    && (item.activeMinutes === null ? item.activeRecordedAt === null : typeof item.activeRecordedAt === "string" && Number.isFinite(Date.parse(item.activeRecordedAt)) && utcDay(item.activeRecordedAt) === item.date)
    && typeof item.recoveryConfirmed === "boolean" && typeof item.measurementsReviewed === "boolean"
    && (item.checkIn === null || (typeof item.checkIn === "object" && validCheckIn(item.checkIn) && typeof item.checkIn.savedAt === "string" && Number.isFinite(Date.parse(item.checkIn.savedAt)) && utcDay(item.checkIn.savedAt) === item.date));
}
export class DailyPlanStore {
  private records: DailyPlanRecord[] = [];
  private storage: PlanStorage | null;
  constructor(storage: PlanStorage | null) {
    this.storage = storage;
    let raw: string | null | undefined;
    try { raw = storage?.getItem(PLAN_STORAGE_KEY); } catch { this.storage = null; return; }
    try {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.version === 1 && Array.isArray(parsed.records)) {
        const unique = new Map<string, DailyPlanRecord>();
        for (const item of parsed.records) if (isRecord(item) && item.date <= utcDay()) unique.set(item.date, item);
        this.records = [...unique.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-366);
      }
    } catch { this.records = []; }
  }
  state(): DailyPlanState { return { today: utcDay(), records: structuredClone(this.records), storage: this.storage ? "browser" : "session" }; }
  today(): DailyPlanRecord { return structuredClone(this.records.find(item => item.date === utcDay()) ?? emptyPlan(utcDay())); }
  change(update: (record: DailyPlanRecord) => DailyPlanRecord): void {
    const next = update(this.today());
    this.records = [...this.records.filter(item => item.date !== next.date), next].sort((a, b) => a.date.localeCompare(b.date)).slice(-366);
    this.persist();
  }
  clear(): void {
    this.records = [];
    try { this.storage?.removeItem(PLAN_STORAGE_KEY); } catch { this.storage = null; }
  }
  private persist(): void {
    try { this.storage?.setItem(PLAN_STORAGE_KEY, JSON.stringify({ version: 1, records: this.records })); } catch { this.storage = null; }
  }
}

/** Replace today's seeded values only after an explicit demo self-report. */
export function applyPlanReadings(snapshot: HealthSnapshot, plan: DailyPlanState): HealthSnapshot {
  const today = plan.records.find(record => record.date === plan.today);
  for (const reading of snapshot.metrics) {
    if (reading.metric === "wellbeing") {
      reading.trend = reading.trend.filter(point => utcDay(point.at) !== plan.today);
      const reports = plan.records.filter(record => record.checkIn);
      if (reports.length) {
        const dates = new Set(reports.map(record => record.date));
        reading.trend = [...reading.trend.filter(point => !dates.has(utcDay(point.at))), ...reports.map(record => ({ at: record.checkIn!.savedAt, value: record.checkIn!.rating, expectedIntervalSeconds: 86400 }))].sort((a, b) => a.at.localeCompare(b.at));
      }
      if (today?.checkIn) {
        reading.value = today.checkIn.rating; reading.measuredAt = today.checkIn.savedAt; reading.source = "manual"; reading.quality = "good"; reading.status = "normal";
        reading.caption = "Today's demo self-rating (1–10), saved in Daily plan. Not an automatic stress or diagnostic score.";
      } else {
        reading.value = null; reading.measuredAt = reading.trend.at(-1)?.at ?? null; reading.source = "manual"; reading.quality = "unknown"; reading.status = "unavailable";
        reading.caption = "No wellbeing check-in saved today. Complete it in Daily plan. Earlier generated history is synthetic.";
      }
    }
    if (reading.metric === "activity") {
      const activityReports = plan.records.filter(record => record.activeMinutes !== null);
      const dates = new Set(activityReports.map(record => record.date));
      reading.trend = [...reading.trend.filter(point => !dates.has(utcDay(point.at))), ...activityReports.map(record => ({ at: record.activeRecordedAt!, value: record.activeMinutes!, expectedIntervalSeconds: 86400 }))].sort((a, b) => a.at.localeCompare(b.at));
      if (today?.activeMinutes !== null && today?.activeMinutes !== undefined) {
        reading.value = today.activeMinutes; reading.measuredAt = today.activeRecordedAt; reading.source = "manual"; reading.quality = "good"; reading.status = "normal"; reading.caption = "Active minutes entered in today's demo Daily plan.";
      }
    }
  }
  const available = snapshot.metrics.filter(reading => reading.value !== null).length;
  const latestReading = Math.max(Date.parse(snapshot.generatedAt), ...snapshot.metrics.map(reading => reading.measuredAt ? Date.parse(reading.measuredAt) : 0));
  snapshot.generatedAt = new Date(latestReading).toISOString();
  if (available > 0 && snapshot.overall.dataCoverage === "none") snapshot.overall.reasons = ["Only saved demo self-reports are available. Add other measurements from Demo tools."];
  snapshot.overall.dataCoverage = available === 0 ? "none" : available === snapshot.metrics.length ? "complete" : "partial";
  return snapshot;
}
