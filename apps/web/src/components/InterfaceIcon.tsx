import type { ReactNode, SVGProps } from "react";

export type IconName = "status" | "heart" | "history" | "send" | "oxygen" | "sleep" | "wellbeing" | "activity" | "chevron" | "temperature" | "pressure" | "sliders" | "ambulance" | "help" | "plan" | "check" | "ship" | "person" | "modules" | "command" | "habitat" | "lab" | "medical" | "signal" | "humidity" | "co2" | "mic";
const paths: Record<IconName, ReactNode> = {
  mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/></>,
  humidity: <><path d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 16a4 4 0 0 0 4 4"/></>,
  co2: <><circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="12" cy="21" r="1.5"/><path d="m6 7 4 3m4 0 4-3m-6 8v4"/></>,
  ship: <><path d="M7 8h9l5 3v2l-5 3H7V8Z"/><path d="M7 10H4l-2-2v8l2-2h3M11 8V3h4v5m-4 8v5h4v-5m0-13v5m0 8v5M18 10v4M4 10v4"/></>,
  person: <><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></>,
  modules: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></>,
  command: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2ZM12 1v2m0 18v2M1 12h2m18 0h2"/></>,
  habitat: <><path d="M3 20V9l9-6 9 6v11H3Zm6 0v-7h6v7M7 9h.01M17 9h.01"/></>,
  lab: <><path d="M9 3h6m-5 0v7L4 19a1.3 1.3 0 0 0 1.1 2h13.8a1.3 1.3 0 0 0 1.1-2l-6-9V3M7 15h10"/><path d="M10 18h.01m4-1h.01"/></>,
  medical: <><rect x="4" y="6" width="16" height="15" rx="3"/><path d="M9 6V3h6v3m-3 4v7m-3.5-3.5h7"/></>,
  signal: <><path d="M4 19v-3m5 3v-7m5 7V8m5 11V4"/></>,
  help: <><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-9a9 9 0 0 1 18-1Z"/><path d="M11 7v7m-3.5-3.5h7"/></>,
  plan: <><rect x="4" y="4" width="16" height="17" rx="3"/><path d="M8 2v4m8-4v4M4 9h16m-12 5 2 2 5-4"/></>,
  check: <path d="m5 12 4 4 10-10"/>,
  ambulance: <><path d="M3 17V5h11v12M14 9h4l3 4v4h-2M3 17h2m4 0h6M17 9v5h4M6 9h5M8.5 6.5v5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
  sliders: <><path d="M4 7h8m4 0h4M4 17h3m4 0h9"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></>,
  temperature: <><path d="M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z"/><path d="M12 8v10"/></>,
  pressure: <><circle cx="12" cy="12" r="9"/><path d="m12 12 4-4M5 12h1M12 5v1M18 12h1M8 18h8"/></>,
  status: <circle cx="12" cy="12" r="8.5" />,
  heart: <><path d="M20.8 5.9a5 5 0 0 0-7.1 0L12 7.6l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8a5 5 0 0 0 0-7.1Z"/><path d="M4.5 12h4l2-4 3 8 2-4h4"/></>,
  history: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  send: <><path d="m21 3-6.5 18-4-7.5L3 9.5 21 3Z"/><path d="m10.5 13.5 5-5"/></>,
  oxygen: <><path d="M10 6v8c0 4-7 5-7 1 0-3 3-9 5-9M14 6v8c0 4 7 5 7 1 0-3-3-9-5-9M12 3v6m0 0-4 3m4-3 4 3"/></>,
  sleep: <path d="M20 14.3A8.5 8.5 0 0 1 9.7 4a8.5 8.5 0 1 0 10.3 10.3Z"/>,
  wellbeing: <><circle cx="12" cy="12" r="9"/><path d="M8 14s1 3 4 3 4-3 4-3M8 8.5h.01M16 8.5h.01"/></>,
  activity: <><circle cx="15" cy="4" r="2"/><path d="m8 9 4-2 4 4 4 1M12 7l-2 7 5 3 2 5M10 14l-3 6H3M8 9l-3 4"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
};

export function InterfaceIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
