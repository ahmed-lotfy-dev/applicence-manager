import { Elysia, type Context } from "elysia";
import { auth } from "../lib/auth";

const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];

function betterAuthView(context: Context) {
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  }
  context.set.status = 405;
  return { error: "Method Not Allowed" };
}

export const authRoutes = new Elysia({ name: "auth-routes" })
  .onRequest(({ request }) => {
    console.log(`[auth-route] ${request.method} ${new URL(request.url).pathname}`);
  })
  .get("/api/auth/*", betterAuthView)
  .post("/api/auth/*", betterAuthView);
