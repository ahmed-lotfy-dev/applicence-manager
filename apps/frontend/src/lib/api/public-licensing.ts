import { apiRequest, parseJsonResponse } from "./base";

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

export type ActivationType = "machine_id_bound" | "pre_generated";

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
  const response = await apiRequest("/v1/license/activate", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const data = await parseJsonResponse<PublicLicenseActivateResponse>(response);
  if (!data) {
    throw new Error("Invalid activation response payload");
  }
  return data;
}

export async function validatePublicLicense(
  input: PublicLicenseValidationPayload,
): Promise<PublicLicenseValidateResponse> {
  const response = await apiRequest("/v1/license/validate", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const data = await parseJsonResponse<PublicLicenseValidateResponse>(response);
  if (!data) {
    throw new Error("Invalid validation response payload");
  }
  return data;
}

export async function deactivatePublicLicense(
  input: PublicLicenseValidationPayload,
): Promise<PublicLicenseDeactivateResponse> {
  const response = await apiRequest("/v1/license/deactivate", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const data =
    await parseJsonResponse<PublicLicenseDeactivateResponse>(response);
  if (!data) {
    throw new Error("Invalid deactivation response payload");
  }
  return data;
}
