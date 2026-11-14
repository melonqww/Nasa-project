import { useId, useState, type ReactNode } from "react";
import { InterfaceIcon } from "./InterfaceIcon";
import "./interactions.css";

export function Disclosure({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <section className={`disclosure ${className}`} data-open={open}>
    <button className="disclosure__trigger" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      {title}<InterfaceIcon name="chevron" className="expand-chevron" />
    </button>
    <div className="disclosure__reveal" id={id} inert={!open} aria-hidden={!open}>
      <div className="disclosure__body">{children}</div>
    </div>
  </section>;
}
