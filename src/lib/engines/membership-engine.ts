/**
 * Membership Progression Engine — Visitor → Neighbor → Member → Citizen
 * 
 * "Citizen of this commons" means member. Not a passport. Not national citizenship.
 * Paired with disclaimer the first time it appears.
 * 
 * Helpers: Tool → Named → Staff → Kin → Voice (H0–H4, chorus cap ≤5%).
 */

export type MembershipLevel = 'visitor' | 'neighbor' | 'member' | 'citizen';
export type HelperLevel = 'tool' | 'named' | 'staff' | 'kin' | 'voice';

export interface Membership {
  userId: string;
  place: string;
  level: MembershipLevel;
  joinedAt: string;
  levelChangedAt: string;
  personhoodComplete: boolean;
  helloDay?: string;
}

export interface HelperMembership {
  helperId: string;
  level: HelperLevel;
  place: string;
  promotedAt: string;
  ratings: number;
  auditClean: boolean;
  /** Helpers never get human UBI */
  receivesUBI: false;
  /** Can be fired by any human (muted) */
  fireable: true;
}

// ─── Level Requirements ──────────────────────────────────────────────────────

const LEVEL_REQUIREMENTS: Record<MembershipLevel, { description: string; requires: string[] }> = {
  visitor: { description: 'Can look, learn, access emergency info', requires: [] },
  neighbor: { description: 'Has a card, can message, use neighbor net', requires: ['signup'] },
  member: { description: 'Has voice in place, weekly share after personhood', requires: ['signup', 'personhood'] },
  citizen: { description: 'Can be recovery friend, jar keeper, hello-day greeter', requires: ['signup', 'personhood', 'good-standing-90-days'] },
};

// ─── Store ───────────────────────────────────────────────────────────────────

const memberships: Map<string, Membership> = new Map();

export function getMembership(userId: string, place: string): Membership | undefined {
  return memberships.get(`${userId}:${place}`);
}

export function createMembership(userId: string, place: string): Membership {
  const membership: Membership = {
    userId,
    place,
    level: 'visitor',
    joinedAt: new Date().toISOString(),
    levelChangedAt: new Date().toISOString(),
    personhoodComplete: false,
  };
  memberships.set(`${userId}:${place}`, membership);
  return membership;
}

/**
 * Advance membership level. Checks requirements.
 */
export function advanceMembership(userId: string, place: string): { success: boolean; newLevel?: MembershipLevel; error?: string } {
  const key = `${userId}:${place}`;
  const membership = memberships.get(key);
  if (!membership) return { success: false, error: 'No membership found' };

  const levels: MembershipLevel[] = ['visitor', 'neighbor', 'member', 'citizen'];
  const currentIdx = levels.indexOf(membership.level);
  if (currentIdx >= levels.length - 1) return { success: false, error: 'Already at highest level' };

  const nextLevel: MembershipLevel = levels[currentIdx + 1] as MembershipLevel;
  const requirements = LEVEL_REQUIREMENTS[nextLevel];

  // Check personhood for member/citizen
  if (requirements.requires.includes('personhood') && !membership.personhoodComplete) {
    return { success: false, error: 'Personhood verification required for this level' };
  }

  membership.level = nextLevel;
  membership.levelChangedAt = new Date().toISOString();
  memberships.set(key, membership);

  return { success: true, newLevel: nextLevel };
}

/**
 * Mark personhood complete for a user.
 */
export function markPersonhoodComplete(userId: string, place: string): void {
  const key = `${userId}:${place}`;
  const membership = memberships.get(key);
  if (membership) {
    membership.personhoodComplete = true;
    memberships.set(key, membership);
  }
}

/**
 * Get what this level provides.
 */
export function getLevelBenefits(level: MembershipLevel): string[] {
  const benefits: Record<MembershipLevel, string[]> = {
    visitor: ['View public learning', 'Emergency information', 'Platform explanation'],
    neighbor: ['Profile and card', 'Messages', 'Neighbor net', 'Street resources'],
    member: ['Voice in your place', 'Weekly share (after personhood)', 'Proposal participation'],
    citizen: ['Recovery friend role', 'Jar keeper', 'Hello-day greeter', 'Place keeper eligibility'],
  };
  return benefits[level];
}

// ─── Helper Chorus Cap ───────────────────────────────────────────────────────

const CHORUS_CAP = 0.05; // 5% maximum helper advisory weight

/**
 * Calculate effective helper voting weight with chorus cap.
 * Default is 0% — only applies if place opted in.
 */
export function getHelperVoteWeight(place: string, totalHumanVotes: number, placeOptedIn: boolean): number {
  if (!placeOptedIn) return 0;
  return Math.floor(totalHumanVotes * CHORUS_CAP);
}
