import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { logger } from "./middleware/logger";
import { securityHeaders } from "./middleware/security-headers";
import { authMiddleware } from "./middleware/auth";
import { createRateLimiter } from "./middleware/rate-limit";


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
import { dashboardRoutes } from "./routes/dashboard";
import { projectRoutes } from "./routes/projects";
import { paymentRoutes } from "./routes/payments";
import { startInvoicePdfWorker } from "./workers/invoice-pdf-worker";

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
      // Reflect the request origin back — better-auth handles actual origin validation
      // via baseURL.allowedHosts and trustedOrigins internally.
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "content-type",
        "Authorization",
        "Cookie",
        "Accept",
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
  .use(authMiddleware)
  .use(healthRoutes)
  .use(authRoutes)
  .use(activationRoutes)
  .use(appCatalogRoutes)
  .use(clientRoutes)
  .use(freelancerProfileRoutes)
  .use(invoiceRoutes)
  .use(projectRoutes)
  .use(paymentRoutes)
  .use(dashboardRoutes)
  .use(licenseAdminRoutes)
  .use(licensePublicRoutes);

async function startServer() {
  await initializeDatabase();

  startInvoicePdfWorker().catch((error) => {
    console.error("❌ Invoice PDF worker failed:", error);
  });

  const port = Number(process.env.PORT || 8000);
  app.listen(port);
  console.log(`🚀 Fawtarly API running at http://localhost:${port}`);
}

startServer().catch((error) => {
  console.error("❌ Failed to start backend:", error);
  process.exit(1);
});
