/**
 * MiLyfe Kinship Module
 *
 * Handles household grouping, dependent care authorization, and elder care proxy
 * representation logic with safety invariants.
 */

// --- Types ---

export type KinshipRole = 'head' | 'member' | 'dependent' | 'elder' | 'proxy';

export interface User {
  id: string;
  role?: KinshipRole;
  age?: number;
}

export interface Household {
  id: string;
  headId: string;
  memberIds: string[];
  createdAt: Date;
}

export interface CareAuthorization {
  id: string;
  guardianId: string;
  dependentId: string;
  actionScopes: string[];
  expiresAt?: Date;
  active: boolean;
}

export interface ProxyRepresentation {
  id: string;
  proxyId: string;
  elderId: string;
  active: boolean;
  grantedAt: Date;
}

// --- Safety Invariants (Errors) ---

export class KinshipInvariantError extends Error {
  constructor(message: string) {
    super(`Kinship Invariant Violation: ${message}`);
    this.name = 'KinshipInvariantError';
  }
}

// --- Logic ---

export class KinshipService {
  /**
   * Creates a household.
   * Safety Invariant: A household must have a capable head. We assume age >= 18 is required if age is provided.
   */
  static createHousehold(headId: string, headAge?: number): Household {
    if (headAge !== undefined && headAge < 18) {
      throw new KinshipInvariantError('Household head must be an adult.');
    }
    return {
      id: `hh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      headId,
      memberIds: [headId],
      createdAt: new Date(),
    };
  }

  /**
   * Adds a member to the household.
   */
  static addHouseholdMember(household: Household, newMemberId: string): Household {
    if (household.memberIds.includes(newMemberId)) {
      throw new KinshipInvariantError('User is already a member of this household.');
    }
    return {
      ...household,
      memberIds: [...household.memberIds, newMemberId],
    };
  }

  /**
   * Authorizes dependent care.
   * Safety Invariant: A dependent cannot act as a guardian.
   * Safety Invariant: Guardian and dependent cannot be the same person.
   */
  static authorizeDependentCare(
    guardian: User,
    dependent: User,
    actionScopes: string[] = ['all']
  ): CareAuthorization {
    if (guardian.id === dependent.id) {
      throw new KinshipInvariantError('A user cannot be their own guardian.');
    }
    if (guardian.role === 'dependent') {
      throw new KinshipInvariantError('A dependent cannot act as a guardian.');
    }
    if (dependent.role === 'proxy') {
       throw new KinshipInvariantError('A proxy cannot be a dependent.');
    }

    return {
      id: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      guardianId: guardian.id,
      dependentId: dependent.id,
      actionScopes,
      active: true,
    };
  }

  /**
   * Assigns an elder care proxy.
   * Safety Invariant: A dependent cannot be a proxy.
   * Safety Invariant: An elder cannot be a proxy (prevents circular or over-burdened proxies).
   * Safety Invariant: Proxy and elder cannot be the same person.
   */
  static assignElderProxy(proxy: User, elder: User): ProxyRepresentation {
    if (proxy.id === elder.id) {
      throw new KinshipInvariantError('A user cannot be their own proxy.');
    }
    if (proxy.role === 'dependent') {
      throw new KinshipInvariantError('A dependent cannot act as a proxy.');
    }
    if (proxy.role === 'elder') {
      throw new KinshipInvariantError('An elder cannot act as a proxy for another elder.');
    }
    if (elder.role === 'proxy') {
      throw new KinshipInvariantError('A proxy cannot simultaneously be represented as an elder.');
    }

    return {
      id: `proxy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      proxyId: proxy.id,
      elderId: elder.id,
      active: true,
      grantedAt: new Date(),
    };
  }

  /**
   * Validates if a proxy is authorized to act for an elder.
   */
  static canActAsProxy(proxyId: string, elderId: string, proxyRep: ProxyRepresentation): boolean {
    return (
      proxyRep.active &&
      proxyRep.proxyId === proxyId &&
      proxyRep.elderId === elderId
    );
  }
}
