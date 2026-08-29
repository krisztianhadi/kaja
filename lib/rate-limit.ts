/**
 * Minimal in-memory rate limiter for login attempts.
 * Per-IP sliding window. Good enough for a family self-hosted service;
 * resets when the server restarts.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const buckets = new Map<string, number[]>();

export function rateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - hits[0])) / 1000);
    buckets.set(ip, hits);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }
  hits.push(now);
  buckets.set(ip, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}
