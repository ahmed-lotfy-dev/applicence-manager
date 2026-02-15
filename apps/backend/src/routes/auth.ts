import { Elysia, t } from "elysia";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes, timingSafeEqual } from "node:crypto";
import * as bcrypt from "bcrypt";
import { db } from "../db/db";
import { sessions, users } from "../db/auth-schema";
import { parseCookies, shouldUseSecureCookies } from "../lib/http";

async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (hash) {
    return bcrypt.compare(password, hash);
  }

  const raw = process.env.ADMIN_PASSWORD || "";
  const expected = Buffer.from(raw);
  const provided = Buffer.from(password);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

function buildSessionCookie(token: string, maxAge: number): string {
  const parts = [
    `session=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
    "Path=/",
  ];
  if (shouldUseSecureCookies()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export const authRoutes = new Elysia({ name: "auth-routes", prefix: "/api/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      const { email, password } = body as { email: string; password: string };

      if (!email || !password) {
        set.status = 400;
        return { error: "Email and password are required" };
      }

      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const emailMatches = email.trim().toLowerCase() === adminEmail;
      const passwordMatches = await verifyAdminPassword(password);

      if (!emailMatches || !passwordMatches) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      let userData = await db.select().from(users).where(eq(users.email, email));
      let user = userData[0];

      if (!user) {
        const userId = crypto.randomUUID();
        await db.insert(users).values({
          id: userId,
          email,
          name: "Admin",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userData = await db.select().from(users).where(eq(users.email, email));
        user = userData[0];
      }

      if (!user) {
        set.status = 500;
        return { error: "Failed to create user" };
      }
      if (!user.email) {
        set.status = 500;
        return { error: "User email is missing" };
      }

      const sessionToken = randomBytes(32).toString("hex");
      const maxAgeSeconds = 24 * 60 * 60;
      await db.insert(sessions).values({
        id: crypto.randomUUID(),
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + maxAgeSeconds * 1000),
      });

      set.headers["Set-Cookie"] = buildSessionCookie(sessionToken, maxAgeSeconds);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email", minLength: 3, maxLength: 254 }),
        password: t.String({ minLength: 8, maxLength: 256 }),
      }),
    },
  )
  .post("/logout", async ({ request, set }) => {
    const sessionToken = parseCookies(request.headers.get("cookie")).session;
    if (sessionToken) {
      await db.delete(sessions).where(eq(sessions.token, sessionToken));
    }

    set.headers["Set-Cookie"] = buildSessionCookie("", 0);
    return { success: true };
  })
  .get("/me", async ({ request }) => {
    const sessionToken = parseCookies(request.headers.get("cookie")).session;
    if (!sessionToken) {
      return { authenticated: false };
    }

    const now = new Date();
    const sessionRows = await db
      .select({
        userId: sessions.userId,
        email: users.email,
        name: users.name,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, now)))
      .limit(1);

    const session = sessionRows[0];
    if (!session || !session.email) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
      },
    };
  });
