import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import { useOverlayController, type PanelId } from "./OverlayController";

import "./bottom-panel.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface BottomPanelProps {
  id: PanelId;
  title: string;
  /** Short plaque shown above the handle in the peek state. */
  peek?: ReactNode;
  /** Full details shown when the panel is expanded. */
  children: ReactNode;
}

/**
 * Reusable bottom panel with three states: collapsed (handle only), peek
 * (compact plaque) and expanded (full height over the page).
 *
 * Expanded panels behave as a dialog: Escape and the close button close it,
 * focus is kept inside, background scrolling is locked, and focus returns to
 * the handle. The page itself is never unmounted and the URL never changes.
 */
export function BottomPanel({ id, title, peek, children }: BottomPanelProps) {
  const { modeOf, expand, collapse, toggle } = useOverlayController();
  const mode = modeOf(id);
  const hasPeek = peek !== undefined;
  const headingId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mode !== "expanded") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        collapse();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) {
        return;
      }
      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      handleRef.current?.focus();
    };
  }, [mode, collapse]);

  const onSheetKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      collapse();
    }
  };

  return (
    <>
      {mode === "expanded" && (
        <div className="panel-backdrop" onClick={collapse} aria-hidden="true" />
      )}

      <section className="panel-slot" data-mode={mode} aria-label={title}>
        {mode === "expanded" ? (
          <div
            className="panel-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            tabIndex={-1}
            ref={sheetRef}
            onKeyDown={onSheetKeyDown}
          >
            <header className="panel-sheet__header">
              <h2 className="panel-sheet__title" id={headingId}>
                {title}
              </h2>
              <button type="button" className="panel-sheet__close" onClick={collapse}>
                Close
                <span aria-hidden="true">✕</span>
              </button>
            </header>
            <div className="panel-sheet__body">{children}</div>
          </div>
        ) : (
          <>
            {mode === "peek" && hasPeek && (
              <button
                type="button"
                className="panel-peek"
                onClick={() => expand(id)}
                aria-label={`Open full details: ${title}`}
              >
                {peek}
                <span className="panel-peek__hint" aria-hidden="true">
                  Open
                  <span className="panel-chevron" data-direction="up">
                    ▲
                  </span>
                </span>
              </button>
            )}
            <button
              type="button"
              className="panel-handle"
              ref={handleRef}
              onClick={() => toggle(id, hasPeek)}
              aria-expanded={mode === "peek"}
            >
              <span className="panel-chevron" data-direction="up" aria-hidden="true">
                ▲
              </span>
              <span className="panel-handle__title">{title}</span>
            </button>
          </>
        )}

        {mode === "expanded" && (
          <button
            type="button"
            className="panel-handle"
            ref={handleRef}
            onClick={collapse}
            aria-expanded={true}
          >
            <span className="panel-chevron" data-direction="down" aria-hidden="true">
              ▼
            </span>
            <span className="panel-handle__title">Collapse</span>
          </button>
        )}
      </section>
    </>
  );
}
