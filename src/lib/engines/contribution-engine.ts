/**
 * Contribution & Attestation Engine — "that happened" flow.
 * 
 * The person who received help taps "that happened."
 * Or 2 neighbors. Or a shop till / class list / build ticket.
 * Helpers may suggest but cannot attest for humans.
 * 
 * Weighted toward the place you stand. Caps per week.
 * Same-household attestations count less. New profiles earn slowly.
 */

import { getAttestationWeight, StandingFacet, applyDecay } from './standing';

export interface Attestation {
  id: string;
  /** Who did the work */
  for: string;
  /** Who confirmed it */
  from: string;
  /** What kind of contribution */
  facet: StandingFacet;
  /** What they did */
  reason: string;
  /** When */
  timestamp: string;
  /** Calculated weight (same-household reduced, new-profile slower) */
  weight: number;
  /** Place where it happened */
  place: string;
}

export interface ContributionCap {
  userId: string;
  weekStart: string;
  attestationsGiven: number;
  attestationsReceived: number;
  maxGivePerWeek: number;
  maxReceivePerWeek: number;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const attestations: Attestation[] = [];
const caps: Map<string, ContributionCap> = new Map();

const MAX_GIVE_PER_WEEK = 10;
const MAX_RECEIVE_PER_WEEK = 20;

// ─── "That Happened" Flow ────────────────────────────────────────────────────

/**
 * Attest that someone contributed. The core "that happened" action.
 */
export function attestContribution(params: {
  for: string;
  from: string;
  facet: StandingFacet;
  reason: string;
  place: string;
  fromHousehold: boolean;
  attesterIsNew: boolean;
}): { success: boolean; attestation?: Attestation; error?: string } {
  // Check caps
  const fromCap = getOrCreateCap(params.from);
  if (fromCap.attestationsGiven >= MAX_GIVE_PER_WEEK) {
    return { success: false, error: `You can attest up to ${MAX_GIVE_PER_WEEK} times per week. Try next week.` };
  }

  const forCap = getOrCreateCap(params.for);
  if (forCap.attestationsReceived >= MAX_RECEIVE_PER_WEEK) {
    return { success: false, error: 'This person has reached their weekly attestation cap.' };
  }

  // Calculate weight
  const weight = getAttestationWeight({
    fromHousehold: params.fromHousehold,
    attesterIsNew: params.attesterIsNew,
    dailyAttestationCount: getDailyCount(params.from),
  });

  const attestation: Attestation = {
    id: `att_${Date.now()}`,
    for: params.for,
    from: params.from,
    facet: params.facet,
    reason: params.reason,
    timestamp: new Date().toISOString(),
    weight,
    place: params.place,
  };

  attestations.push(attestation);

  // Update caps
  fromCap.attestationsGiven++;
  forCap.attestationsReceived++;
  caps.set(params.from, fromCap);
  caps.set(params.for, forCap);

  return { success: true, attestation };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Get total weighted score for a user on a facet.
 */
export function getFacetScore(userId: string, facet: StandingFacet): number {
  const userAttestations = attestations.filter((a) => a.for === userId && a.facet === facet);
  return applyDecay(userAttestations as any);
}

/**
 * Get all attestations for a user.
 */
export function getUserAttestations(userId: string): Attestation[] {
  return attestations.filter((a) => a.for === userId);
}

/**
 * Get attestations given by a user.
 */
export function getGivenAttestations(userId: string): Attestation[] {
  return attestations.filter((a) => a.from === userId);
}

// ─── Caps ────────────────────────────────────────────────────────────────────

function getOrCreateCap(userId: string): ContributionCap {
  const existing = caps.get(userId);
  const weekStart = getWeekStart();

  if (existing && existing.weekStart === weekStart) {
    return existing;
  }

  // New week, reset
  const cap: ContributionCap = {
    userId,
    weekStart,
    attestationsGiven: 0,
    attestationsReceived: 0,
    maxGivePerWeek: MAX_GIVE_PER_WEEK,
    maxReceivePerWeek: MAX_RECEIVE_PER_WEEK,
  };
  caps.set(userId, cap);
  return cap;
}

function getDailyCount(userId: string): number {
  const todaySplit = new Date().toISOString().split('T');
  const today = todaySplit[0] ?? '';
  return attestations.filter((a) => a.from === userId && a.timestamp.startsWith(today)).length;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const date = new Date(now.setDate(diff));
  const weekStartSplit = date.toISOString().split('T');
  return weekStartSplit[0] ?? '';
}
