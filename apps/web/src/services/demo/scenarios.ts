import type {
  DataCoverage,
  DemoScenario,
  HealthSnapshot,
  MetricId,
  MetricReading,
  MetricStatus,
  OverallState,
  Recommendation,
  ScenarioId,
  TrendPoint,
} from "@ahm/contracts";

import {
  DEMO_CONTENT_SOURCE,
  METRIC_META,
  MISSION,
  PLANNED_CHECK_IN,
  URGENT_ASSISTANCE_STEPS,
  isoAt,
} from "./fixtures";

export const SCENARIOS: DemoScenario[] = [
  {
    id: "DEMO-01",
    title: "Nominal shift",
    description:
      "Steady synthetic stream with a planned self-check reminder.",
  },
  {
    id: "DEMO-02",
    title: "Urgent event",
    description:
      "Injected simulator event: heart-rate rise and SpO₂ drop, crew assistance.",
  },
  {
    id: "DEMO-03",
    title: "Sensor loss",
    description:
      "SpO₂ stops reporting. Missing data must not read as a normal result.",
  },
];

/** Deterministic, reproducible fluctuation. */
function wave(seconds: number, period: number, amplitude: number): number {
  return Math.round(amplitude * Math.sin(seconds / period));
}

function pushTrend(
  trend: TrendPoint[],
  elapsedSeconds: number,
  stepSeconds: number,
  valueAt: (seconds: number) => number,
): TrendPoint[] {
  const points: TrendPoint[] = [];
  const start = Math.max(0, elapsedSeconds - stepSeconds * 15);
  for (let t = start; t <= elapsedSeconds; t += stepSeconds) {
    points.push({ at: isoAt(t), value: valueAt(t) });
  }
  const last = points[points.length - 1];
  if (!last || last.at !== isoAt(elapsedSeconds)) {
    points.push({ at: isoAt(elapsedSeconds), value: valueAt(elapsedSeconds) });
  }
  return points;
}

interface ReadingInput {
  metric: MetricId;
  value: number | null;
  status: MetricStatus;
  measuredAt: string | null;
  trend?: TrendPoint[];
}

function reading(input: ReadingInput): MetricReading {
  const meta = METRIC_META[input.metric];
  return {
    metric: input.metric,
    label: meta.label,
    value: input.value,
    unit: meta.unit,
    measuredAt: input.measuredAt,
    source: "simulator",
    quality: input.status === "unavailable" ? "unknown" : "good",
    status: input.status,
    caption: meta.caption,
    trend: input.trend ?? [],
  };
}

interface ScenarioBuild {
  state: OverallState;
  headline: string;
  reasons: string[];
  coverage: DataCoverage;
  metrics: MetricReading[];
  recommendations: Recommendation[];
}

export function buildSnapshot(
  scenarioId: ScenarioId,
  elapsedSeconds: number,
): HealthSnapshot {
  const built = buildScenario(scenarioId, elapsedSeconds);
  return {
    mission: MISSION,
    overall: {
      state: built.state,
      headline: built.headline,
      reasons: built.reasons,
      updatedAt: isoAt(elapsedSeconds),
      dataCoverage: built.coverage,
    },
    metrics: built.metrics,
    recommendations: built.recommendations,
    generatedAt: isoAt(elapsedSeconds),
    synthetic: true,
    speedFactor: 60,
  };
}

function buildScenario(
  scenarioId: ScenarioId,
  elapsed: number,
): ScenarioBuild {
  switch (scenarioId) {
    case "DEMO-02":
      return urgentEvent(elapsed);
    case "DEMO-03":
      return sensorLoss(elapsed);
    case "DEMO-01":
    default:
      return nominalShift(elapsed);
  }
}

function nominalShift(elapsed: number): ScenarioBuild {
  const heartRate = (t: number) => 68 + wave(t, 9, 3);
  const spo2 = (t: number) => 98 - (wave(t, 25, 1) > 0 ? 1 : 0);

  const metrics: MetricReading[] = [
    reading({
      metric: "heartRate",
      value: heartRate(elapsed),
      status: "normal",
      measuredAt: isoAt(elapsed),
      trend: pushTrend([], elapsed, 15, heartRate),
    }),
    reading({
      metric: "sleep",
      value: 6.4,
      status: "normal",
      measuredAt: isoAt(-7200),
    }),
    reading({
      metric: "wellbeing",
      value: 7,
      status: "normal",
      measuredAt: isoAt(-3600),
    }),
    reading({
      metric: "activity",
      value: 42,
      status: "normal",
      measuredAt: isoAt(elapsed),
    }),
    reading({
      metric: "spo2",
      value: spo2(elapsed),
      status: "normal",
      measuredAt: isoAt(elapsed),
      trend: pushTrend([], elapsed, 20, spo2),
    }),
  ];

  const recommendations: Recommendation[] =
    elapsed >= 120
      ? [
          {
            id: "rec-planned-checkin",
            severity: "info",
            title: "Planned self-check",
            body: PLANNED_CHECK_IN,
            source: DEMO_CONTENT_SOURCE,
            synthetic: true,
          },
        ]
      : [
          {
            id: "rec-routine",
            severity: "info",
            title: "Routine monitoring",
            body: "All five demo metrics are reporting. No action is required right now.",
            source: DEMO_CONTENT_SOURCE,
            synthetic: true,
          },
        ];

  return {
    state: "clear",
    headline: "No new warnings",
    reasons: [
      "All five demo metrics are current.",
      "No deviation detected by the prepared demo rules.",
    ],
    coverage: "complete",
    metrics,
    recommendations,
  };
}

const EVENT_AT = 45;

function urgentEvent(elapsed: number): ScenarioBuild {
  const active = elapsed >= EVENT_AT;
  const heartRate = (t: number) =>
    active && t >= EVENT_AT ? 118 + wave(t, 3, 4) : 72 + wave(t, 11, 2);
  const spo2 = (t: number) => (active && t >= EVENT_AT ? 91 : 98);

  const heartStatus: MetricStatus = active ? "alert" : "normal";
  const spo2Status: MetricStatus = active ? "alert" : "normal";

  const metrics: MetricReading[] = [
    reading({
      metric: "heartRate",
      value: heartRate(elapsed),
      status: heartStatus,
      measuredAt: isoAt(elapsed),
      trend: pushTrend([], elapsed, 15, heartRate),
    }),
    reading({
      metric: "sleep",
      value: 6.1,
      status: "normal",
      measuredAt: isoAt(-7500),
    }),
    reading({
      metric: "wellbeing",
      value: 6,
      status: "normal",
      measuredAt: isoAt(-3000),
    }),
    reading({
      metric: "activity",
      value: 58,
      status: "normal",
      measuredAt: isoAt(elapsed),
    }),
    reading({
      metric: "spo2",
      value: spo2(elapsed),
      status: spo2Status,
      measuredAt: isoAt(elapsed),
      trend: pushTrend([], elapsed, 20, spo2),
    }),
  ];

  if (!active) {
    return {
      state: "clear",
      headline: "No new warnings",
      reasons: [
        "All five demo metrics are current.",
        "The simulator event has not fired yet.",
      ],
      coverage: "complete",
      metrics,
      recommendations: [
        {
          id: "rec-routine",
          severity: "info",
          title: "Routine monitoring",
          body: "All five demo metrics are reporting. The scenario event fires at 00:00:45.",
          source: DEMO_CONTENT_SOURCE,
          synthetic: true,
        },
      ],
    };
  }

  return {
    state: "assist",
    headline: "Assistance needed",
    reasons: [
      "Heart rate rose sharply in the synthetic stream.",
      "SpO₂ dropped below the demo threshold.",
      "Trigger: simulator event, not a validated clinical detector.",
    ],
    coverage: "complete",
    metrics,
    recommendations: [
      {
        id: "rec-assistance",
        severity: "urgent",
        title: "Crew assistance",
        body: URGENT_ASSISTANCE_STEPS,
        source: DEMO_CONTENT_SOURCE,
        synthetic: true,
      },
    ],
  };
}

const SENSOR_LOSS_AT = 40;

function sensorLoss(elapsed: number): ScenarioBuild {
  const lost = elapsed >= SENSOR_LOSS_AT;
  const heartRate = (t: number) => 70 + wave(t, 10, 2);
  const spo2 = (t: number) => 98;

  const metrics: MetricReading[] = [
    reading({
      metric: "heartRate",
      value: heartRate(elapsed),
      status: "normal",
      measuredAt: isoAt(elapsed),
      trend: pushTrend([], elapsed, 15, heartRate),
    }),
    reading({
      metric: "sleep",
      value: 7.2,
      status: "normal",
      measuredAt: isoAt(-7000),
    }),
    reading({
      metric: "wellbeing",
      value: 8,
      status: "normal",
      measuredAt: isoAt(-2400),
    }),
    reading({
      metric: "activity",
      value: 35,
      status: "normal",
      measuredAt: isoAt(elapsed),
    }),
    lost
      ? reading({
          metric: "spo2",
          value: null,
          status: "unavailable",
          measuredAt: null,
          trend: pushTrend([], SENSOR_LOSS_AT - 1, 20, spo2),
        })
      : reading({
          metric: "spo2",
          value: spo2(elapsed),
          status: "normal",
          measuredAt: isoAt(elapsed),
          trend: pushTrend([], elapsed, 20, spo2),
        }),
  ];

  if (!lost) {
    return {
      state: "clear",
      headline: "No new warnings",
      reasons: [
        "All five demo metrics are current.",
        "The SpO₂ sensor stops reporting at 00:00:40.",
      ],
      coverage: "complete",
      metrics,
      recommendations: [
        {
          id: "rec-routine",
          severity: "info",
          title: "Routine monitoring",
          body: "All five demo metrics are reporting. The scenario drops SpO₂ at 00:00:40.",
          source: DEMO_CONTENT_SOURCE,
          synthetic: true,
        },
      ],
    };
  }

  return {
    state: "insufficient",
    headline: "Data incomplete",
    reasons: [
      "SpO₂ has not reported for more than " +
        String(Math.max(1, elapsed - SENSOR_LOSS_AT)) +
        " s of scenario time.",
      "The other four demo metrics are still current.",
      "Missing data is not a normal result.",
    ],
    coverage: "partial",
    metrics,
    recommendations: [
      {
        id: "rec-sensor-check",
        severity: "check",
        title: "Check the SpO₂ sensor",
        body: "Confirm the sensor is attached correctly and restart the reading. If the gap continues, record it in the log instead of assuming a normal value.",
        source: DEMO_CONTENT_SOURCE,
        synthetic: true,
      },
    ],
  };
}
