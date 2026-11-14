import type { OverallState } from "@ahm/contracts";

import "./status-ball.css";

interface StatusBallProps {
  state: OverallState;
  score: number;
  label: string;
  expanded: boolean;
  onOpen: () => void;
}

/**
 * The single main visual accent. The score and its description stay static:
 * they are not part of the animated surface and keep readable contrast in
 * every state. The whole ball is a button that opens the aggregated health
 * overlay.
 */
export function StatusBall({ state, score, label, expanded, onOpen }: StatusBallProps) {
  return (
    <button
      type="button"
      className="ball-stage"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={expanded}
    >
      <span className="ball" data-state={state} aria-hidden="true">
        <span className="ball__sheen" />
        <span className="ball__highlight" />
      </span>
      <span className="ball__readout">
        <span className="ball__score-label">Health index · demo</span>
        <span className="ball__score">{score}</span>
        <span className="ball__description">{label}</span>
        <span className="ball__hint">Open all indicators</span>
      </span>
    </button>
  );
}
