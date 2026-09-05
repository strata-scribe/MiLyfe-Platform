export function calculateQuadraticCost(votes: number): number {
  return Math.pow(votes, 2);
}

export function allocateVoiceCredits(currentCredits: number, allocationAmount: number): number {
  if (allocationAmount < 0) {
    throw new Error('Allocation amount must be non-negative');
  }
  return currentCredits + allocationAmount;
}

export interface VoteValidationResult {
  valid: boolean;
  cost: number;
  remaining: number;
  error?: string;
}

export function validateVoteCast(votes: number, availableCredits: number): VoteValidationResult {
  const cost = calculateQuadraticCost(votes);
  const remaining = availableCredits - cost;

  if (remaining < 0) {
    return {
      valid: false,
      cost,
      remaining: availableCredits, // If invalid, credits aren't spent
      error: `Insufficient voice credits. Required: ${cost}, Available: ${availableCredits}`,
    };
  }

  return {
    valid: true,
    cost,
    remaining,
  };
}
