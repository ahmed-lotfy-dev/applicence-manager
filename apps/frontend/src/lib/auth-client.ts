import { createAuthClient } from "better-auth/react";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

function apiUrl(path: string): string {
  if (!API_BASE_URL) return `/api${path}`;
  if (API_BASE_URL.endsWith("/api")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/api${path}`;
}

const AUTH_BASE_URL = !API_BASE_URL
  ? undefined
  : API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4) || undefined
    : API_BASE_URL;

const betterAuthClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});

function getCsrfEndpoints(): string[] {
  if (!API_BASE_URL) return ["/api/csrf"];
  if (API_BASE_URL.endsWith("/api")) return [`${API_BASE_URL}/csrf`];
  return [`${API_BASE_URL}/api/csrf`, `${API_BASE_URL}/csrf`];
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  error?: string;
}

export interface MeResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

class AuthClient {
  private csrfToken: string | null = null;

  private async parseResponse<T>(response: Response): Promise<T | null> {
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

  async getCsrfToken(): Promise<string | null> {
    if (this.csrfToken) return this.csrfToken;

    const endpoints = getCsrfEndpoints();
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await this.parseResponse<{ csrfToken?: string }>(response);
        if (!response.ok || !data?.csrfToken) continue;
        this.csrfToken = data.csrfToken;
        return this.csrfToken;
      } catch {
        continue;
      }
    }

    return null;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await betterAuthClient.signIn.email({
        email,
        password,
      });
      if (error) {
        return { success: false, error: error.message || "Login failed" };
      }
      return {
        success: true,
        user: data?.user
          ? {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name ?? null,
            }
          : undefined,
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  async signInSocial(provider: "google" | "github"): Promise<{ error?: string }> {
    try {
      const { error } = await betterAuthClient.signIn.social({
        provider,
        callbackURL: "/overview",
      });
      return error ? { error: error.message || "Social login failed" } : {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Social login failed",
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      await betterAuthClient.signOut();
    } finally {
      this.csrfToken = null;
    }
  }

  async getSession(): Promise<MeResponse> {
    try {
      const { data } = await betterAuthClient.getSession();
      if (!data?.user) {
        return { authenticated: false };
      }

      return {
        authenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name ?? null,
        },
      };
    } catch {
      return { authenticated: false };
    }
  }
}

// Create singleton instance
export const authClient = new AuthClient();
