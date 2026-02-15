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

  const data = await parseJsonResponse<{ licenses?: License[] }>(response);
  return data?.licenses || [];
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

  const data = await parseJsonResponse<{ license?: License }>(response);
  if (!data?.license) {
    throw new Error('License payload missing');
  }
  return data.license;
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
