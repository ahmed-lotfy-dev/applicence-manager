import { betterAuth } from "better-auth";
import * as bcrypt from "bcrypt";
import { pool } from "../db/db";
import { trustedOrigins } from "./env";

function requireEnv(name: string, minLength = 1): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < minLength) {
    throw new Error(`${name} must be set${minLength > 1 ? ` and at least ${minLength} characters long` : ""}`);
  }
  return value;
}

const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim() || "http://localhost:3000";
console.log(`[auth] BETTER_AUTH_URL resolved to: ${betterAuthUrl}`);
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET", 32);

function optionalSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const googleClientId = optionalSecret(process.env.GOOGLE_CLIENT_ID);
const googleClientSecret = optionalSecret(process.env.GOOGLE_CLIENT_SECRET);
const githubClientId = optionalSecret(process.env.GITHUB_CLIENT_ID);
const githubClientSecret = optionalSecret(process.env.GITHUB_CLIENT_SECRET);

/**
 * Expand trusted origins to include subdomain variants.
 * Better-auth does exact string matching for trustedOrigins by default,
 * but also supports wildcard patterns. We expand wildcards to explicit
 * origins for maximum compatibility.
 */
function expandTrustedOrigins(origins: string[]): string[] {
  const expanded = new Set<string>();
  for (const origin of origins) {
    expanded.add(origin);
    // Expand wildcard subdomain patterns: "https://*.example.com" -> also add "https://example.com"
    if (origin.includes("*.")) {
      try {
        const url = new URL(origin.replace("*.", ""));
        expanded.add(`${url.protocol}//${url.host}`);
      } catch {
        // invalid URL pattern, keep as-is
      }
    }
  }
  return [...expanded];
}

// Build explicit trusted origins list (no bare globs — better-auth needs exact matches or proper wildcard patterns)
const allTrustedOrigins = expandTrustedOrigins([
  ...trustedOrigins,
  betterAuthUrl.replace(/\/+$/, ""),
  "http://localhost:3000",
  "https://*.ahmedlotfy.site",
]);

console.log(`[auth] trustedOrigins: ${JSON.stringify(allTrustedOrigins)}`);

export const auth = betterAuth({
  secret: betterAuthSecret,
  baseURL: betterAuthUrl.replace(/\/+$/, ""),
  trustedOrigins: allTrustedOrigins,
  advanced: {
    useSecureCookies: betterAuthUrl.startsWith("https://"),
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
          },
        }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {}),
  },
});
