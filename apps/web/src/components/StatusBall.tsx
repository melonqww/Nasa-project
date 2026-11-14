import type { OverallState } from "@ahm/contracts";

import "./status-ball.css";

interface StatusBallProps {
  state: OverallState;
  headline: string;
}

/**
 * The single main visual accent. The text stays static: it is not part of the
 * animated surface and keeps its contrast in every state.
 */
export function StatusBall({ state, headline }: StatusBallProps) {
  return (
    <div className="ball-stage">
      <div className="ball" data-state={state} aria-hidden="true">
        <span className="ball__sheen" />
        <span className="ball__highlight" />
      </div>
      <p className="ball__headline" aria-live="polite">
        <span className="ball__status-dot" data-state={state} aria-hidden="true" />
        {headline}
      </p>
    </div>
  );
}
