import { createAuthClient } from "better-auth/react";

const rawBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
const baseURL = !rawBase
  ? undefined
  : rawBase.endsWith("/api")
    ? rawBase.slice(0, -4) || undefined
    : rawBase;

export const betterAuthClient = createAuthClient({
  baseURL,
});

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
  async signIn(email: string, password: string): Promise<AuthResponse> {
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
  }

  async signInSocial(
    provider: "google" | "github",
  ): Promise<{ error?: string }> {
    const { error } = await betterAuthClient.signIn.social({
      provider,
      callbackURL: "/overview",
    });
    return error ? { error: error.message || "Social login failed" } : {};
  }

  async signOut(): Promise<void> {
    await betterAuthClient.signOut();
  }

  async getSession(): Promise<MeResponse> {
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
  }
}

export const authClient = new AuthClient();
