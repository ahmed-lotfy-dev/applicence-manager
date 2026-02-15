import { Elysia } from "elysia";

export const healthRoutes = new Elysia({ name: "health-routes" })
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .get("/", () => "Activation Dashboard API");
