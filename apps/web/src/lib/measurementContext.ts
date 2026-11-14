import type { MetricReading, HealthUpdate } from "@ahm/contracts";
export function measurementContext(reading: MetricReading): string {
  if (reading.metric === "wellbeing") return reading.value === null ? "Today's check-in pending" : "Today's self-rating";
  if (reading.metric === "sleep") return "Last sleep period";
  if (reading.metric === "activity") return reading.source === "manual" ? "Today's recorded activity" : "Demo activity window";
  if (["heartRate", "spo2", "respiratoryRate"].includes(reading.metric)) return reading.value === null ? "No current signal" : "Live demo · 5 s";
  return "Demo spot measurement";
}
export function statusReason(update: HealthUpdate): string {
  if (update.snapshot.overall.dataCoverage === "none") return "No measurements loaded. Add sample history from Demo tools.";
  if (update.control.demoState === "urgent") return "Urgent event selected in Demo tools; this is not an automatic diagnosis.";
  if (update.control.demoState === "missing") return "The oxygen signal is missing. Previous readings do not confirm the current condition.";
  if (update.control.demoState === "check") return "The short-sleep demo needs a recovery review.";
  if (update.snapshot.overall.state !== "clear") return update.snapshot.overall.reasons[0] ?? "Review the available measurements.";
  return update.snapshot.metrics.find(item => item.metric === "wellbeing")?.value === null
    ? "Available demo readings are stable. Today's wellbeing check-in is still pending."
    : "Available demo readings are stable; today's wellbeing check-in is recorded.";
}
