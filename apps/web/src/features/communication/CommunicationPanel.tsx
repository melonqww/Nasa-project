import { useState } from "react";

import "./communication-panel.css";

/**
 * Left-side communication block. It stays visible as a compact card and
 * expands in place. Report preview and sending are not connected in this stage,
 * so the block states that plainly and claims no result.
 */
export function CommunicationPanel() {
  const [open, setOpen] = useState(false);

  return (
    <aside className="communication" data-open={open} aria-label="Communication">
      <button
        type="button"
        className="communication__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="communication__dot" aria-hidden="true" />
        <span className="communication__title">Communication</span>
        <span className="communication__state">Standby</span>
        <span className="communication__action" aria-hidden="true">
          {open ? "Hide" : "Open"}
        </span>
      </button>

      {open && (
        <div className="communication__body">
          <p className="communication__note">
            Report preview and sending are not connected in this stage. No message is queued or
            sent, and no result is claimed.
          </p>
          <p className="communication__planned">
            Planned: report preview, sending and automatic sending. Urgent guidance stays visible
            without opening this block.
          </p>
        </div>
      )}
    </aside>
  );
}
