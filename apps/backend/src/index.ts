import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { logger } from "./middleware/logger";
import { csrfProtection } from "./middleware/csrf";
import { securityHeaders } from "./middleware/security-headers";
import { authMiddleware } from "./middleware/auth";
import { createRateLimiter } from "./middleware/rate-limit";
import { trustedOrigins } from "./lib/env";
import { initializeDatabase } from "./bootstrap/database";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { activationRoutes } from "./routes/activations";
import { licenseAdminRoutes } from "./routes/licenses";
import { licensePublicRoutes } from "./routes/license-public";
import { appCatalogRoutes } from "./routes/apps";

const app = new Elysia()
  .use(logger)
  .use(securityHeaders)
  .use(
    openapi({
      path: "/docs",
      documentation: { info: { title: "Activation Dashboard API", version: "1.0.0" } },
    }),
  )
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get("origin");
        if (!origin) return true;
        return trustedOrigins.includes(origin);
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
        return path === "/api/auth/login" && request.method === "POST";
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
  .use(licenseAdminRoutes)
  .use(licensePublicRoutes);

async function startServer() {
  await initializeDatabase();

  const port = Number(process.env.PORT || 8000);
  app.listen(port);
  console.log(`🚀 Activation Dashboard API running at http://localhost:${port}`);
}

startServer().catch((error) => {
  console.error("❌ Failed to start backend:", error);
  process.exit(1);
});
