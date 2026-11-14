import type { OverallState } from "@ahm/contracts";
import { WaterSphere } from "./WaterSphere";
import "./status-ball.css";

export function StatusBall({ state, expanded, onOpen }: { state: OverallState; expanded: boolean; onOpen: () => void }) {
  return <button type="button" className="status-sphere" onClick={onOpen}
    aria-label="View health summary" aria-haspopup="dialog" aria-expanded={expanded}>
    <WaterSphere state={state} />
  </button>;
}
