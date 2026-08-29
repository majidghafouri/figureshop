import { NextRequest } from "next/server";
import { fail } from "@/lib/api";

/**
 * Client IP for rate limiting, honoring the first value of X-Forwarded-For
 * that Vercel sets. Falls back to a shared key when no IP is present.
 */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

// In-memory sliding-window counter. This is per-isolate on serverless
// platforms, so it is not a global limiter, but it still meaningfully throttles
// abusive callers across each warm instance. Exported for tests.
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0];
    return {
      allowed: false,
      retryAfterMs: oldest ? Math.max(0, windowMs - (now - oldest)) : windowMs,
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 20_000) buckets.clear();
  return { allowed: true, retryAfterMs: 0 };
}

/** Fail a request when a per-IP rate limit is exceeded. */
export function rateLimitOrFail(
  req: NextRequest,
  limit: number,
  windowMs: number,
  label: string,
): { allowed: true } | { allowed: false; response: Response } {
  const result = rateLimit(`${label}:${clientIp(req)}`, limit, windowMs);
  if (!result.allowed) {
    return {
      allowed: false,
      response: fail("too_many_requests", 429, {
        retryAfterMs: result.retryAfterMs,
      }),
    };
  }
  return { allowed: true };
}
