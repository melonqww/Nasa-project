import type { MissionContext, MetricId } from "@ahm/contracts";

/** All crew, mission and metric content is fictional demo material. */
export const MISSION: MissionContext = {
  astronautName: "Cmdr. Elena Marsh",
  astronautRole: "Flight engineer · fictional crew member",
  missionPhase: "Orbital demo mission · day 41",
  environment: "Pressurized habitat module · 1 g",
  timelineLabel: "Mission day 41 · 14:20",
};

/**
 * Scenario clock origin. The demo does not claim this is the current time;
 * every timestamp is generated relative to this fixed synthetic origin.
 */
export const BASE_TIME_MS = Date.parse("2026-11-14T09:00:00+05:00");

export function isoAt(secondsFromBase: number): string {
  return new Date(BASE_TIME_MS + Math.round(secondsFromBase) * 1000).toISOString();
}

export interface MetricMeta {
  label: string;
  unit: string;
  caption: string;
}

export const METRIC_META: Record<MetricId, MetricMeta> = {
  heartRate: {
    label: "Heart rate",
    unit: "bpm",
    caption: "Synthetic pulse reading · not a heart-health assessment",
  },
  sleep: {
    label: "Sleep",
    unit: "h",
    caption: "Last completed sleep period · self-reported timeline",
  },
  wellbeing: {
    label: "Wellbeing",
    unit: "/10",
    caption: "Self-report scale 1–10",
  },
  activity: {
    label: "Activity",
    unit: "min",
    caption: "Active minutes in the last 24 h",
  },
  spo2: {
    label: "SpO₂",
    unit: "%",
    caption: "Peripheral oxygen saturation · not cabin oxygen",
  },
};

export const METRIC_ORDER: MetricId[] = [
  "heartRate",
  "sleep",
  "wellbeing",
  "activity",
  "spo2",
];

/** Provenance line reused by prepared demo guidance. */
export const DEMO_CONTENT_SOURCE =
  "Prepared demo content for the synthetic scenario. Not a validated medical protocol.";

export const PLANNED_CHECK_IN =
  "Planned self-check: log how you feel, review the last sleep period and confirm the summary with the crew schedule.";

export const URGENT_ASSISTANCE_STEPS =
  "Alert the other crew member, confirm response and breathing, then follow the prepared assistance steps on screen.";
