import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { useOverlayController, type PanelId } from "./OverlayController";

import "./overlay-panel.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface OverlayPanelProps {
  id: PanelId;
  title: string;
  children: ReactNode;
}

/**
 * Single large overlay window rendered above the page. The page itself is not
 * unmounted and the URL never changes.
 *
 * The overlay behaves as a dialog: Escape and the close button close it, focus
 * is kept inside, background scrolling is locked, and focus returns to the
 * element that opened it.
 */
export function OverlayPanel({ id, title, children }: OverlayPanelProps) {
  const { isOpen, closePanel } = useOverlayController();
  const open = isOpen(id);
  const [present, setPresent] = useState(open);
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setPresent(true); return; }
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300;
    const timeout = window.setTimeout(() => setPresent(false), delay);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || !present) {
      return;
    }

    const trigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }

      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !dialogRef.current.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, present, closePanel]);

  if (!present) {
    return null;
  }

  return (
    <div className="overlay" data-panel={id} data-open={open} aria-hidden={!open} inert={!open}>
      <div className="overlay__backdrop" onClick={closePanel} aria-hidden="true" />

      <div
        className="overlay__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="overlay__header">
          <div className="overlay__heading">
            <p className="overlay__eyebrow">Simulation · synthetic data</p>
            <h2 className="overlay__title" id={headingId}>
              {title}
            </h2>
          </div>
          <button type="button" className="overlay__close" onClick={closePanel}>
            Close
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="overlay__body">{children}</div>
      </div>
    </div>
  );
}
