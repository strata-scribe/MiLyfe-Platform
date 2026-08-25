/**
 * MiSource — Provenance, Freshness, and Correction Protocol
 *
 * Every piece of information displayed to a member carries provenance metadata.
 * This module provides utilities for checking and updating freshness.
 */

export interface MiSourceMeta {
  source_id: string;
  maintainer: string;
  verification_method:
    | 'human_visit'
    | 'phone_call'
    | 'web_scrape'
    | 'api_check'
    | 'community_report'
    | 'official_feed'
    | 'unverified';
  confidence: number; // 0-1
  checked_at: string; // ISO datetime
  expires_at: string; // ISO datetime
  stale_behavior: 'show_with_warning' | 'hide' | 'show_last_known' | 'redirect_to_call';
}

/** Default TTLs by resource category (in hours) */
const FRESHNESS_TTLS: Record<string, number> = {
  shelter: 4,
  food: 24,
  legal: 168, // 7 days
  clinic: 168,
  transit: 1,
  jobs: 168,
  housing: 168,
  mental_health: 168,
  substance_recovery: 168,
  childcare: 168,
  clothing: 168,
  financial: 168,
  events: 0, // expires at event end time
  marketplace: 72,
  emergency: 1,
};

/**
 * Check if a resource is stale based on its category and last verification.
 */
export function isStale(category: string, expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/**
 * Get the default TTL for a category (in hours).
 */
export function getDefaultTTL(category: string): number {
  return FRESHNESS_TTLS[category] ?? 168; // Default 7 days
}

/**
 * Calculate the next expiration time based on category.
 */
export function calculateExpiration(category: string, fromDate?: Date): string {
  const hours = getDefaultTTL(category);
  const base = fromDate || new Date();
  return new Date(base.getTime() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Get freshness status label and color for display.
 */
export function getFreshnessDisplay(confidence: number, expiresAt: string | null): {
  label: string;
  color: 'green' | 'yellow' | 'red';
  icon: string;
} {
  const stale = isStale('', expiresAt);

  if (stale) {
    return { label: 'May be outdated', color: 'red', icon: '⚠️' };
  }

  if (confidence >= 0.8) {
    return { label: 'Verified', color: 'green', icon: '✓' };
  }

  if (confidence >= 0.5) {
    return { label: 'Likely current', color: 'yellow', icon: '~' };
  }

  return { label: 'Unverified', color: 'red', icon: '?' };
}

/**
 * Generate a verification quest for a stale resource.
 * Returns quest parameters for posting to the quests table.
 */
export function generateVerificationQuest(resource: {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
}): {
  title: string;
  description: string;
  category: string;
  reward_mly: number;
} {
  const method = resource.phone ? 'call' : resource.address ? 'visit' : 'web check';

  return {
    title: `Verify: ${resource.name}`,
    description: `This resource hasn't been verified recently. Please ${method === 'call' ? `call ${resource.phone}` : method === 'visit' ? `visit ${resource.address}` : 'check their website'} and confirm they're still operating with current hours.`,
    category: 'verification',
    reward_mly: method === 'visit' ? 5 : 3,
  };
}
