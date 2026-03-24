function parseList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireSecret(name: string, minLength: number): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < minLength) {
    throw new Error(`${name} must be set and at least ${minLength} characters long`);
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function optionalTrim(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const frontendOriginsEnv = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN;
export const trustedOrigins = parseList(frontendOriginsEnv);
export const isProduction = process.env.NODE_ENV === "production";
export const jwtSecret = requireSecret("JWT_SECRET", 32);
export const licenseTokenSecret = requireSecret("LICENSE_TOKEN_SECRET", 32);
export const activationTokenTtlDays = Math.min(
  parsePositiveInt(process.env.ACTIVATION_TOKEN_TTL_DAYS, 30),
  365,
);

export const r2Config = {
  accountId: optionalTrim(process.env.R2_ACCOUNT_ID),
  accessKeyId: optionalTrim(process.env.R2_ACCESS_KEY_ID),
  secretAccessKey: optionalTrim(process.env.R2_SECRET_ACCESS_KEY),
  bucket: optionalTrim(process.env.R2_BUCKET),
  publicBaseUrl: optionalTrim(process.env.R2_PUBLIC_BASE_URL),
};

export function ensureR2Config() {
  if (
    !r2Config.accountId ||
    !r2Config.accessKeyId ||
    !r2Config.secretAccessKey ||
    !r2Config.bucket ||
    !r2Config.publicBaseUrl
  ) {
    throw new Error(
      "R2 config missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL",
    );
  }
  return r2Config as {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    publicBaseUrl: string;
  };
}
