export interface Delegation {
  delegatorId: string;
  delegateeId: string;
  topic: string;
}

export class DelegationManager {
  private delegations: Map<string, Delegation>; // Keyed by `${delegatorId}:${topic}`

  constructor() {
    this.delegations = new Map();
  }

  /**
   * Delegates voting power from a delegator to a delegatee for a specific topic.
   * Use topic 'general' for default delegation.
   */
  delegate(delegatorId: string, delegateeId: string, topic: string = 'general'): void {
    if (delegatorId === delegateeId) {
      throw new Error('Self-delegation is not allowed in this operation.');
    }
    const key = `${delegatorId}:${topic}`;
    this.delegations.set(key, { delegatorId, delegateeId, topic });
  }

  /**
   * Immediately revokes a delegation for a specific topic.
   */
  revokeDelegation(delegatorId: string, topic: string = 'general'): void {
    const key = `${delegatorId}:${topic}`;
    this.delegations.delete(key);
  }

  /**
   * Resolves the final delegatee for a given delegator and topic, considering transitive delegations.
   * If a topic-specific delegation exists, it takes precedence. Otherwise, it falls back to 'general'.
   *
   * Returns the final delegateeId, or the delegatorId if no valid delegate is found or a cycle occurs.
   */
  resolveDelegate(delegatorId: string, topic: string = 'general'): string {
    const visited = new Set<string>();
    let currentId = delegatorId;

    while (true) {
      if (visited.has(currentId)) {
        // Cycle detected, break the chain. Return the last valid node before the cycle,
        // or just stop and let the last valid node be the voter.
        // Actually, if there's a cycle, the power stays with the person who created the cycle,
        // or the chain is invalid. We'll return the currentId (where the cycle closed)
        // or we could throw. Let's return delegatorId to signify no delegation if a cycle is found.
        // But better yet, the person who created the cycle can't delegate, so they must vote themselves,
        // meaning returning `currentId` might be fine.
        // A safer approach: return `delegatorId` to say delegation chain is broken.
        return delegatorId;
      }
      visited.add(currentId);

      // Check topic specific first
      let delegation = this.delegations.get(`${currentId}:${topic}`);

      // Fallback to general if no topic specific delegation
      if (!delegation && topic !== 'general') {
        delegation = this.delegations.get(`${currentId}:general`);
      }

      if (!delegation) {
        // No further delegation, currentId is the final delegatee
        break;
      }

      currentId = delegation.delegateeId;
    }

    return currentId;
  }
}
