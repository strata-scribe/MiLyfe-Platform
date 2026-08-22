import { Redis } from '@upstash/redis';

/**
 * Caching utility using Upstash Redis.
 * Falls back to no-cache when Redis is not configured.
 */

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN || '' })
  : null;

/**
 * Get a cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch { return null; }
}

/**
 * Set a cached value with TTL (seconds)
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch { /* non-critical */ }
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try { await redis.del(key); } catch { /* */ }
}

/**
 * Cache-through pattern: get from cache, or compute + store
 */
export async function cacheThrough<T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await compute();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// Pre-defined cache keys
export const CACHE_KEYS = {
  treasury: 'mly:treasury',
  dailyStats: (date: string) => `mly:stats:${date}`,
  userStanding: (userId: string) => `standing:${userId}`,
  activeProposals: 'gov:proposals:active',
  courseList: 'learn:courses',
  topLeaderboard: 'gamification:leaderboard',
} as const;
