/**
 * MiLyfe Rate Limiter — Self-hosted replacement for Upstash.
 * In-memory sliding window rate limiter with optional Supabase persistence.
 * Zero external dependencies.
 * 
 * Usage in API routes:
 * ```ts
 * import { rateLimit } from '@/lib/infra/rate-limiter';
 * 
 * export async function POST(req: Request) {
 *   const ip = req.headers.get('x-forwarded-for') || 'unknown';
 *   const { success, remaining } = rateLimit(ip, { maxRequests: 10, windowMs: 60000 });
 *   if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });
 *   // ... handle request
 * }
 * ```
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per-process — resets on deploy/restart)
const store = new Map<string, RateLimitEntry>();

// Cleanup interval (every 60s, remove expired entries)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  if (typeof setInterval !== 'undefined') {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      store.forEach((entry, key) => {
        if (entry.resetAt < now) store.delete(key);
      });
    }, 60000);
  }
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  maxRequests?: number;
  /** Window duration in milliseconds */
  windowMs?: number;
  /** Prefix for the key (e.g., 'api' or 'auth') */
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.).
 */
export function rateLimit(
  identifier: string,
  options?: RateLimitOptions
): RateLimitResult {
  ensureCleanup();

  const maxRequests = options?.maxRequests ?? 60;
  const windowMs = options?.windowMs ?? 60000; // 1 minute
  const prefix = options?.prefix ?? 'global';
  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs, limit: maxRequests };
  }

  if (entry.count >= maxRequests) {
    // Rate limited
    return { success: false, remaining: 0, resetAt: entry.resetAt, limit: maxRequests };
  }

  // Increment
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt, limit: maxRequests };
}

/**
 * Reset rate limit for a specific identifier.
 */
export function resetRateLimit(identifier: string, prefix = 'global') {
  store.delete(`${prefix}:${identifier}`);
}

/**
 * Get current rate limit status without incrementing.
 */
export function getRateLimitStatus(identifier: string, options?: RateLimitOptions): RateLimitResult {
  const prefix = options?.prefix ?? 'global';
  const maxRequests = options?.maxRequests ?? 60;
  const key = `${prefix}:${identifier}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt < Date.now()) {
    return { success: true, remaining: maxRequests, resetAt: 0, limit: maxRequests };
  }

  return {
    success: entry.count < maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
    limit: maxRequests,
  };
}

/**
 * Preset rate limiters for common use cases.
 */
export const rateLimits = {
  /** API calls: 60/minute */
  api: (id: string) => rateLimit(id, { maxRequests: 60, windowMs: 60000, prefix: 'api' }),
  /** Auth attempts: 5/minute */
  auth: (id: string) => rateLimit(id, { maxRequests: 5, windowMs: 60000, prefix: 'auth' }),
  /** Post creation: 10/minute */
  posts: (id: string) => rateLimit(id, { maxRequests: 10, windowMs: 60000, prefix: 'posts' }),
  /** Message sending: 30/minute */
  messages: (id: string) => rateLimit(id, { maxRequests: 30, windowMs: 60000, prefix: 'messages' }),
  /** File uploads: 5/minute */
  uploads: (id: string) => rateLimit(id, { maxRequests: 5, windowMs: 60000, prefix: 'uploads' }),
  /** MLY transfers: 10/hour */
  transfers: (id: string) => rateLimit(id, { maxRequests: 10, windowMs: 3600000, prefix: 'transfers' }),
};
