import { useEffect, useState } from "react";
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const date = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });

export function EarthClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="earth-clock" aria-label="Current Earth time in UTC">
    <span className="earth-clock__label">Earth time <span>UTC</span></span>
    <time dateTime={now.toISOString()} className="earth-clock__time">{clock.format(now)}</time>
    <span className="earth-clock__date">{date.format(now)}</span>
  </div>;
}
