import type {
  Activation,
  License,
  ManagedApp,
  Stats,
} from "../../features/dashboard/types/dashboard";
import { apiRequest, parseJsonResponse } from "./base";

// --- Normalization Helpers ---

function deriveLicenseType(
  raw: Record<string, unknown>,
): "machine_id_bound" | "pre_generated" {
  const directType = raw.licenseType;
  if (directType === "machine_id_bound" || directType === "pre_generated") {
    return directType;
  }

  const metadataRaw = raw.metadata;
  if (typeof metadataRaw === "string" && metadataRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(metadataRaw) as { lockedMachineId?: string };
      if (parsed.lockedMachineId?.trim()) return "machine_id_bound";
    } catch {
      // Ignore malformed metadata and fallback below.
    }
  } else if (metadataRaw && typeof metadataRaw === "object") {
    const maybeLocked = (metadataRaw as { lockedMachineId?: string })
      .lockedMachineId;
    if (typeof maybeLocked === "string" && maybeLocked.trim().length > 0) {
      return "machine_id_bound";
    }
  }

  return "pre_generated";
}

export function normalizeLicense(raw: Record<string, unknown>): License {
  return {
    id: String(raw.id || ""),
    appName: String(raw.appName || ""),
    licenseKey: String(raw.licenseKey || ""),
    status: raw.status === "revoked" ? "revoked" : "active",
    maxActivations: Number(raw.maxActivations || 0),
    activeActivations: Number(raw.activeActivations || 0),
    remainingActivations: Number(raw.remainingActivations || 0),
    expiresAt: (raw.expiresAt as string | null | undefined) ?? null,
    createdAt: String(raw.createdAt || ""),
    updatedAt: String(raw.updatedAt || ""),
    licenseType: deriveLicenseType(raw),
  };
}

export function normalizeActivation(raw: Record<string, unknown>): Activation {
  let requestReason: string | null = null;
  let requestPlatform: string | null = null;
  let requestSource: string | null = null;

  const metadataRaw = raw.metadata;
  if (typeof metadataRaw === "string" && metadataRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(metadataRaw) as {
        reason?: string;
        platform?: string;
        source?: string;
      };
      requestReason = parsed.reason?.trim() || null;
      requestPlatform = parsed.platform?.trim() || null;
      requestSource = parsed.source?.trim() || null;
    } catch {
      requestReason = null;
      requestPlatform = null;
      requestSource = null;
    }
  }

  return {
    id: String(raw.id || ""),
    requestType:
      raw.requestType === "request_only"
        ? "request_only"
        : "license_activation",
    appName: String(raw.appName || ""),
    appVersion: String(raw.appVersion || ""),
    licenseKey: String(raw.licenseKey || ""),
    machineId: String(raw.machineId || ""),
    shopName:
      typeof raw.shopName === "string" && raw.shopName.trim().length > 0
        ? raw.shopName
        : null,
    phone:
      typeof raw.phone === "string" && raw.phone.trim().length > 0
        ? raw.phone
        : null,
    notes:
      typeof raw.notes === "string" && raw.notes.trim().length > 0
        ? raw.notes
        : null,
    status:
      raw.status === "active"
        ? "active"
        : raw.status === "revoked"
          ? "revoked"
          : raw.status === "expired"
            ? "expired"
            : "pending",
    requestReason,
    requestPlatform,
    requestSource,
    createdAt: String(raw.createdAt || ""),
    activatedAt:
      typeof raw.activatedAt === "string" ? raw.activatedAt : undefined,
  };
}

// --- API Functions ---

export async function fetchActivations(): Promise<Activation[] | null> {
  const response = await apiRequest("/activations");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch activations");

  const data = await parseJsonResponse<{
    activations?: Record<string, unknown>[];
  }>(response);
  return (data?.activations || []).map((activation) =>
    normalizeActivation(activation),
  );
}

export async function fetchStats(): Promise<Stats | null> {
  const response = await apiRequest("/activations/stats");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch stats");

  const data = await parseJsonResponse<{ stats?: Stats }>(response);
  return data?.stats || { total: 0, active: 0, pending: 0, revoked: 0 };
}

export async function updateActivationStatus(
  id: string,
  nextAction: "approve" | "revoke",
): Promise<boolean> {
  const response = await apiRequest(`/activations/${id}/${nextAction}`, {
    method: "PATCH",
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error(`Failed to ${nextAction} activation`);
  }

  return true;
}

export async function deleteActivation(id: string): Promise<boolean> {
  const response = await apiRequest(`/activations/${id}`, {
    method: "DELETE",
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error("Failed to delete activation");
  }

  return true;
}

export async function fetchLicenses(
  appName?: string,
): Promise<License[] | null> {
  const params = new URLSearchParams();
  if (appName?.trim()) {
    params.set("appName", appName.trim());
  }

  const path = params.size ? `/licenses?${params.toString()}` : "/licenses";
  const response = await apiRequest(path);
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch licenses");

  const data = await parseJsonResponse<{
    licenses?: Record<string, unknown>[];
  }>(response);
  return (data?.licenses || []).map((license) => normalizeLicense(license));
}

export async function createLicense(input: {
  appName: string;
  maxActivations: number;
  lockedMachineId?: string;
}): Promise<License | null> {
  const response = await apiRequest("/licenses", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("Failed to create license");
  }

  const data = await parseJsonResponse<{ license?: Record<string, unknown> }>(
    response,
  );
  if (!data?.license) {
    throw new Error("License payload missing");
  }
  return normalizeLicense(data.license);
}

export async function setLicenseStatus(
  id: string,
  nextStatus: "active" | "revoked",
): Promise<boolean> {
  const endpoint = nextStatus === "active" ? "activate" : "revoke";
  const response = await apiRequest(`/licenses/${id}/${endpoint}`, {
    method: "PATCH",
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error(`Failed to set license status to ${nextStatus}`);
  }

  return true;
}

export async function fetchApps(): Promise<ManagedApp[] | null> {
  const response = await apiRequest("/apps");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch apps");

  const data = await parseJsonResponse<{ apps?: ManagedApp[] }>(response);
  return data?.apps || [];
}

export async function createManagedApp(name: string): Promise<boolean> {
  const response = await apiRequest("/apps", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error("Failed to create app");
  }

  return true;
}

export async function updateManagedApp(
  id: string,
  input: { name?: string; status?: "active" | "inactive" },
): Promise<boolean> {
  const response = await apiRequest(`/apps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error("Failed to update app");
  }

  return true;
}

export async function deleteManagedApp(id: string): Promise<boolean> {
  const response = await apiRequest(`/apps/${id}`, {
    method: "DELETE",
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error("Failed to delete app");
  }

  return true;
}

export async function updateLicense(
  id: string,
  input: { maxActivations?: number; status?: "active" | "revoked" },
): Promise<boolean> {
  const response = await apiRequest(`/licenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error("Failed to update license");
  }

  return true;
}

export async function deleteLicense(id: string): Promise<boolean> {
  const response = await apiRequest(`/licenses/${id}`, {
    method: "DELETE",
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error("Failed to delete license");
  }

  return true;
}
