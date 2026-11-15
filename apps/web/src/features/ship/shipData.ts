import type { DemoState } from "@ahm/contracts";
import type { IconName } from "../../components/InterfaceIcon";

export type ModuleId = "command" | "habitat-a" | "habitat-b" | "laboratory" | "medical" | "exercise";
export type ModuleState = "nominal" | "review" | "attention" | "unavailable";
export interface ShipModule {
  id: ModuleId;
  name: string;
  purpose: string;
  icon: IconName;
  crew: string[];
  locationQuality?: "fresh" | "stale" | "missing";
  temperature: number;
  humidity: number;
  co2: number;
  state: ModuleState;
}
const MODULES: ShipModule[] = [
  { id: "command", name: "Command", purpose: "Flight operations and shared workstations", icon: "command", crew: ["Dana"], temperature: 22.1, humidity: 42, co2: 1.8, state: "nominal" },
  { id: "habitat-a", name: "Habitat A", purpose: "Crew quarters and quiet rest", icon: "habitat", crew: ["Alex"], temperature: 21.6, humidity: 44, co2: 2.1, state: "nominal" },
  { id: "habitat-b", name: "Habitat B", purpose: "Crew quarters and shared living space", icon: "sleep", crew: [], temperature: 21.8, humidity: 43, co2: 1.9, state: "nominal" },
  { id: "laboratory", name: "Laboratory", purpose: "Research and sample preparation", icon: "lab", crew: ["Sam"], temperature: 22.4, humidity: 41, co2: 2.0, state: "nominal" },
  { id: "medical", name: "Medical", purpose: "Health checks and medical equipment", icon: "medical", crew: [], temperature: 22.0, humidity: 45, co2: 1.7, state: "nominal" },
  { id: "exercise", name: "Exercise", purpose: "Scheduled exercise and recovery", icon: "activity", crew: [], temperature: 22.3, humidity: 46, co2: 2.2, state: "nominal" },
];
export const MODULE_LABELS: Record<ModuleState, string> = {
  nominal: "Nominal scenario", review: "Review requested", attention: "Attention requested", unavailable: "Data unavailable",
};

/** Prepared UI scenarios, never inferred environmental or medical safety limits. */
export function createModuleSnapshot(scenario: DemoState, hasData: boolean): ShipModule[] {
  return MODULES.map(module => {
    if (!hasData) return { ...module, state: "unavailable" };
    if (scenario === "missing" && module.id === "laboratory") return { ...module, state: "unavailable" };
    if (scenario === "check" && module.id === "habitat-a") return { ...module, state: "review", co2: 2.8 };
    if (scenario === "urgent" && module.id === "habitat-a") return { ...module, state: "attention", co2: 3.4 };
    return { ...module };
  });
}

export function moduleSummary(modules: ShipModule[]) {
  const unavailable = modules.filter(module => module.state === "unavailable").length;
  const flagged = modules.filter(module => module.state === "review" || module.state === "attention").length;
  const connected = modules.length - unavailable;
  return {
    connected, flagged, unavailable,
    title: connected === 0 ? "Module data is unavailable" : flagged ? `${flagged} module needs attention` : unavailable ? "Some module data is missing" : "All modules are reporting",
    state: modules.some(module => module.state === "attention") ? "attention" : flagged ? "review" : unavailable ? "unavailable" : "nominal",
  };
}
