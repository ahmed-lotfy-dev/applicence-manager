import { Elysia } from "elysia";
import { auth } from "../lib/auth";

export const authRoutes = new Elysia({ name: "auth-routes", prefix: "/api/auth" }).all(
  "/*",
  async ({ request }) => auth.handler(request),
);
