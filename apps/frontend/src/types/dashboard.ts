export type ActivationStatus = "pending" | "active" | "revoked" | "expired";

export interface Activation {
  id: string;
  appName: string;
  appVersion: string;
  licenseKey: string;
  machineId: string;
  shopName?: string | null;
  status: ActivationStatus;
  createdAt: string;
  activatedAt?: string;
}

export interface Stats {
  total: number;
  active: number;
  pending: number;
  revoked: number;
}

export type ActivationFilter = "all" | "pending" | "active" | "revoked";

export interface License {
  id: string;
  appName: string;
  licenseKey: string;
  status: "active" | "revoked";
  maxActivations: number;
  activeActivations: number;
  remainingActivations: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedApp {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
