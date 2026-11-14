import type { OverallState } from "@ahm/contracts";

import "./status-ball.css";

interface StatusBallProps {
  state: OverallState;
  score: number;
  label: string;
}

/**
 * The single main visual accent. The score and its description stay static:
 * they are not part of the animated surface and keep readable contrast in
 * every state.
 */
export function StatusBall({ state, score, label }: StatusBallProps) {
  return (
    <div className="ball-stage">
      <div className="ball" data-state={state} aria-hidden="true">
        <span className="ball__sheen" />
        <span className="ball__highlight" />
      </div>
      <div className="ball__readout" aria-live="polite">
        <p className="ball__score-label">Health index · demo</p>
        <p className="ball__score">{score}</p>
        <p className="ball__description">{label}</p>
      </div>
    </div>
  );
}
