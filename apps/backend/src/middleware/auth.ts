import { Elysia } from "elysia";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/db";
import { sessions } from "../db/auth-schema";
import { parseCookies } from "../lib/http";
import { verifyToken } from "../lib/jwt";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/me" ||
    pathname === "/api/csrf" ||
    pathname === "/health" ||
    pathname === "/" ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/api/v1/license")
  );
}

export const authMiddleware = new Elysia({ name: "auth-middleware" }).onBeforeHandle(
  async ({ request, set }) => {
    const pathname = new URL(request.url).pathname;
    if (isPublicPath(pathname)) return;

    const cookies = parseCookies(request.headers.get("cookie"));
    const sessionToken = cookies.session;
    if (sessionToken) {
      const now = new Date();
      const activeSession = await db
        .select({ token: sessions.token })
        .from(sessions)
        .where(and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, now)))
        .limit(1);

      if (activeSession.length > 0) return;
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const payload = verifyToken(authHeader.slice(7));
    if (!payload) {
      set.status = 401;
      return { error: "Invalid or expired token" };
    }

    const now = new Date();
    const matchingSession = await db
      .select({ token: sessions.token })
      .from(sessions)
      .where(and(eq(sessions.token, payload.sessionToken), gt(sessions.expiresAt, now)))
      .limit(1);

    if (matchingSession.length === 0) {
      set.status = 401;
      return { error: "Session expired" };
    }
  },
);
