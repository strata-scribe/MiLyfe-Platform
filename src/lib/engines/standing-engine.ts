/**
 * Standing Service — facet calculation, cooling, and portability.
 * 
 * Standing is NOT a social credit score. It cannot take:
 * profile, voice on compact rights, weekly share, messages, or emergency help.
 * 
 * Facets: Neighbor, Carer, Maker, Teacher, Keeper, Voice, Shop, Helper.
 * Cools with time. Harm leaves a scar only after closed process.
 */

export type StandingFacet = 'neighbor' | 'carer' | 'maker' | 'teacher' | 'keeper' | 'voice' | 'shop' | 'helper';

export interface FacetScore {
  facet: StandingFacet;
  level: 'new' | 'growing' | 'active' | 'established';
  attestations: number;
  decayedAttestations: number;
  lastActivity: string;
  portable: boolean; // Can travel with you when you move
}

export interface StandingScar {
  id: string;
  description: string;
  date: string;
  response?: string; // Member's answer to the scar
  expiresAt: string; // When it fades (18 months default)
  permanent: boolean; // Violence/child harm stay longer
  processId: string; // Reference to the closed process that created it
}

export interface StandingProfile {
  userId: string;
  place: string;
  facets: FacetScore[];
  scars: StandingScar[];
  hiddenFacets: StandingFacet[]; // Member chose to hide these
}

// ─── Attestation Processing ──────────────────────────────────────────────────

interface Attestation {
  from: string;
  for: StandingFacet;
  reason: string;
  timestamp: string;
  weight: number; // 0-1, reduced for same-household
}

/**
 * Calculate the level of a facet based on attestations.
 */
export function calculateLevel(attestations: number): FacetScore['level'] {
  if (attestations >= 20) return 'established';
  if (attestations >= 10) return 'active';
  if (attestations >= 3) return 'growing';
  return 'new';
}

/**
 * Apply time decay to attestations.
 * Standing cools naturally — forgiveness is built in.
 */
export function applyDecay(attestations: Attestation[], decayMonths: number = 6): number {
  const now = Date.now();
  return attestations.reduce((sum, a) => {
    const ageMs = now - new Date(a.timestamp).getTime();
    const ageMonths = ageMs / (30 * 24 * 60 * 60 * 1000);
    // Exponential decay: halves every decayMonths
    const factor = Math.pow(0.5, ageMonths / decayMonths);
    return sum + (a.weight * factor);
  }, 0);
}

/**
 * Check if an attestation should count less (same-household, rate-limited).
 */
export function getAttestationWeight(params: {
  fromHousehold: boolean;
  attesterIsNew: boolean;
  dailyAttestationCount: number;
}): number {
  let weight = 1.0;

  // Same-household attestations count less
  if (params.fromHousehold) weight *= 0.3;

  // New profiles earn slowly
  if (params.attesterIsNew) weight *= 0.5;

  // Rate limiting: diminishing returns per day
  if (params.dailyAttestationCount > 3) weight *= 0.2;
  else if (params.dailyAttestationCount > 1) weight *= 0.6;

  return weight;
}

// ─── Portability ─────────────────────────────────────────────────────────────

/**
 * What travels when you move places.
 * Craft and care can travel. "Known on this street" stays.
 */
export function getPortableFacets(): StandingFacet[] {
  return ['carer', 'maker', 'teacher']; // Craft and care
}

export function getNonPortableFacets(): StandingFacet[] {
  return ['neighbor', 'keeper', 'voice', 'shop']; // Local only
}

/**
 * When you move: local standing cools, portable badges can travel.
 */
export function handlePlaceTransition(profile: StandingProfile, newPlace: string): StandingProfile {
  const portableFacets = getPortableFacets();

  return {
    ...profile,
    place: newPlace,
    facets: profile.facets.map((f) => {
      if (portableFacets.includes(f.facet)) {
        // Portable: carries over at reduced level
        return { ...f, level: reducedLevel(f.level) };
      }
      // Non-portable: resets to new
      return { ...f, level: 'new', attestations: 0, decayedAttestations: 0 };
    }),
  };
}

function reducedLevel(level: FacetScore['level']): FacetScore['level'] {
  switch (level) {
    case 'established':
      return 'active';
    case 'active':
      return 'growing';
    case 'growing':
      return 'new';
    case 'new':
      return 'new';
  }
}

// ─── Scars ───────────────────────────────────────────────────────────────────

/**
 * Check if a scar has faded (18 months default).
 */
export function hasScarFaded(scar: StandingScar): boolean {
  if (scar.permanent) return false;
  return new Date(scar.expiresAt) < new Date();
}

/**
 * Create a scar. Only allowed from a closed process.
 */
export function createScar(params: {
  description: string;
  processId: string;
  permanent?: boolean;
  expiryMonths?: number;
}): StandingScar {
  const expiryMs = (params.expiryMonths || 18) * 30 * 24 * 60 * 60 * 1000;
  return {
    id: `scar_${Date.now()}`,
    description: params.description,
    date: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiryMs).toISOString(),
    permanent: params.permanent || false,
    processId: params.processId,
  };
}
