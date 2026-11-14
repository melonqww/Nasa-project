export function formatTime(iso: string | null): string {
  if (!iso) {
    return "no reading";
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Clock time with seconds, used on short history windows. */
export function formatClockTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Up to one decimal, without trailing `.0` for integer values. */
export function formatValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Short human duration for a history span. */
export function formatSpan(seconds: number): string {
  if (seconds >= 86400) return `${formatValue(seconds / 86400)} days`;
  if (seconds < 60) {
    return `${Math.round(seconds)} s`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${formatValue(minutes)} min`;
  }
  return `${formatValue(minutes / 60)} h`;
}
