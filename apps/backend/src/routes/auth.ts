import { Elysia, type Context } from "elysia";
import { auth } from "../lib/auth";

const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];

function betterAuthView(context: Context) {
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  }
  return context.error(405);
}

export const authRoutes = new Elysia({ name: "auth-routes" }).all(
  "/api/auth/*",
  betterAuthView,
);
