import type { ActivationFilter } from "../types/dashboard";

export interface LicensesPanelProps {
  activationFilter: ActivationFilter;
  onActivationFilterChange: (value: ActivationFilter) => void;
  onLogout: () => void;
  activationError?: string;
}

export interface AppSummary {
  appName: string;
  licenses: number;
  activeActivations: number;
  maxActivations: number;
}

export interface EditAppState {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export interface EditLicenseState {
  id: string;
  maxActivations: string;
  status: "active" | "revoked";
}
