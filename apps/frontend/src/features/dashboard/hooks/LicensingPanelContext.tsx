import { createContext, useContext, ReactNode } from "react";
import { useLicensingPanel } from "./useLicensingPanel";
import type { LicensesPanelProps } from "../components/LicensesPanel.types";

type LicensingPanelContextType = ReturnType<typeof useLicensingPanel>;

const LicensingPanelContext = createContext<LicensingPanelContextType | null>(null);

export function LicensingPanelProvider({ 
  children, 
  props 
}: { 
  children: ReactNode; 
  props: LicensesPanelProps 
}) {
  const state = useLicensingPanel(props);
  return (
    <LicensingPanelContext.Provider value={state}>
      {children}
    </LicensingPanelContext.Provider>
  );
}

export function useLicensingPanelContext() {
  const context = useContext(LicensingPanelContext);
  if (!context) {
    throw new Error("useLicensingPanelContext must be used within a LicensingPanelProvider");
  }
  return context;
}
