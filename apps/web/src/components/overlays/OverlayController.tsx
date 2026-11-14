import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PanelId = "health" | "assistance";

interface OverlayContextValue {
  activePanel: PanelId | null;
  isOpen: (id: PanelId) => boolean;
  openPanel: (id: PanelId) => void;
  closePanel: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Coordinates the single large overlay used by the crew interface. Only one
 * overlay can be open at a time, so layers never stack into nested modals.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

  const openPanel = useCallback((id: PanelId) => {
    setActivePanel(id);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const value = useMemo<OverlayContextValue>(
    () => ({
      activePanel,
      isOpen: (id) => activePanel === id,
      openPanel,
      closePanel,
    }),
    [activePanel, openPanel, closePanel],
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
