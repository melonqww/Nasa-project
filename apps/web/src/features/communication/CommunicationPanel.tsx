import { BottomPanel } from "../../components/overlays";

import "./communication-panel.css";

/**
 * Communication dock. Only the collapsed handle and an honest placeholder are
 * present in this stage; report preview and sending are connected later.
 */
export function CommunicationPanel() {
  return (
    <BottomPanel id="communication" title="Communication">
      <div className="communication-stub">
        <p>
          Report preview and sending are not connected in this stage. No message is queued or
          sent, and no result is claimed.
        </p>
        <p className="communication-stub__note">Planned: preview, send and automatic sending.</p>
      </div>
    </BottomPanel>
  );
}
