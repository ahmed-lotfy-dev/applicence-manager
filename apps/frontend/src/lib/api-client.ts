import { authClient } from './auth-client';
import type { Activation, License, ManagedApp, Stats } from '../types/dashboard';

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

function apiUrl(path: string): string {
  if (!API_BASE_URL) return `/api${path}`;
  if (API_BASE_URL.endsWith('/api')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/api${path}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function isStateChangingMethod(method?: string): boolean {
  const normalized = (method || 'GET').toUpperCase();
  return normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE';
}

function deriveLicenseType(raw: Record<string, unknown>): "machine_id_bound" | "pre_generated" {
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
    const maybeLocked = (metadataRaw as { lockedMachineId?: string }).lockedMachineId;
    if (typeof maybeLocked === "string" && maybeLocked.trim().length > 0) {
      return "machine_id_bound";
    }
  }

  return "pre_generated";
}

function normalizeLicense(raw: Record<string, unknown>): License {
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

async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const csrfToken = isStateChangingMethod(method) ? await authClient.getCsrfToken() : null;

  return fetch(apiUrl(path), {
    ...init,
    method,
    credentials: 'include',
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...(init?.headers || {}),
    },
  });
}

export async function fetchActivations(): Promise<Activation[] | null> {
  const response = await apiRequest('/activations');
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Failed to fetch activations');

  const data = await parseJsonResponse<{ activations?: Activation[] }>(response);
  return data?.activations || [];
}

export async function fetchStats(): Promise<Stats | null> {
  const response = await apiRequest('/activations/stats');
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Failed to fetch stats');

  const data = await parseJsonResponse<{ stats?: Stats }>(response);
  return data?.stats || { total: 0, active: 0, pending: 0, revoked: 0 };
}

export async function updateActivationStatus(
  id: string,
  nextAction: 'approve' | 'revoke',
): Promise<boolean> {
  const response = await apiRequest(`/activations/${id}/${nextAction}`, {
    method: 'PATCH',
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error(`Failed to ${nextAction} activation`);
  }

  return true;
}

export async function fetchUserEmail(): Promise<string | null> {
  const session = await authClient.getSession();
  if (!session.authenticated || !session.user) {
    return null;
  }

  return session.user.email;
}

export async function fetchLicenses(appName?: string): Promise<License[] | null> {
  const params = new URLSearchParams();
  if (appName?.trim()) {
    params.set('appName', appName.trim());
  }

  const path = params.size ? `/licenses?${params.toString()}` : '/licenses';
  const response = await apiRequest(path);
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Failed to fetch licenses');

  const data = await parseJsonResponse<{ licenses?: Record<string, unknown>[] }>(response);
  return (data?.licenses || []).map((license) => normalizeLicense(license));
}

export async function createLicense(input: {
  appName: string;
  maxActivations: number;
  lockedMachineId?: string;
}): Promise<License | null> {
  const response = await apiRequest('/licenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error('Failed to create license');
  }

  const data = await parseJsonResponse<{ license?: Record<string, unknown> }>(response);
  if (!data?.license) {
    throw new Error('License payload missing');
  }
  return normalizeLicense(data.license);
}

export async function setLicenseStatus(
  id: string,
  nextStatus: 'active' | 'revoked',
): Promise<boolean> {
  const endpoint = nextStatus === 'active' ? 'activate' : 'revoke';
  const response = await apiRequest(`/licenses/${id}/${endpoint}`, {
    method: 'PATCH',
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error(`Failed to set license status to ${nextStatus}`);
  }

  return true;
}

export async function fetchApps(): Promise<ManagedApp[] | null> {
  const response = await apiRequest('/apps');
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Failed to fetch apps');

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
  input: { name?: string; status?: 'active' | 'inactive' },
): Promise<boolean> {
  const response = await apiRequest(`/apps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error('Failed to update app');
  }

  return true;
}

export async function deleteManagedApp(id: string): Promise<boolean> {
  const response = await apiRequest(`/apps/${id}`, {
    method: 'DELETE',
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error('Failed to delete app');
  }

  return true;
}

export async function updateLicense(
  id: string,
  input: { maxActivations?: number; status?: 'active' | 'revoked' },
): Promise<boolean> {
  const response = await apiRequest(`/licenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error('Failed to update license');
  }

  return true;
}

export async function deleteLicense(id: string): Promise<boolean> {
  const response = await apiRequest(`/licenses/${id}`, {
    method: 'DELETE',
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error('Failed to delete license');
  }

  return true;
}

export interface PublicLicenseActivationPayload {
  appName: string;
  licenseKey: string;
  machineId: string;
  appVersion: string;
  metadata?: unknown;
}

export interface PublicLicenseValidationPayload {
  appName: string;
  machineId: string;
  activationToken: string;
}

export type ActivationType = 'machine_id_bound' | 'pre_generated';

export interface PublicLicenseActivateResponse {
  success: boolean;
  error?: string;
  appName?: string;
  activationToken?: string;
  tokenExpiresAt?: string;
  activation?: {
    id: string;
    appName: string;
    machineId: string;
    status: string;
  };
  license?: {
    id: string;
    appName: string;
    maxActivations: number;
    expiresAt: string | null;
  };
  activationType?: ActivationType;
  maxActivations?: number;
  usedActivations?: number;
  remainingActivations?: number;
}

export interface PublicLicenseValidateResponse {
  success: boolean;
  isValid: boolean;
  error?: string;
  reason?: string;
  license?: {
    id: string;
    appName: string;
    expiresAt: string | null;
  };
  activation?: {
    id: string;
    status: string;
    expiresAt: string | null;
  };
  activationType?: ActivationType;
  maxActivations?: number;
  usedActivations?: number;
  remainingActivations?: number;
}

export interface PublicLicenseDeactivateResponse {
  success: boolean;
  error?: string;
  activationType?: ActivationType;
  maxActivations?: number;
  usedActivations?: number;
  remainingActivations?: number;
}

export async function activatePublicLicense(
  input: PublicLicenseActivationPayload,
): Promise<PublicLicenseActivateResponse> {
  const response = await apiRequest('/v1/license/activate', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  const data = await parseJsonResponse<PublicLicenseActivateResponse>(response);
  if (!data) {
    throw new Error('Invalid activation response payload');
  }
  return data;
}

export async function validatePublicLicense(
  input: PublicLicenseValidationPayload,
): Promise<PublicLicenseValidateResponse> {
  const response = await apiRequest('/v1/license/validate', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  const data = await parseJsonResponse<PublicLicenseValidateResponse>(response);
  if (!data) {
    throw new Error('Invalid validation response payload');
  }
  return data;
}

export async function deactivatePublicLicense(
  input: PublicLicenseValidationPayload,
): Promise<PublicLicenseDeactivateResponse> {
  const response = await apiRequest('/v1/license/deactivate', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  const data = await parseJsonResponse<PublicLicenseDeactivateResponse>(response);
  if (!data) {
    throw new Error('Invalid deactivation response payload');
  }
  return data;
}
