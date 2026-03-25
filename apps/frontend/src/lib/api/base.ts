import { authClient } from "../auth-client";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

export function apiUrl(path: string): string {
  if (!API_BASE_URL) return `/api${path}`;
  if (API_BASE_URL.endsWith("/api")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/api${path}`;
}

export async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const data = await parseJsonResponse<{ error?: string }>(response);
  return data?.error?.trim() || fallback;
}

export function isStateChangingMethod(method?: string): boolean {
  const normalized = (method || "GET").toUpperCase();
  return (
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE"
  );
}

export async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const csrfToken = isStateChangingMethod(method)
    ? await authClient.getCsrfToken()
    : null;
  const hasFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  return fetch(apiUrl(path), {
    ...init,
    method,
    credentials: "include",
    headers: {
      ...(method !== "GET" && !hasFormDataBody
        ? { "Content-Type": "application/json" }
        : {}),
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(init?.headers || {}),
    },
  });
}
