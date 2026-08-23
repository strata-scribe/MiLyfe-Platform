/**
 * Delegation Engine — topic-specific, time-limited, instantly revocable.
 * 
 * Rules: No silent re-delegation. Conflict disclosures required.
 * Privacy-preserving concentration warnings.
 * Proof the delegate acted without revealing secret vote.
 */

export interface Delegation {
  id: string;
  delegator: string;
  delegate: string;
  topic: string;
  place: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  active: boolean;
  /** Whether the delegate has used this delegation */
  exercised: boolean;
  exercisedAt?: string;
  /** Delegate cannot re-delegate */
  reDelegationBlocked: true;
}

export interface ConcentrationWarning {
  delegate: string;
  topic: string;
  delegationCount: number;
  threshold: number;
  warning: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const delegations: Map<string, Delegation> = new Map();

// ─── Create / Revoke ─────────────────────────────────────────────────────────

export function createDelegation(params: {
  delegator: string;
  delegate: string;
  topic: string;
  place: string;
  durationDays: number;
}): Delegation {
  const delegation: Delegation = {
    id: `del_${Date.now()}`,
    delegator: params.delegator,
    delegate: params.delegate,
    topic: params.topic,
    place: params.place,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + params.durationDays * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    exercised: false,
    reDelegationBlocked: true,
  };
  delegations.set(delegation.id, delegation);
  return delegation;
}

/**
 * Instantly revoke a delegation. Takes effect immediately.
 */
export function revokeDelegation(delegationId: string): boolean {
  const del = delegations.get(delegationId);
  if (!del || !del.active) return false;
  del.active = false;
  del.revokedAt = new Date().toISOString();
  delegations.set(delegationId, del);
  return true;
}

/**
 * Mark a delegation as exercised (delegate voted on behalf).
 */
export function markExercised(delegationId: string): boolean {
  const del = delegations.get(delegationId);
  if (!del || !del.active) return false;
  del.exercised = true;
  del.exercisedAt = new Date().toISOString();
  delegations.set(delegationId, del);
  return true;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function getActiveDelegations(delegator: string): Delegation[] {
  return Array.from(delegations.values()).filter(
    (d) => d.delegator === delegator && d.active && new Date(d.expiresAt) > new Date()
  );
}

export function getDelegationsHeldBy(delegate: string): Delegation[] {
  return Array.from(delegations.values()).filter(
    (d) => d.delegate === delegate && d.active && new Date(d.expiresAt) > new Date()
  );
}

// ─── Concentration Tracking ──────────────────────────────────────────────────

const CONCENTRATION_THRESHOLD = 5; // Warn when someone holds 5+ delegations on a topic

/**
 * Check if a delegate has too many delegations (concentration warning).
 * Returns warning in privacy-preserving aggregate form — not who delegated.
 */
export function checkConcentration(delegate: string, topic: string): ConcentrationWarning | null {
  const held = Array.from(delegations.values()).filter(
    (d) => d.delegate === delegate && d.topic === topic && d.active && new Date(d.expiresAt) > new Date()
  );

  if (held.length >= CONCENTRATION_THRESHOLD) {
    return {
      delegate,
      topic,
      delegationCount: held.length,
      threshold: CONCENTRATION_THRESHOLD,
      warning: `This person holds ${held.length} delegated voices on "${topic}". This is visible to auditors in aggregate form.`,
    };
  }
  return null;
}

/**
 * Validate that a delegate is not trying to re-delegate.
 */
export function canDelegate(delegator: string, topic: string): { allowed: boolean; reason?: string } {
  // Check if delegator already delegated this topic (no re-delegation)
  const existing = Array.from(delegations.values()).find(
    (d) => d.delegate === delegator && d.topic === topic && d.active
  );
  if (existing) {
    return { allowed: false, reason: 'You are holding a delegation on this topic. Re-delegation is not allowed.' };
  }
  return { allowed: true };
}
