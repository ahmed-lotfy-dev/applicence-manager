import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { licenseTokenSecret } from "./env";

export interface LicenseActivationTokenPayload {
  typ: "license_activation";
  jti: string;
  licenseId: string;
  appName: string;
  machineId: string;
  iat: number;
  exp: number;
}

function signJwtParts(headerBase64: string, bodyBase64: string): string {
  return createHmac("sha256", licenseTokenSecret)
    .update(`${headerBase64}.${bodyBase64}`)
    .digest("base64url");
}

function safeSignatureEquals(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function signLicenseActivationToken(payload: {
  licenseId: string;
  appName: string;
  machineId: string;
  expiresAt: Date;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: LicenseActivationTokenPayload = {
    typ: "license_activation",
    jti: randomBytes(16).toString("hex"),
    licenseId: payload.licenseId,
    appName: payload.appName,
    machineId: payload.machineId,
    iat: now,
    exp: Math.floor(payload.expiresAt.getTime() / 1000),
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const signature = signJwtParts(header, body);

  return `${header}.${body}.${signature}`;
}

export function verifyLicenseActivationToken(token: string): LicenseActivationTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    if (!header || !body || !signature) return null;

    const headerPayload = JSON.parse(Buffer.from(header, "base64url").toString()) as {
      alg?: string;
      typ?: string;
    };
    if (headerPayload.alg !== "HS256" || headerPayload.typ !== "JWT") return null;

    const expectedSignature = signJwtParts(header, body);
    if (!safeSignatureEquals(expectedSignature, signature)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as LicenseActivationTokenPayload;
    if (payload.typ !== "license_activation") return null;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    if (!payload.iat || payload.iat > now + 60) return null;

    return payload;
  } catch {
    return null;
  }
}
