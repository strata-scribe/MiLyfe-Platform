/**
 * Simple in-memory rate limiter for API routes.
 * 
 * Uses a sliding window approach with per-IP tracking.
 * For production scale, swap with Redis-based solution (Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `${identifier}`;

  const entry = store.get(key);

  // No entry or expired window — allow and start fresh
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  // Within window — check count
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Rate limited
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfterSeconds,
  };
}

/**
 * Get rate limit headers for a response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    ...(result.allowed ? {} : { 'Retry-After': result.retryAfterSeconds.toString() }),
  };
}

// Pre-configured limiters for different endpoints
export const RATE_LIMITS = {
  /** UBI cron — very restrictive (1 per hour) */
  ubi: { maxRequests: 2, windowSeconds: 3600 },
  /** MLY decay cron — very restrictive (1 per hour) */
  decay: { maxRequests: 2, windowSeconds: 3600 },
  /** Mi AI assistant — moderate (20 per minute) */
  ai: { maxRequests: 20, windowSeconds: 60 },
  /** General API — lenient (100 per minute) */
  general: { maxRequests: 100, windowSeconds: 60 },
  /** Auth attempts — strict (5 per minute) */
  auth: { maxRequests: 5, windowSeconds: 60 },
} as const;
