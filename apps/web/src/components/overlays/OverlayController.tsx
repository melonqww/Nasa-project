import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PanelId = "details" | "communication";
export type PanelMode = "collapsed" | "peek" | "expanded";

interface OpenPanel {
  id: PanelId;
  mode: Exclude<PanelMode, "collapsed">;
}

interface OverlayContextValue {
  open: OpenPanel | null;
  modeOf: (id: PanelId) => PanelMode;
  showPeek: (id: PanelId) => void;
  expand: (id: PanelId) => void;
  collapse: () => void;
  /** Handle click: peek first when available, then expanded, then collapsed. */
  toggle: (id: PanelId, hasPeek: boolean) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Coordinates all expandable bottom panels. Only one panel can be open at a
 * time, so layers never stack into nested modals.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<OpenPanel | null>(null);

  const showPeek = useCallback((id: PanelId) => {
    setOpen({ id, mode: "peek" });
  }, []);

  const expand = useCallback((id: PanelId) => {
    setOpen({ id, mode: "expanded" });
  }, []);

  const collapse = useCallback(() => {
    setOpen(null);
  }, []);

  const toggle = useCallback((id: PanelId, hasPeek: boolean) => {
    setOpen((current) => {
      if (current?.id !== id) {
        return { id, mode: hasPeek ? "peek" : "expanded" };
      }
      if (current.mode === "expanded") {
        return null;
      }
      return { id, mode: "expanded" };
    });
  }, []);

  const value = useMemo<OverlayContextValue>(
    () => ({
      open,
      modeOf: (id) => (open?.id === id ? open.mode : "collapsed"),
      showPeek,
      expand,
      collapse,
      toggle,
    }),
    [open, showPeek, expand, collapse, toggle],
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlayController(): OverlayContextValue {
  const value = useContext(OverlayContext);
  if (!value) {
    throw new Error("useOverlayController must be used inside OverlayProvider");
  }
  return value;
}
