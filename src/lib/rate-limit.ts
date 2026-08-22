import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Distributed Rate Limiting using Upstash Redis.
 * 
 * Falls back to in-memory when Redis is not configured (development).
 * Survives deployments, works across all serverless instances.
 */

// ─── UPSTASH REDIS CLIENT ────────────────────────────────────────
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : null;

// ─── RATE LIMITERS (Upstash — sliding window) ────────────────────
const createLimiter = (requests: number, window: `${number} ${'s' | 'ms' | 'm' | 'h' | 'd'}`) => {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
      prefix: 'milyfe-rl',
    });
  }
  return null;
};

const limiters = {
  ubi: createLimiter(2, '1 h'),
  decay: createLimiter(2, '1 h'),
  ai: createLimiter(20, '1 m'),
  general: createLimiter(100, '1 m'),
  auth: createLimiter(5, '1 m'),
  notifications: createLimiter(60, '1 m'),
};

// ─── IN-MEMORY FALLBACK ──────────────────────────────────────────
interface MemoryEntry { count: number; resetAt: number; }
const memoryStore = new Map<string, MemoryEntry>();

// Clean up periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((entry, key) => {
      if (now > entry.resetAt) memoryStore.delete(key);
    });
  }, 5 * 60 * 1000);
}

// ─── PUBLIC INTERFACE ────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export const RATE_LIMITS = {
  ubi: { maxRequests: 2, windowSeconds: 3600 },
  decay: { maxRequests: 2, windowSeconds: 3600 },
  ai: { maxRequests: 20, windowSeconds: 60 },
  general: { maxRequests: 100, windowSeconds: 60 },
  auth: { maxRequests: 5, windowSeconds: 60 },
  notifications: { maxRequests: 60, windowSeconds: 60 },
} as const;

type LimiterName = keyof typeof limiters;

/**
 * Check rate limit. Uses Upstash Redis in production, in-memory in dev.
 */
export async function checkRateLimit(
  identifier: string,
  config: { maxRequests: number; windowSeconds: number },
  limiterName?: LimiterName
): Promise<RateLimitResult> {
  // Try Upstash first
  const limiter = limiterName ? limiters[limiterName] : null;
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        retryAfterSeconds: result.success ? 0 : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch {
      // Redis unavailable — fall through to memory
    }
  }

  // In-memory fallback
  return checkRateLimitMemory(identifier, config);
}

function checkRateLimitMemory(
  identifier: string,
  config: { maxRequests: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + windowMs, retryAfterSeconds: 0 };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfterSeconds };
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
