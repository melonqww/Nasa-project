import type { HealthEvent } from "@ahm/contracts";

const when = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
export function EventJournal({ events }: { events: HealthEvent[] }) {
  return <section className="event-journal"><h2>Event journal</h2><p>State changes and data actions in this session. Measurement graphs live in Health.</p>
    {events.length === 0 ? <div className="event-journal__empty"><h2>No events yet</h2><p>Generate sample history or select a demo state from Demo tools to begin.</p></div> :
      <ol>{events.map(event => <li key={event.id}><time dateTime={event.at}>{when.format(new Date(event.at))} UTC</time><div><h2>{event.title}</h2><p>{event.detail}</p></div><span>{event.kind}</span></li>)}</ol>}
    <p className="event-journal__note">Synthetic demo actions only. The journal is not a clinical record and is not saved after reload.</p>
  </section>;
}
