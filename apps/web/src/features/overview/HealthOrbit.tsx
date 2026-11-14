import type { CSSProperties } from "react";
import type { MetricId, MetricReading, OverallState } from "@ahm/contracts";

import { MetricOrb } from "../../components/MetricOrb";
import { StatusBall } from "../../components/StatusBall";

/**
 * Unit-circle offsets for the five orb centres on the ball's lower arc:
 * left, lower-left, bottom, lower-right, right. `y` points down, matching CSS.
 */
const ORBIT_POINTS = [
  { x: -0.866, y: 0.5 },
  { x: -0.5, y: 0.866 },
  { x: 0, y: 1 },
  { x: 0.5, y: 0.866 },
  { x: 0.866, y: 0.5 },
];

interface HealthOrbitProps {
  state: OverallState;
  score: number;
  label: string;
  metrics: MetricReading[];
  selectedMetric: MetricId | null;
  overlayOpen: boolean;
  onOpenHealth: () => void;
  onSelectMetric: (metric: MetricId) => void;
  onLongPressMetric: (metric: MetricId) => void;
}

/** Ball plus the five circular indicators hugging its lower perimeter. */
export function HealthOrbit({
  state,
  score,
  label,
  metrics,
  selectedMetric,
  overlayOpen,
  onOpenHealth,
  onSelectMetric,
  onLongPressMetric,
}: HealthOrbitProps) {
  return (
    <div className="orbit">
      <StatusBall
        state={state}
        score={score}
        label={label}
        expanded={overlayOpen}
        onOpen={onOpenHealth}
      />

      {metrics.map((reading, index) => {
        const point = ORBIT_POINTS[index] ?? { x: 0, y: 1 };
        return (
          <MetricOrb
            key={reading.metric}
            reading={reading}
            selected={reading.metric === selectedMetric}
            onSelect={onSelectMetric}
            onLongPress={onLongPressMetric}
            style={
              {
                "--orb-x": String(point.x),
                "--orb-y": String(point.y),
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
