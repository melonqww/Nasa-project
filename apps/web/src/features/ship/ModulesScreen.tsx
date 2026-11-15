import type { ShipController } from "./useShipTelemetry";
import { InterfaceIcon } from "../../components/InterfaceIcon";
import { SelectMenu } from "../../components/SelectMenu";
import { Disclosure } from "../../components/Disclosure";
import { MODULE_LABELS, moduleSummary, type ModuleId, type ShipModule } from "./shipData";

export function ModulesScreen({ modules, selectedId, onSelect, generatedAt, ship }: { modules: ShipModule[]; selectedId: ModuleId; onSelect: (id: ModuleId) => void; generatedAt: string; ship: ShipController }) {
  const selected = modules.find(module => module.id === selectedId) ?? modules[0]!;
  const summary = moduleSummary(modules);
  const available = ship.frame.environmentQuality === "fresh";
  return <section className="modules-workspace" aria-labelledby="modules-heading">
    <div className="modules-workspace__heading"><div><p className="ship-readout__eyebrow">Shared environment</p><h1 id="modules-heading">Modules</h1><p>Conditions and crew presence, space by space.</p></div><span className="module-connection-count"><InterfaceIcon name="signal" />{summary.connected}/{modules.length} sources available</span></div>
    <div className="modules-layout">
      <aside className="module-selector" aria-label="Choose a module">{modules.map(module => <button type="button" key={module.id} aria-pressed={module.id === selectedId} data-module-state={module.state} onClick={() => onSelect(module.id)}><InterfaceIcon name={module.icon} /><span>{module.name}<small>{MODULE_LABELS[module.state]}</small></span><span className="module-state-dot" /></button>)}</aside>
      <div className="module-mobile-picker"><SelectMenu label="Module" value={selectedId} options={modules.map(module => ({ value: module.id, label: module.name, description: MODULE_LABELS[module.state] }))} onChange={value => onSelect(value as ModuleId)} /></div>
      <article className="module-detail" key={selected.id} data-module-state={selected.state}>
        <header className="module-detail__heading"><span className="module-detail__icon"><InterfaceIcon name={selected.icon} /></span><div><h2>{selected.name}</h2><p>{selected.purpose}</p></div><span className="module-detail__badge"><span className="module-state-dot" />{MODULE_LABELS[selected.state]}</span></header>
        <div className="module-detail__source"><InterfaceIcon name="signal" /><span>{available ? "Synthetic snapshot" : "No current telemetry"}</span>{available && <time dateTime={generatedAt}>{new Date(generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</time>}</div>
        <p className="data-quality" data-quality={ship.frame.environmentQuality}>Environment: {ship.frame.environmentQuality} · Position: {ship.frame.locationQuality}<br />Source: simulated ship adapter · {ship.running ? "Auto updates every 5 s" : "Telemetry paused"}</p>
        <div className="module-measurements" aria-label={`${selected.name} environmental readings`}>
          <div><span><InterfaceIcon name="co2" />Carbon dioxide</span><p>{available ? selected.co2.toFixed(1) : "—"}<small>{available ? "mmHg ppCO₂" : "No data"}</small></p><span>Cabin partial pressure</span></div>
          <div><span><InterfaceIcon name="temperature" />Temperature</span><p>{available ? selected.temperature.toFixed(1) : "—"}<small>{available ? "°C" : "No data"}</small></p><span>Cabin air</span></div>
          <div><span><InterfaceIcon name="humidity" />Humidity</span><p>{available ? selected.humidity : "—"}<small>{available ? "% RH" : "No data"}</small></p><span>Relative humidity</span></div>
        </div>
        <section className="module-crew"><div><h3>Crew presence</h3><p>Automatic simulated positioning.</p></div>{ship.frame.locationQuality !== "fresh" ? <span>Position source unavailable or stale; occupancy unknown</span> : selected.crew.length ? <ul>{selected.crew.map(name => <li key={name}><span className="crew-avatar">{name.charAt(0)}</span><span>{name}<small>Recorded in this module</small></span></li>)}</ul> : <span>No crew recorded in this module</span>}</section>
        {selected.state !== "nominal" && <div className="module-review-note"><h3>{available ? "Review this module" : "Check the data source"}</h3><p>{available ? "This module is flagged by the selected demo scenario. Review the available readings with the responsible crew member. No cause or medical condition has been established." : "Current conditions and crew positions cannot be confirmed. Missing telemetry does not mean that the module is safe or unsafe."}</p></div>}
        <Disclosure title="About these module readings" className="module-about"><p>All values, crew positions and module labels are synthetic. Demo tools select prepared interface scenarios; labels do not represent validated environmental safety thresholds.</p><p>Carbon dioxide is shown as partial pressure in mmHg. It is a cabin measurement, separate from a person's blood oxygen saturation. This preview does not measure cabin oxygen or control life-support equipment.</p><p>A real deployment would require a read-only adapter to the spacecraft's environmental and positioning systems, including source identifiers, timestamps and signal quality. No such hardware connection is active.</p></Disclosure>
      </article>
    </div>
    <p className="ship-workspace-note">Personal measurements remain separate. Switch to Personal to view your health history.</p>
  </section>;
}
