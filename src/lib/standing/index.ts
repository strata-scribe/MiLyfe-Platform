'use client';

/**
 * Community Standing System
 * 
 * Standing is calculated from community participation:
 * - Health check-ins (1 pt each)
 * - Issue reports (3 pts each)
 * - Votes cast (2 pts each)
 * - Content published (5 pts each)
 * - MLY transactions sent (1 pt each)
 * - Guild tasks completed (5 pts each)
 * - Courses completed (10 pts each)
 * - Days active (1 pt each)
 * 
 * Levels:
 * 1: Newcomer (0-24 pts)
 * 2: Neighbor (25-99 pts)
 * 3: Active Member (100-249 pts)
 * 4: Community Builder (250-499 pts)
 * 5: Leader (500+ pts)
 */

export interface StandingLevel {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  color: string;
}

export const STANDING_LEVELS: StandingLevel[] = [
  { level: 1, name: 'Newcomer', minPoints: 0, icon: '🌱', color: 'text-gray-500' },
  { level: 2, name: 'Neighbor', minPoints: 25, icon: '🏘️', color: 'text-blue-500' },
  { level: 3, name: 'Active Member', minPoints: 100, icon: '⭐', color: 'text-teal-500' },
  { level: 4, name: 'Community Builder', minPoints: 250, icon: '🏗️', color: 'text-purple-500' },
  { level: 5, name: 'Leader', minPoints: 500, icon: '👑', color: 'text-amber-500' },
];

export interface GatedFeature {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  icon: string;
  href?: string;
}

export const GATED_FEATURES: GatedFeature[] = [
  { id: 'radio_station', name: 'Create Radio Station', description: 'Launch a community radio station on MiMedia', requiredLevel: 3, icon: '📻', href: '/media' },
  { id: 'create_proposal', name: 'Create Governance Proposal', description: 'Propose changes to community governance', requiredLevel: 2, icon: '🗳️', href: '/govern' },
  { id: 'delegate_votes', name: 'Accept Vote Delegations', description: 'Others can delegate their voting power to you', requiredLevel: 3, icon: '🤝', href: '/govern/delegate' },
  { id: 'media_channel', name: 'Create Media Channel', description: 'Launch your own creator channel', requiredLevel: 2, icon: '📺', href: '/media/channels' },
  { id: 'guild_mediator', name: 'Become a Guild Mediator', description: 'Mediate community conflicts for $25/day', requiredLevel: 4, icon: '⚖️', href: '/guild' },
  { id: 'guild_keeper', name: 'Become a Block Keeper', description: 'Patrol and protect your block for $30/day', requiredLevel: 4, icon: '🛡️', href: '/guild' },
  { id: 'create_course', name: 'Create a Course', description: 'Publish educational content on MiLearn', requiredLevel: 3, icon: '📖', href: '/learn' },
  { id: 'business_verify', name: 'Verified Business Badge', description: 'Get a verified checkmark on your business', requiredLevel: 3, icon: '✓', href: '/business' },
  { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'View detailed platform usage statistics', requiredLevel: 4, icon: '📊', href: '/impact' },
  { id: 'emergency_broadcast', name: 'Emergency Broadcast', description: 'Send priority notifications to your area', requiredLevel: 5, icon: '🚨' },
  { id: 'governance_admin', name: 'Governance Admin', description: 'Close proposals, moderate discussions', requiredLevel: 5, icon: '🏛️', href: '/govern' },
  { id: 'mentor', name: 'Community Mentor', description: 'Mentor new members, earn bonus $MLY', requiredLevel: 4, icon: '🎓' },
];

/**
 * Get current standing level from points
 */
export function getStandingLevel(points: number): StandingLevel {
  for (let i = STANDING_LEVELS.length - 1; i >= 0; i--) {
    if (points >= STANDING_LEVELS[i].minPoints) {
      return STANDING_LEVELS[i];
    }
  }
  return STANDING_LEVELS[0];
}

/**
 * Get progress toward next level (0 to 1)
 */
export function getLevelProgress(points: number): { current: StandingLevel; next: StandingLevel | null; progress: number } {
  const current = getStandingLevel(points);
  const currentIdx = STANDING_LEVELS.findIndex((l) => l.level === current.level);
  const next = currentIdx < STANDING_LEVELS.length - 1 ? STANDING_LEVELS[currentIdx + 1] : null;

  if (!next) return { current, next: null, progress: 1 };

  const range = next.minPoints - current.minPoints;
  const progress = Math.min((points - current.minPoints) / range, 1);
  return { current, next, progress };
}

/**
 * Check if a feature is unlocked for a given standing level
 */
export function isFeatureUnlocked(featureId: string, userLevel: number): boolean {
  const feature = GATED_FEATURES.find((f) => f.id === featureId);
  if (!feature) return true; // Unknown features are unlocked by default
  return userLevel >= feature.requiredLevel;
}

/**
 * Get all features and their unlock status for a user
 */
export function getFeatureAccess(userLevel: number): (GatedFeature & { unlocked: boolean })[] {
  return GATED_FEATURES.map((f) => ({
    ...f,
    unlocked: userLevel >= f.requiredLevel,
  }));
}
