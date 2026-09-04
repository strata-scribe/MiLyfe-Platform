export type AppealStatus = 'pending' | 'in_review' | 'resolved';

export interface Appeal {
  id: string;
  decisionId: string;
  appellantId: string;
  reason: string;
  status: AppealStatus;
  createdAt: Date;
}

export function createAppeal(decisionId: string, appellantId: string, reason: string): Appeal {
  if (!decisionId || !appellantId || !reason) {
    throw new Error('Missing required fields for appeal creation');
  }

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    decisionId,
    appellantId,
    reason,
    status: 'pending',
    createdAt: new Date()
  };
}

export interface CandidateJuror {
  id: string;
  reputation: number;
  isAvailable: boolean;
}

export function selectJurorPool(candidates: CandidateJuror[], requiredSize: number = 5, minReputation: number = 50): CandidateJuror[] {
  if (requiredSize <= 0) {
    throw new Error('Required size must be greater than 0');
  }

  const eligible = candidates.filter(c => c.isAvailable && c.reputation >= minReputation);

  // Sort by reputation descending as a simple selection mechanism
  const pool = eligible.sort((a, b) => b.reputation - a.reputation).slice(0, requiredSize);

  if (pool.length < requiredSize) {
    throw new Error('Not enough eligible jurors to form a pool');
  }

  return pool;
}

export type Vote = 'upheld' | 'overturned';

export interface VerdictResult {
  upheld: number;
  overturned: number;
  verdict: 'upheld' | 'overturned' | 'tied';
}

export function tallyVerdict(votes: Vote[]): VerdictResult {
  if (!votes || votes.length === 0) {
    throw new Error('No votes provided');
  }

  let upheld = 0;
  let overturned = 0;

  for (const vote of votes) {
    if (vote === 'upheld') upheld++;
    else if (vote === 'overturned') overturned++;
  }

  let verdict: 'upheld' | 'overturned' | 'tied' = 'tied';
  if (upheld > overturned) verdict = 'upheld';
  if (overturned > upheld) verdict = 'overturned';

  return {
    upheld,
    overturned,
    verdict
  };
}
