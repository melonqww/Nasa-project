import { useId, useRef, useState, type ReactNode } from "react";
import { MODULE_LABELS, type ModuleId, type ShipModule } from "./shipData";
import "./ship-illustration.css";

interface Props { modules: ShipModule[]; onSelect: (id: ModuleId) => void }

/** Transparent raster cutout with independently accessible vector hit zones.
 * Six UI zones share four illustrated pressure vessels; propulsion is not habitable.
 */
export function ShipIllustration({ modules, onSelect }: Props) {
  const uid = `transit-${useId().replace(/:/g, "")}`;
  const [hovered, setHovered] = useState<ModuleId | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLElement>(null);
  const selected = modules.find(module => module.id === hovered);
  const placePreview = (x: number, y: number) => {
    const bounds = container.current?.getBoundingClientRect();
    if (!bounds || !preview.current) return;
    const left = Math.max(4, Math.min(x - bounds.left + 14, bounds.width - 230));
    preview.current.style.left = `${left}px`;
    preview.current.style.top = `${y - bounds.top + 15}px`;
  };

  const zone = (id: ModuleId, children: ReactNode) => {
    const module = modules.find(item => item.id === id)!;
    const markers: Record<ModuleId, [number, number]> = { "habitat-a": [750,330], "habitat-b": [928,330], laboratory:[1150,330], exercise:[1350,330], medical:[1185,580], command:[1580,365] };
    const [markerX,markerY] = markers[id];
    return <g className="ship-zone" role="button" tabIndex={0} aria-label={`Open ${module.name} module`}
      key={id} data-module-state={module.state} data-active={hovered === id}
      onPointerEnter={event => { if (event.pointerType === "mouse") { setHovered(id); placePreview(event.clientX,event.clientY); } }}
      onPointerMove={event => { if (event.pointerType === "mouse") placePreview(event.clientX,event.clientY); }}
      onPointerLeave={() => setHovered(null)}
      onFocus={event => { setHovered(id); const bounds = event.currentTarget.getBoundingClientRect(); placePreview(bounds.x + bounds.width/2, bounds.y + bounds.height/2); }}
      onBlur={() => setHovered(null)}
      onClick={() => onSelect(id)} onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id); }
      }}>
      {children}
      <circle className="ship-zone__marker" cx={markerX} cy={markerY} r="4" aria-hidden="true" />
    </g>;
  };
  return <div className="ship-illustration" ref={container} onKeyDown={event => { if (event.key === "Escape") setHovered(null); }}>
    <svg className="transit-ship" viewBox="0 0 1774 887" role="group" aria-label="Mars transit spacecraft concept" aria-describedby={`${uid}-description`}>
      <desc id={`${uid}-description`}>Engines and propellant tanks on the left. Two cylindrical living and working bodies, a medical side module and forward command docking section on the right. Choose one of six illustrated zones to view its module.</desc>
      <image href="/images/spacecraft-cutout.png" width="1774" height="887" aria-hidden="true" />
      <g className="transit-ship__vessel">
        {zone("habitat-a", <path className="ship-zone__surface" d="M681 329 704 302H852v251H704l-23-27Z"/>)}
        {zone("habitat-b", <path className="ship-zone__surface" d="M852 302h139l29 29v194l-29 28H852Z"/>)}
        {zone("laboratory", <path className="ship-zone__surface" d="M1065 330 1091 305h170v246h-170l-26-27Z"/>)}
        {zone("exercise", <path className="ship-zone__surface" d="M1261 305h139l38 30v186l-38 30h-139Z"/>)}
        {zone("medical", <path className="ship-zone__surface" d="M1105 578 1129 559h125l26 31v49l-25 28h-126l-24-27Z"/>)}
        {zone("command", <path className="ship-zone__surface" d="M1480 337 1517 313h47l109 64v116l-109 54h-47l-37-28Z"/>)}
      </g>    </svg>
    <aside ref={preview} className="ship-preview" data-open={selected !== undefined} aria-hidden={!selected} aria-label="Module quick view">
      {selected && <><div className="ship-preview__heading"><h2>{selected.name}</h2></div><p>{selected.purpose}</p><span className="ship-preview__state" data-module-state={selected.state}><span className="module-state-dot" />{MODULE_LABELS[selected.state]}</span><dl><div><dt>Crew</dt><dd>{selected.locationQuality && selected.locationQuality !== "fresh" ? "Unknown" : selected.crew.join(", ") || "None recorded"}</dd></div><div><dt>CO₂</dt><dd>{selected.state === "unavailable" ? "No data" : `${selected.co2.toFixed(1)} mmHg`}</dd></div></dl></>}
    </aside>
  </div>;
}
