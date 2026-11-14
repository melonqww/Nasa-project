import type { DemoHistoryDays, DemoState, HealthSnapshot, MetricId, MetricReading } from "@ahm/contracts";

const AMPLITUDE: Record<MetricId, number> = {
  heartRate: 5, spo2: .7, sleep: .8, wellbeing: 1, activity: 12,
  respiratoryRate: 1.5, temperature: .15, systolicPressure: 5, diastolicPressure: 3,
};
export interface LiveSample { at: string; tick: number }
/** Live synthetic samples change the source snapshot, so UI, history and exports agree. */
export function applyLiveSamples(snapshot: HealthSnapshot, samples: LiveSample[]): HealthSnapshot {
  if (!samples.length || snapshot.overall.dataCoverage === "none") return snapshot;
  const latestAt = samples.at(-1)!.at;
  for (const reading of snapshot.metrics) {
    if (reading.value === null || !["heartRate", "spo2", "respiratoryRate"].includes(reading.metric)) continue;
    const center = reading.value;
    const points = samples.filter(sample => Date.parse(sample.at) > Date.parse(reading.measuredAt ?? "1970-01-01")).map(sample => {
      const wave = Math.sin(sample.tick * 1.17) * .72 + Math.sin(sample.tick * .43) * .28;
      const raw = center + (reading.metric === "heartRate" ? 3 : reading.metric === "respiratoryRate" ? 1 : .65) * wave;
      return { at: sample.at, value: reading.metric === "spo2" ? Math.min(100, Math.max(0, Math.round(raw * 10) / 10)) : Math.round(raw), expectedIntervalSeconds: 5 };
    });
    if (!points.length) continue;
    reading.trend = [...reading.trend, ...points];
    reading.value = points.at(-1)!.value; reading.measuredAt = points.at(-1)!.at;
    reading.caption += " Live synthetic samples every 5 seconds; no real sensor connected.";
  }
  snapshot.generatedAt = latestAt;
  return snapshot;
}
/** Daily synthetic samples. Endpoint and latest value always agree. No clinical inference. */
export function configureDemoSnapshot(base: HealthSnapshot, days: DemoHistoryDays | null, anchor: string, mode: DemoState | null): HealthSnapshot {
  const snapshot = structuredClone(base);
  if (days === 0) {
    snapshot.generatedAt = anchor; snapshot.overall.updatedAt = anchor;
    snapshot.metrics = snapshot.metrics.map(reading => ({ ...reading, value: null, measuredAt: null, trend: [], status: "unavailable", quality: "unknown" }));
    snapshot.overall = { ...snapshot.overall, state: "insufficient", healthScore: 0, scoreLabel: "No measurements", dataCoverage: "none", reasons: ["No measurements are loaded. Add synthetic data from Demo tools."] };
    snapshot.recommendations = [];
    return snapshot;
  }
  if (days === null) {
    const shift = Date.parse(anchor) - Date.parse(snapshot.generatedAt);
    const shifted = (at: string) => new Date(Date.parse(at) + shift).toISOString();
    snapshot.generatedAt = anchor; snapshot.overall.updatedAt = anchor;
    for (const reading of snapshot.metrics) {
      reading.measuredAt = reading.measuredAt ? shifted(reading.measuredAt) : null;
      reading.trend = reading.trend.map(point => ({ ...point, at: shifted(point.at) }));
    }
  }
  if (days !== null) {
    snapshot.generatedAt = anchor;
    snapshot.overall.updatedAt = anchor;
    snapshot.metrics = snapshot.metrics.map((reading, index) => {
      const center = reading.value ?? 0;
      const trend = Array.from({ length: days + 1 }, (_, day) => {
        const offset = day - days;
        const signal = Math.sin(offset * .67 + index) * .65 + Math.sin(offset * .23) * .35;
        const raw = center + AMPLITUDE[reading.metric] * signal;
        const value = ["sleep", "temperature"].includes(reading.metric) ? Math.round(raw * 10) / 10 : Math.round(raw);
        return { at: new Date(Date.parse(anchor) + offset * 86400000).toISOString(), value, expectedIntervalSeconds: 86400 };
      });
      // Blood pressure components share the same daily acquisition schedule.
      return { ...reading, value: trend.at(-1)!.value, measuredAt: anchor, trend,
        caption: reading.caption + " Daily synthetic samples." };
    });
  }
  if (!mode) return snapshot;
  const setReading = (id: MetricId, value: number, status: MetricReading["status"]) => {
    const reading = snapshot.metrics.find(item => item.metric === id)!;
    reading.value = value;
    reading.status = status;
    reading.trend = [...reading.trend.filter(point => point.at !== snapshot.generatedAt), { at: snapshot.generatedAt, value, expectedIntervalSeconds: days === null ? 15 : 86400 }];
    reading.measuredAt = snapshot.generatedAt;
  };
  snapshot.overall = { ...snapshot.overall, state: "clear", healthScore: 90, scoreLabel: "Stable demo", dataCoverage: "complete", reasons: ["Stable synthetic scenario selected. No clinical assessment is performed."] };
  snapshot.recommendations = [{ id: "demo-check-in", severity: "info", title: "Daily check-in", body: "Review your sleep and record how you feel before the next work period.", source: "Prepared demo guidance", synthetic: true }];
  if (mode === "check") {
    setReading("sleep", 5.1, "watch");
    snapshot.overall.state = "check";
    snapshot.overall.reasons = ["The demo operator selected a short-sleep check scenario."];
    snapshot.recommendations = [{ id: "demo-sleep", metricIds: ["sleep", "wellbeing"], severity: "check", title: "Review your recovery", body: "Check your last sleep period and update your wellbeing before continuing your planned activities.", source: "Prepared synthetic scenario; not a medical protocol", synthetic: true }];
  } else if (mode === "urgent") {
    setReading("heartRate", 118, "alert"); setReading("spo2", 91, "alert");
    snapshot.overall.state = "assist";
    snapshot.overall.reasons = ["Urgent event injected by the demo operator. This is not a validated diagnosis."];
    snapshot.recommendations = [{ id: "demo-urgent", metricIds: ["heartRate", "spo2"], severity: "urgent", title: "Crew assistance", body: "Alert another crew member and check responsiveness. Follow the approved mission assistance protocol.", source: "Prepared synthetic scenario; not a flight medical protocol", synthetic: true }];
  } else if (mode === "missing") {
    const reading = snapshot.metrics.find(item => item.metric === "spo2")!;
    reading.trend = reading.trend.filter(point => point.at !== snapshot.generatedAt);
    reading.measuredAt = reading.trend.at(-1)?.at ?? null;
    reading.value = null; reading.status = "unavailable"; reading.quality = "unknown";
    snapshot.overall.state = "insufficient"; snapshot.overall.dataCoverage = "partial";
    snapshot.overall.reasons = ["No current oxygen reading. Historical values do not confirm the current condition."];
    snapshot.recommendations = [{ id: "demo-missing", metricIds: ["spo2"], severity: "check", title: "Check the sensor", body: "Check the oxygen sensor connection and request another measurement.", source: "Prepared synthetic scenario", synthetic: true }];
  }
  return snapshot;
}
