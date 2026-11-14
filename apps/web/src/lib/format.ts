export function formatTime(iso: string | null): string {
  if (!iso) {
    return "no reading";
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
