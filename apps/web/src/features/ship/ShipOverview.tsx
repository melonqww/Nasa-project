import type { Quality } from "./telemetry";
import { InterfaceIcon } from "../../components/InterfaceIcon";
import { MODULE_LABELS, moduleSummary, type ModuleId, type ShipModule } from "./shipData";
import { ShipIllustration } from "./ShipIllustration";

export function ShipOverview({ modules, locationQuality, onSelect }: { modules: ShipModule[]; locationQuality: Quality; onSelect: (id: ModuleId) => void }) {
  const summary = moduleSummary(modules);
  return <div className="ship-overview" data-module-state={summary.state}>
    <section className="ship-composition" aria-labelledby="ship-status-heading">
      <div className="orbital-stage">
        <ShipIllustration modules={modules} onSelect={onSelect} />
      </div>
      <div className="ship-readout">
        <h1 id="ship-status-heading"><span className="module-state-dot" />{summary.title}</h1>
        <p>{summary.connected} of {modules.length} sources available · {summary.flagged} flagged for review</p>
        <button type="button" className="ship-text-button" onClick={() => onSelect(modules.find(module => module.state !== "nominal")?.id ?? "command")}>Explore modules<InterfaceIcon name="chevron" /></button>
      </div>
    </section>
    <section className="module-overview" aria-label="Ship modules">
      <div className="module-overview__heading"><h2>Your modules</h2></div>
      <div className="module-tray">
        {modules.map(module => <button key={module.id} type="button" className="module-tile" data-module-state={module.state} onClick={() => onSelect(module.id)}>
          <span className="module-tile__top"><InterfaceIcon name={module.icon} /><InterfaceIcon name="chevron" /></span>
          <span className="module-tile__name">{module.name}</span>
          <span className="module-tile__state"><span className="module-state-dot" />{MODULE_LABELS[module.state]}</span>
          <span className="module-tile__crew">{locationQuality !== "fresh" ? "Crew location unknown" : module.crew.length ? module.crew.join(", ") : "No crew recorded"}</span>
        </button>)}
      </div>
      <p className="ship-source-note"><InterfaceIcon name="signal" /><span>Live synthetic telemetry · {summary.connected}/{modules.length} sources available</span></p>
    </section>
  </div>;
}
