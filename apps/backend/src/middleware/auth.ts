import { Elysia } from "elysia";
import { auth } from "../lib/auth";

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
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

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      if (!session?.user?.id) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    } catch (err) {
      const origin = request.headers.get("origin") || request.headers.get("referer") || "unknown";
      console.error(`[auth] getSession failed for ${request.method} ${pathname} origin=${origin}:`, err);
      set.status = 401;
      return { error: "Unauthorized" };
    }
  },
);
