import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { logger } from "./middleware/logger";
import { csrfProtection } from "./middleware/csrf";
import { securityHeaders } from "./middleware/security-headers";
import { authMiddleware } from "./middleware/auth";
import { createRateLimiter } from "./middleware/rate-limit";
import { isProduction, trustedOrigins } from "./lib/env";
import { initializeDatabase } from "./bootstrap/database";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { activationRoutes } from "./routes/activations";
import { licenseAdminRoutes } from "./routes/licenses";
import { licensePublicRoutes } from "./routes/license-public";
import { appCatalogRoutes } from "./routes/apps";
import { clientRoutes } from "./routes/clients";
import { freelancerProfileRoutes } from "./routes/freelancer-profile";
import { invoiceRoutes } from "./routes/invoices";

/**
 * Check if an origin matches a trusted origin pattern.
 * Supports exact matches and wildcard subdomain patterns like "https://*.example.com".
 */
function isOriginTrusted(origin: string, trusted: string[]): boolean {
  for (const pattern of trusted) {
    if (pattern === origin) return true;
    if (pattern.includes("*.")) {
      try {
        const patternUrl = new URL(pattern.replace("*.", ""));
        const originUrl = new URL(origin);
        if (originUrl.protocol !== patternUrl.protocol) continue;
        const patternHost = patternUrl.hostname;
        const originHost = originUrl.hostname;
        if (originHost === patternHost || originHost.endsWith(`.${patternHost}`)) {
          return true;
        }
      } catch {
        // Invalid URL, skip
      }
    }
  }
  return false;
}

const app = new Elysia()
  .use(logger)
  .use(securityHeaders)
  .use(
    openapi({
      path: "/docs",
      documentation: { info: { title: "Fawtarly API", version: "1.0.0" } },
    }),
  )
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get("origin");
        if (!origin) return true;
        if (!isProduction) {
          if (origin.startsWith("http://") || origin.startsWith("https://")) return true;
          return isOriginTrusted(origin, trustedOrigins);
        }
        if (isOriginTrusted(origin, trustedOrigins)) return true;

        // In production, also allow same-origin requests when proxied by the frontend host.
        const host = request.headers.get("host");
        if (!host) return false;
        try {
          const originHost = new URL(origin).host;
          return originHost === host;
        } catch {
          return false;
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "content-type",
        "Authorization",
        "Cookie",
        "Accept",
        "x-csrf-token",
      ],
    }),
  )
  .use(
    createRateLimiter({
      name: "auth-login",
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      match: (request) => {
        const path = new URL(request.url).pathname;
        return (
          request.method === "POST" &&
          (path === "/api/auth/sign-in/email" ||
            path === "/api/auth/sign-up/email" ||
            path === "/api/auth/sign-in/social")
        );
      },
    }),
  )
  .use(
    createRateLimiter({
      name: "public-license",
      windowMs: 60 * 1000,
      maxRequests: 60,
      match: (request) => {
        const path = new URL(request.url).pathname;
        return path.startsWith("/api/v1/license");
      },
    }),
  )
  .use(csrfProtection)
  .use(authMiddleware)
  .use(healthRoutes)
  .use(authRoutes)
  .use(activationRoutes)
  .use(appCatalogRoutes)
  .use(clientRoutes)
  .use(freelancerProfileRoutes)
  .use(invoiceRoutes)
  .use(licenseAdminRoutes)
  .use(licensePublicRoutes);

async function startServer() {
  await initializeDatabase();

  const port = Number(process.env.PORT || 8000);
  app.listen(port);
  console.log(`🚀 Fawtarly API running at http://localhost:${port}`);
}

startServer().catch((error) => {
  console.error("❌ Failed to start backend:", error);
  process.exit(1);
});
