import { createClient } from '@/lib/supabase/client';
import { cacheThrough } from './cache';

/**
 * Feature Flags — check if a feature is enabled
 * Uses DB-stored flags with Redis caching (5 min TTL)
 */

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
}

/**
 * Check if a feature flag is enabled
 */
export async function isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
  const flags = await getFlags();
  const flag = flags.find(f => f.key === key);
  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check rollout percentage (deterministic based on userId)
  if (flag.rollout_percentage < 100 && userId) {
    const hash = simpleHash(userId + key);
    return (hash % 100) < flag.rollout_percentage;
  }

  return flag.enabled;
}

async function getFlags(): Promise<FeatureFlag[]> {
  return cacheThrough<FeatureFlag[]>(
    'feature_flags',
    async () => {
      const supabase = createClient();
      const { data } = await supabase.from('feature_flags').select('key, enabled, rollout_percentage');
      return (data || []) as FeatureFlag[];
    },
    300 // 5 min cache
  );
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
