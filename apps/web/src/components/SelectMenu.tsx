import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { InterfaceIcon } from "./InterfaceIcon";
import "./interactions.css";

interface Option { value: string; label: string; description: string }
export function SelectMenu({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => { if (open) buttons.current[active]?.focus(); }, [open, active]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const keyboard = (event: KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!open) { setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(true); return; }
      setActive(index => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
  };
  return <div className="select-menu" ref={ref} data-open={open} onKeyDown={keyboard} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <span id={`${id}-label`} className="select-menu__label">{label}</span>
    <button ref={trigger} type="button" className="select-menu__trigger" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => {
      setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(!open);
    }}><span id={`${id}-value`}>{options.find(option => option.value === value)?.label}</span><InterfaceIcon name="chevron" className="expand-chevron" /></button>
    <div className="select-menu__popup animated-popover" data-open={open} inert={!open}>
      <div role="listbox" id={id} aria-labelledby={`${id}-label`}>
        {options.map((option, index) => <button type="button" role="option" aria-selected={value === option.value} tabIndex={active === index ? 0 : -1}
          key={option.value} ref={node => { buttons.current[index] = node; }} onFocus={() => setActive(index)} onClick={() => { onChange(option.value); close(); }}>
          <span>{option.label}<small>{option.description}</small></span><span className="select-menu__check" aria-hidden="true">{value === option.value ? "✓" : ""}</span>
        </button>)}
      </div>
    </div>
  </div>;
}
