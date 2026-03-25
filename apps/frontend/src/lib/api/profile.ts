import type { FreelancerProfile } from "../../features/dashboard/types/dashboard";
import { authClient } from "../auth-client";
import { apiRequest, parseJsonResponse } from "./base";

export async function fetchUserEmail(): Promise<string | null> {
  const session = await authClient.getSession();
  if (!session.authenticated || !session.user) {
    return null;
  }

  return session.user.email;
}

export async function fetchFreelancerProfile(): Promise<FreelancerProfile | null> {
  const response = await apiRequest("/freelancer-profile");
  if (response.status === 401) return null;
  if (!response.ok) {
    const errorPayload = await parseJsonResponse<{ error?: string }>(response);
    // Keep the dashboard usable even if profile storage is temporarily unavailable.
    if (response.status >= 500) return null;
    throw new Error(
      errorPayload?.error || "Failed to fetch freelancer profile",
    );
  }

  const data = await parseJsonResponse<{ profile?: FreelancerProfile | null }>(
    response,
  );
  return data?.profile || null;
}

export async function updateFreelancerProfile(input: {
  businessName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  taxId?: string;
  defaultCurrency?: "USD" | "EUR" | "EGP" | "SAR" | "AED" | "GBP";
  defaultInvoiceLanguage?: "en" | "ar";
  appLanguage?: "en" | "ar";
}): Promise<FreelancerProfile | null> {
  const response = await apiRequest("/freelancer-profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    const errorPayload = await parseJsonResponse<{ error?: string }>(response);
    throw new Error(
      errorPayload?.error || "Failed to update freelancer profile",
    );
  }

  const data = await parseJsonResponse<{ profile?: FreelancerProfile }>(
    response,
  );
  return data?.profile || null;
}

export async function uploadFreelancerLogo(
  file: File,
): Promise<FreelancerProfile | null> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiRequest("/freelancer-profile/logo", {
    method: "POST",
    body: formData,
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    const errorPayload = await parseJsonResponse<{ error?: string }>(response);
    throw new Error(errorPayload?.error || "Failed to upload freelancer logo");
  }

  const data = await parseJsonResponse<{ profile?: FreelancerProfile }>(
    response,
  );
  return data?.profile || null;
}
