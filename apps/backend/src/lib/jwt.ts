import { createHmac, timingSafeEqual } from "node:crypto";
import { jwtSecret } from "./env";

export interface SessionTokenPayload {
  userId: string;
  email: string;
  sessionToken: string;
}

interface TokenPayload extends SessionTokenPayload {
  iat: number;
  exp: number;
}

function signJwtParts(headerBase64: string, bodyBase64: string): string {
  return createHmac("sha256", jwtSecret)
    .update(`${headerBase64}.${bodyBase64}`)
    .digest("base64url");
}

function safeSignatureEquals(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function generateToken(payload: SessionTokenPayload): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: issuedAt,
      exp: issuedAt + 24 * 60 * 60,
    }),
  ).toString("base64url");
  const signature = signJwtParts(header, body);

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
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

    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    if (!payload.iat || payload.iat > now + 60) return null;
    if (!payload.userId || !payload.email || !payload.sessionToken) return null;

    return payload;
  } catch {
    return null;
  }
}
