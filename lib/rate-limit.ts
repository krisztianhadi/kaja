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

// per-user budget for paid AI calls (Gemini/OpenRouter) - 15 analyses/hour
const AI_WINDOW_MS = 60 * 60 * 1000;
const AI_MAX = 15;
const aiBuckets = new Map<string, number[]>();

export function rateLimitAi(
  userId: string
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const hits = (aiBuckets.get(userId) ?? []).filter((t) => now - t < AI_WINDOW_MS);
  if (hits.length >= AI_MAX) {
    const retryAfter = Math.ceil((AI_WINDOW_MS - (now - hits[0])) / 1000);
    aiBuckets.set(userId, hits);
    return { allowed: false, retryAfterSeconds: Math.max(60, retryAfter) };
  }
  hits.push(now);
  aiBuckets.set(userId, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  // the trusted proxy APPENDS the real client IP, so the rightmost entry
  // is the only one it did not see; an attacker can only prepend spoofed
  // values, so [0] would be bypassable
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "local";
}
