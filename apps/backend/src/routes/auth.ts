import { Elysia } from "elysia";
import { auth } from "../lib/auth";

export const authRoutes = new Elysia({ name: "auth-routes", prefix: "/api/auth" }).all(
  "/*",
  async ({ request }) => {
    // Better Auth strictly validates request.url against the Origin header.
    // Behind a proxy (Nginx/Traefik), the internal request is HTTP, but Origin is HTTPS.
    // This causes an "Invalid origin" error. We must reconstruct the request URL using proxy headers.
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");

    let finalRequest = request;
    if (forwardedProto && forwardedHost) {
      const url = new URL(request.url);
      url.protocol = `${forwardedProto}:`;
      url.host = forwardedHost;
      
      // Create a new Request with the rewritten URL, copying all original properties
      finalRequest = new Request(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        // @ts-ignore - Bun supports this for cloning the body stream
        duplex: "half", 
      });
    }

    return auth.handler(finalRequest);
  },
);
