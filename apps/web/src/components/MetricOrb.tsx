import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { MetricId, MetricReading } from "@ahm/contracts";

import "./metric-orb.css";

const STATUS_LABEL: Record<MetricReading["status"], string> = {
  normal: "No alert",
  watch: "Check needed",
  alert: "Alert",
  unavailable: "No data",
};

interface MetricOrbProps {
  reading: MetricReading;
  selected: boolean;
  onSelect: (metric: MetricId) => void;
  /** Additional path for touch and mouse; a normal click always works. */
  onLongPress: (metric: MetricId) => void;
  /** Orbit position variables supplied by the overview stage. */
  style?: CSSProperties;
}

/**
 * Circular mini-indicator placed on the ball's lower arc. A short click
 * selects the metric and opens the aggregated health overlay; a long press is
 * an additional shortcut to the same detail view.
 */
export function MetricOrb({
  reading,
  selected,
  onSelect,
  onLongPress,
  style,
}: MetricOrbProps) {
  const timerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }
    suppressClickRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      onLongPress(reading.metric);
    }, 550);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelect(reading.metric);
  };

  const hasValue = reading.value !== null;

  return (
    <button
      type="button"
      className="metric-orb"
      data-status={reading.status}
      data-selected={selected}
      aria-pressed={selected}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      onPointerMove={clearTimer}
      onWheel={clearTimer}
      onClick={handleClick}
    >
      <span className="metric-orb__label">{reading.label}</span>
      <span className="metric-orb__value" data-status={reading.status}>
        {hasValue ? reading.value : "No data"}
      </span>
      {hasValue && <span className="metric-orb__unit">{reading.unit}</span>}
      <span className="metric-orb__status" data-status={reading.status}>
        <span className="metric-orb__status-dot" aria-hidden="true" />
        {STATUS_LABEL[reading.status]}
      </span>
      <span className="sr-only">Show all health indicators.</span>
    </button>
  );
}
