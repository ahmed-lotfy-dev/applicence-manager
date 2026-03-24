import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/db";
import { sessions } from "../db/auth-schema";
import { parseCookies } from "./http";
import { verifyToken } from "./jwt";

function readSessionTokenFromRequest(request: Request): string | null {
  const cookieToken = parseCookies(request.headers.get("cookie")).session;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.slice(7));
  return payload?.sessionToken || null;
}

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const sessionToken = readSessionTokenFromRequest(request);
  if (!sessionToken) return null;

  const now = new Date();
  const rows = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, now)))
    .limit(1);

  return rows[0]?.userId || null;
}
