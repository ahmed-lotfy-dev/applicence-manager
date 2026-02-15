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

const frontendOriginsEnv = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN;
export const trustedOrigins = parseList(frontendOriginsEnv);
export const isProduction = process.env.NODE_ENV === "production";
export const hasConfiguredActivationAppName = !!process.env.ACTIVATION_APP_NAME?.trim();
export const activationAppName =
  process.env.ACTIVATION_APP_NAME?.trim() || "com.ahmedlotfy.mobilemanagement";
export const jwtSecret = requireSecret("JWT_SECRET", 32);
export const licenseTokenSecret = requireSecret("LICENSE_TOKEN_SECRET", 32);
export const activationTokenTtlDays = Math.min(
  parsePositiveInt(process.env.ACTIVATION_TOKEN_TTL_DAYS, 30),
  365,
);
