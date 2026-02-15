import { Elysia } from "elysia";

interface RateLimitOptions {
  name: string;
  windowMs: number;
  maxRequests: number;
  match?: (request: Request) => boolean;
}

interface Entry {
  count: number;
  resetAt: number;
}

const limiterStores = new Map<string, Map<string, Entry>>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function createRateLimiter(options: RateLimitOptions) {
  const store = limiterStores.get(options.name) || new Map<string, Entry>();
  limiterStores.set(options.name, store);

  return new Elysia({ name: `rate-limit-${options.name}` }).onBeforeHandle(({ request, set }) => {
    if (options.match && !options.match(request)) return;

    const now = Date.now();
    const key = getClientKey(request);
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      set.status = 429;
      set.headers["Retry-After"] = String(Math.max(retryAfterSeconds, 1));
      return { error: "Too many requests. Please try again later." };
    }

    existing.count += 1;
  });
}
