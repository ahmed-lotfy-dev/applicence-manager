import { createContext, useContext, type ReactNode } from "react";
import { useFreelanceOps } from "./useFreelanceOps";
import type { FreelanceOpsPanelProps } from "../components/FreelanceOpsPanel.types";

type FreelanceOpsContextType = ReturnType<typeof useFreelanceOps>;

const FreelanceOpsContext = createContext<FreelanceOpsContextType | null>(null);

export function FreelanceOpsProvider({
  children,
  props
}: {
  children: ReactNode;
  props: FreelanceOpsPanelProps
}) {
  const ops = useFreelanceOps(props);
  return (
    <FreelanceOpsContext.Provider value={ops}>
      {children}
    </FreelanceOpsContext.Provider>
  );
}

export function useFreelanceOpsContext() {
  const context = useContext(FreelanceOpsContext);
  if (!context) {
    throw new Error("useFreelanceOpsContext must be used within a FreelanceOpsProvider");
  }
  return context;
}
