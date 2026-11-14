import "./simulation-badge.css";

/**
 * Permanent marker required by the demo scope. It must stay visible on every
 * screen and must not be hidden when panels open.
 */
export function SimulationBadge() {
  return (
    <p className="simulation-badge">
      <span className="simulation-badge__dot" aria-hidden="true" />
      Simulation · synthetic data
    </p>
  );
}
