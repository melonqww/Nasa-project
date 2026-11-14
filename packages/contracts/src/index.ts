/**
 * Shared data contract between the web interface and the monitoring backend.
 *
 * The backend owns measurement intake, evaluation rules, scenarios and
 * persistence. The interface only renders the state it receives and forwards
 * explicit user actions. Nothing in this package contains medical thresholds
 * or UI code.
 *
 * All values are synthetic in the demo build. A real adapter must set
 * `synthetic: false`, provide real provenance and pass the same shape.
 */

/** Metric identifiers used by the first version of the interface. */
export type MetricId = "heartRate" | "sleep" | "wellbeing" | "activity" | "spo2";

/**
 * - `simulator` — reproducible synthetic scenario (demo default)
 * - `manual` — value entered by the operator in the demo panel
 * - `adapter` — future real device or mission adapter
 */
export type DataSourceKind = "simulator" | "manual" | "adapter";

/** Sensor/data quality. A missing reading must never be reported as normal. */
export type DataQuality = "good" | "degraded" | "unknown";

/**
 * Per-metric evaluation produced by the backend.
 * `unavailable` means no current data; it is a distinct state, not `normal`.
 */
export type MetricStatus = "normal" | "watch" | "alert" | "unavailable";

/** A single point on a metric trend line. */
export interface TrendPoint {
  /** ISO 8601 timestamp. */
  at: string;
  value: number;
}

/** One metric as rendered by a mini-card and the details panel. */
export interface MetricReading {
  metric: MetricId;
  /** Human readable name, e.g. "Heart rate". */
  label: string;
  /** Latest value, or `null` when no current reading exists. */
  value: number | null;
  /** Unit symbol shown next to the value, e.g. "bpm", "%", "h". */
  unit: string;
  /** ISO 8601 timestamp of the latest reading, or `null` when unavailable. */
  measuredAt: string | null;
  /** Where this reading came from. */
  source: DataSourceKind;
  quality: DataQuality;
  status: MetricStatus;
  /**
   * Short honest caption, e.g. "Self-report, 1–10" or
   * "Last completed sleep period". Never a diagnosis.
   */
  caption: string;
  /** Chronological trend points. Empty when there is not enough history. */
  trend: TrendPoint[];
}

/**
 * Overall action priority shown by the jelly ball.
 * - `clear` — no deviation detected in current data
 * - `check` — attention or verification needed
 * - `assist` — urgent event, crew assistance mode
 * - `insufficient` — not enough current data to judge
 */
export type OverallState = "clear" | "check" | "assist" | "insufficient";

/** How much of the expected data stream is currently available. */
export type DataCoverage = "complete" | "partial" | "none";

/** Aggregated status rendered on and around the ball. */
export interface OverallStatus {
  state: OverallState;
  /** One short phrase for the ball, e.g. "Needs a check". */
  headline: string;
  /** Concrete reasons supporting the state. */
  reasons: string[];
  /** ISO 8601 timestamp of the evaluation. */
  updatedAt: string;
  dataCoverage: DataCoverage;
}

/** Severity of a prepared recommendation. */
export type RecommendationSeverity = "info" | "check" | "urgent";

/**
 * Prepared guidance selected by the backend for the current state.
 * Text is not generated at render time and is not a validated medical protocol.
 */
export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  body: string;
  /** Provenance note explaining where the guidance comes from. */
  source: string;
  synthetic: true;
}

/** Fictional crew member and mission context. */
export interface MissionContext {
  astronautName: string;
  astronautRole: string;
  missionPhase: string;
  environment: string;
  /** Mission-time label, e.g. "Sol 41 · 14:20". */
  timelineLabel: string;
}

/** Complete screen state delivered by the backend. */
export interface HealthSnapshot {
  mission: MissionContext;
  overall: OverallStatus;
  metrics: MetricReading[];
  recommendations: Recommendation[];
  /** ISO 8601 timestamp when this snapshot was produced. */
  generatedAt: string;
  /** Explicit synthetic marker. The demo never claims live measurements. */
  synthetic: true;
  /** Time acceleration factor of the scenario clock, e.g. 60 for ×60. */
  speedFactor: number;
}

/** Identifiers of the three agreed demo scenarios. */
export type ScenarioId = "DEMO-01" | "DEMO-02" | "DEMO-03";

/** Scenario metadata for the demo control panel. */
export interface DemoScenario {
  id: ScenarioId;
  title: string;
  description: string;
}

/** Lifecycle of the scenario clock. */
export type DemoRunState = "idle" | "running" | "paused";

/** Demo panel state. Kept separate from the crew-facing snapshot. */
export interface DemoControlState {
  scenarioId: ScenarioId;
  runState: DemoRunState;
  speedFactor: number;
  /** Human readable scenario clock, e.g. "00:04:20". */
  scenarioClock: string;
}

/**
 * One update delivered to the interface: the crew-facing snapshot plus the
 * separate demo control state.
 */
export interface HealthUpdate {
  snapshot: HealthSnapshot;
  control: DemoControlState;
}

/**
 * Data source contract.
 *
 * The demo implementation lives in `apps/web/src/services/demo`. A backend
 * implementation (HTTP, WebSocket or local process) must implement the same
 * interface so the interface code does not change.
 */
export interface HealthDataSource {
  readonly kind: DataSourceKind;
  listScenarios(): DemoScenario[];
  getUpdate(): HealthUpdate;
  /** Subscribe to updates. Returns an unsubscribe function. */
  subscribe(listener: (update: HealthUpdate) => void): () => void;
  runScenario(id: ScenarioId): void;
  pause(): void;
  resume(): void;
  reset(): void;
  dispose(): void;
}
