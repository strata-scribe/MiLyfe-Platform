import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate Limiting for MiLyfe API routes.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL is configured.
 * Falls back to in-memory sliding window for development/local.
 *
 * Usage:
 *   const { success, error } = await checkRateLimit(request, 'wallet-transfer', { limit: 10, window: '1m' });
 *   if (!success) return error;
 */

type RateLimitConfig = {
  /** Max requests in window */
  limit: number;
  /** Window duration (e.g., '1m', '15m', '1h', '1d') */
  window: '1m' | '5m' | '15m' | '1h' | '1d';
};

// Pre-configured rate limit tiers
export const RATE_LIMITS = {
  /** Auth: 5 per 15 minutes per IP */
  auth: { limit: 5, window: '15m' } as RateLimitConfig,
  /** Wallet transfer: 10 per minute per user */
  transfer: { limit: 10, window: '1m' } as RateLimitConfig,
  /** Message send: 30 per minute per user */
  message: { limit: 30, window: '1m' } as RateLimitConfig,
  /** Search: 20 per minute per user */
  search: { limit: 20, window: '1m' } as RateLimitConfig,
  /** General API: 100 per minute per user */
  general: { limit: 100, window: '1m' } as RateLimitConfig,
  /** AI chat: 15 per minute per user */
  ai: { limit: 15, window: '1m' } as RateLimitConfig,
  /** Safety (lenient): 30 per minute */
  safety: { limit: 30, window: '1m' } as RateLimitConfig,
};

// In-memory store for local dev (not suitable for multi-instance prod)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function windowToMs(window: string): number {
  const match = window.match(/^(\d+)(m|h|d)$/);
  if (!match) return 60_000;
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  switch (unit) {
    case 'm': return n * 60_000;
    case 'h': return n * 3_600_000;
    case 'd': return n * 86_400_000;
    default: return 60_000;
  }
}

function memoryRateLimit(key: string, config: RateLimitConfig): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = windowToMs(config.window);
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: config.limit - entry.count };
}

// Create Upstash ratelimiter if configured
let upstashLimiters: Map<string, Ratelimit> | null = null;

function getUpstashLimiter(prefix: string, config: RateLimitConfig): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!upstashLimiters) upstashLimiters = new Map();

  const key = `${prefix}-${config.limit}-${config.window}`;
  if (upstashLimiters.has(key)) return upstashLimiters.get(key)!;

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: `milyfe:ratelimit:${prefix}`,
  });

  upstashLimiters.set(key, limiter);
  return limiter;
}

/**
 * Check rate limit for a request.
 *
 * @param identifier - User ID or IP address
 * @param prefix - Rate limit category name
 * @param config - Rate limit configuration
 * @returns { success, remaining, error? }
 */
export async function checkRateLimit(
  identifier: string,
  prefix: string,
  config: RateLimitConfig = RATE_LIMITS.general
): Promise<{ success: boolean; remaining: number; error?: NextResponse }> {
  const fullKey = `${prefix}:${identifier}`;

  // Try Upstash first
  const upstash = getUpstashLimiter(prefix, config);
  if (upstash) {
    const result = await upstash.limit(fullKey);
    if (!result.success) {
      return {
        success: false,
        remaining: 0,
        error: NextResponse.json(
          { error: 'Too many requests. Please slow down.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }
    return { success: true, remaining: result.remaining };
  }

  // Fallback to in-memory
  const result = memoryRateLimit(fullKey, config);
  if (!result.success) {
    return {
      success: false,
      remaining: 0,
      error: NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    };
  }

  return { success: true, remaining: result.remaining };
}

/**
 * Extract a client identifier from request headers.
 * Uses X-Forwarded-For (Vercel), falls back to 'anonymous'.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'anonymous';
}
