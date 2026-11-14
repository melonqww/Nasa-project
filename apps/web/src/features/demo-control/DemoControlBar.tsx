import type { DemoControlState, DemoScenario, ScenarioId } from "@ahm/contracts";

import "./demo-control-bar.css";

const RUN_LABEL: Record<DemoControlState["runState"], string> = {
  idle: "Ready",
  running: "Running",
  paused: "Paused",
};

interface DemoControlBarProps {
  control: DemoControlState;
  scenarios: DemoScenario[];
  onRun: (scenarioId: ScenarioId) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

/**
 * Operator panel. Visually separated from the crew interface and never mixed
 * with crew-facing status.
 */
export function DemoControlBar({
  control,
  scenarios,
  onRun,
  onPause,
  onResume,
  onReset,
}: DemoControlBarProps) {
  const running = control.runState === "running";
  const paused = control.runState === "paused";

  return (
    <section className="demo-control" aria-label="Demo control">
      <div className="demo-control__intro">
        <p className="demo-control__eyebrow">Demo control · separate from the crew interface</p>
        <p className="demo-control__state">
          <span className="demo-control__state-dot" data-run-state={control.runState} aria-hidden="true" />
          {RUN_LABEL[control.runState]}
          <span aria-hidden="true">·</span>
          <span className="demo-control__clock">T+ {control.scenarioClock}</span>
          <span aria-hidden="true">·</span>
          <span>×{control.speedFactor} scenario time</span>
        </p>
      </div>

      <div className="demo-control__actions">
        <label className="demo-control__field">
          <span className="demo-control__label">Scenario</span>
          <select
            className="demo-control__select"
            value={control.scenarioId}
            onChange={(event) => onRun(event.target.value as ScenarioId)}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.id} — {scenario.title}
              </option>
            ))}
          </select>
        </label>

        <div className="demo-control__buttons">
          <button type="button" className="demo-control__button demo-control__button--primary" onClick={() => onRun(control.scenarioId)}>
            Start / restart
          </button>
          {running ? (
            <button type="button" className="demo-control__button" onClick={onPause}>
              Pause
            </button>
          ) : (
            <button type="button" className="demo-control__button" onClick={onResume} disabled={!paused}>
              Resume
            </button>
          )}
          <button type="button" className="demo-control__button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
