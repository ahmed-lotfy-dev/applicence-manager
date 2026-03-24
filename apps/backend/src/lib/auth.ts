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

const betterAuthUrl =
  process.env.BETTER_AUTH_URL?.trim() ||
  process.env.FRONTEND_URL?.trim() ||
  process.env.FRONTEND_ORIGIN?.trim() ||
  "http://localhost:3000";
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET", 32);

function optionalSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const googleClientId = optionalSecret(process.env.GOOGLE_CLIENT_ID);
const googleClientSecret = optionalSecret(process.env.GOOGLE_CLIENT_SECRET);
const githubClientId = optionalSecret(process.env.GITHUB_CLIENT_ID);
const githubClientSecret = optionalSecret(process.env.GITHUB_CLIENT_SECRET);

export const auth = betterAuth({
  secret: betterAuthSecret,
  baseURL: betterAuthUrl.replace(/\/+$/, ""),
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
