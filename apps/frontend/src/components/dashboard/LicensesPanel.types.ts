import type { License, ManagedApp } from "../../types/dashboard";

export interface LicensesPanelProps {
  licenses: License[];
  apps: ManagedApp[];
  filterValue: string;
  onFilterChange: (value: string) => void;
  onCreateApp: (name: string) => Promise<boolean>;
  onUpdateApp: (id: string, input: { name?: string; status?: "active" | "inactive" }) => Promise<void>;
  onRemoveApp: (id: string) => Promise<void>;
  onCreateLicense: (input: {
    appName: string;
    maxActivations: number;
    lockedMachineId?: string;
  }) => Promise<License | null>;
  onUpdateLicense: (
    id: string,
    input: { maxActivations?: number; status?: "active" | "revoked" },
  ) => Promise<void>;
  onRemoveLicense: (id: string) => Promise<void>;
  onChangeLicenseStatus: (id: string, nextStatus: "active" | "revoked") => Promise<void>;
  isCreatingLicense: boolean;
  isCreatingApp: boolean;
  appActionLoadingId: string | null;
  licenseActionLoadingId: string | null;
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
