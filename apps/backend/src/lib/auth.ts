import { betterAuth } from "better-auth";
import * as bcrypt from "bcrypt";
import { pool } from "../db/db";

function requireEnv(name: string, minLength = 1): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < minLength) {
    throw new Error(`${name} must be set${minLength > 1 ? ` and at least ${minLength} characters long` : ""}`);
  }
  return value;
}

const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET", 32);

// ── Single source of truth: the public domain(s) ──
// APP_DOMAIN can be a comma-separated list of domains.
// Examples:
//   APP_DOMAIN=https://activation.ahmedlotfy.site
//   APP_DOMAIN=https://activation.ahmedlotfy.site,https://www.activation.ahmedlotfy.site
const APP_DOMAIN = process.env.APP_DOMAIN?.trim() || process.env.BETTER_AUTH_URL?.trim() || "http://localhost:3000";

const isDev = process.env.NODE_ENV !== "production";

// Parse domains: comma-separated, trim whitespace
const allowedHosts = APP_DOMAIN.split(",").map(d => d.trim()).filter(Boolean);

console.log(`[auth] APP_DOMAIN = ${APP_DOMAIN}`);
console.log(`[auth] allowedHosts = ${JSON.stringify(allowedHosts)}`);

function optionalSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const googleClientId = optionalSecret(process.env.GOOGLE_CLIENT_ID);
const googleClientSecret = optionalSecret(process.env.GOOGLE_CLIENT_SECRET);
const githubClientId = optionalSecret(process.env.GITHUB_CLIENT_ID);
const githubClientSecret = optionalSecret(process.env.GITHUB_CLIENT_SECRET);

// Build the base origin for redirect URIs (first domain in the list)
const primaryOrigin = allowedHosts[0].replace(/\/+$/, "");

export const auth = betterAuth({
  secret: betterAuthSecret,

  // ── Dynamic base URL (official better-auth pattern) ──
  baseURL: {
    allowedHosts: [
      ...allowedHosts,
      // Always allow localhost in development
      ...(isDev ? ["localhost:3000", "localhost:8000", "127.0.0.1:3000", "127.0.0.1:8000"] : []),
    ],
    protocol: isDev ? "http" : "https",
  },

  // ── Trusted origins as a function (official pattern) ──
  trustedOrigins: async (request) => {
    const origins = new Set<string>();
    for (const host of allowedHosts) {
      origins.add(host);
      if (host.includes("*.")) {
        try {
          const url = new URL(host.replace("*.", ""));
          origins.add(`${url.protocol}//${url.host}`);
        } catch { /* skip invalid */ }
      }
    }
    if (isDev) {
      origins.add("http://localhost:3000");
      origins.add("http://localhost:8000");
      origins.add("http://127.0.0.1:3000");
      origins.add("http://127.0.0.1:8000");
    }
    return [...origins];
  },

  advanced: {
    useSecureCookies: !isDev,
    crossSubDomainCookies: { enabled: false },
    disableCSRFCheck: false,
    generateId: false,
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      trustProxyHeaders: true,
    },
  },

  database: pool,
  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      accountId: "provider_account_id",
      providerId: "provider",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verification_tokens",
    fields: {
      value: "token",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            redirectURI: `${primaryOrigin}/api/auth/callback/google`,
          },
        }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
            redirectURI: `${primaryOrigin}/api/auth/callback/github`,
          },
        }
      : {}),
  },
});
