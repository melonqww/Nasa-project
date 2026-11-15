import "./orbital-photo.css";

export function OrbitalBackdrop({ active }: { active: boolean }) {
  return <div className="ship-orbit-backdrop" data-active={active} aria-hidden="true"><div className="ship-orbit-backdrop__image" /></div>;
}
