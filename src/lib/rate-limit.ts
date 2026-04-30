/**
 * Simple in-memory rate limiter for API routes (per-process).
 * For serverless, consider Redis for shared limits across instances.
 */

const WINDOW_MS = 60_000;
const DEFAULT_MAX_PER_WINDOW = 10;

const buckets = new Map<string, number[]>();

export function apiRateLimit(
  key: string,
  maxPerMinute: number = DEFAULT_MAX_PER_WINDOW
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prev = buckets.get(key) ?? [];
  const recent = prev.filter((t) => t > windowStart);

  if (recent.length >= maxPerMinute) {
    const oldest = Math.min(...recent);
    const retryAfterMs = WINDOW_MS - (now - oldest);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}

/** Client IP from proxy headers (first hop). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
