import { useState } from "react";
import type { HealthUpdate } from "@ahm/contracts";
import { InterfaceIcon } from "../../components/InterfaceIcon";
import { SelectMenu } from "../../components/SelectMenu";
import { Disclosure } from "../../components/Disclosure";
import { EventJournal } from "../history/EventJournal";

export function ReportPreview({ update, onExport }: { update: HealthUpdate; onExport: (recipient: "earth" | "crew") => void }) {
  const [recipient, setRecipient] = useState<"earth" | "crew">("earth");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [includeEvents, setIncludeEvents] = useState(false);
  const [includePlan, setIncludePlan] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const exportReport = () => {
    const report = { version: 1, createdAt: new Date().toISOString(), synthetic: true, intendedRecipient: recipient,
      delivery: "Local file only; not transmitted", snapshotAt: update.snapshot.generatedAt,
      overall: { state: update.snapshot.overall.state, dataCoverage: update.snapshot.overall.dataCoverage,
        reasons: update.snapshot.overall.reasons, evaluatedAt: update.snapshot.overall.updatedAt },
      readings: update.snapshot.metrics.map(({ trend, ...reading }) => includeHistory ? { ...reading, trend } : reading),
      ...(includeEvents ? { events: update.events } : {}),
      ...(includePlan ? { dailyPlan: update.dailyPlan } : {}),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `health-report-${recipient}-simulation.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onExport(recipient); setDownloaded(true);
  };
  return <section className="report-page">
    <div className="report-page__heading"><InterfaceIcon name="send" /><div><h1>Share a health report</h1><p>Choose what to include, review the measurements, then download the file.</p></div></div>
    <div className="report-page__grid">
      <section className="report-options"><h2>Report settings</h2>
        <SelectMenu label="Intended recipient" value={recipient} options={[
          { value: "earth", label: "Earth medical team", description: "Ground medical support" },
          { value: "crew", label: "Crew medical officer", description: "Onboard crew support" },
        ]} onChange={value => { setRecipient(value as "earth" | "crew"); setDownloaded(false); }} />
        <p>Recipient is a label in the report. No connection has been established.</p>
        <label><input type="checkbox" checked={includeHistory} onChange={event => { setIncludeHistory(event.target.checked); setDownloaded(false); }} /> Include measurement history</label>
        <label><input type="checkbox" checked={includeEvents} onChange={event => { setIncludeEvents(event.target.checked); setDownloaded(false); }} /> Include event journal</label>
        <label><input type="checkbox" checked={includePlan} onChange={event => { setIncludePlan(event.target.checked); setDownloaded(false); }} /> Include daily plans and check-in notes</label>
        <button type="button" className="report-download" onClick={exportReport}>Download JSON report</button>
        {downloaded && <p role="status">Download prepared from the selected snapshot. Nothing was transmitted.</p>}
        <p className="report-disclosure">Simulation. Sending to crew or Earth will require a configured communication adapter; delivery and acknowledgement must be tracked separately.</p>
      </section>
      <section className="report-readings"><h2>Report preview</h2><p>{update.snapshot.metrics.filter(item => item.value !== null).length} current measurements · synthetic data</p>
        <dl>{update.snapshot.metrics.map(reading => <div key={reading.metric}><dt>{reading.label}</dt><dd>{reading.value ?? "No data"} {reading.value === null ? "" : reading.unit}</dd></div>)}</dl>
        <p>{includeHistory ? "History included." : "Current values only."} {includeEvents ? `${update.events.length} journal entries included.` : "Journal excluded."}</p>
      </section>
    </div>
    <Disclosure title="Session event journal" className="report-journal"><EventJournal events={update.events} /></Disclosure>
  </section>;
}
