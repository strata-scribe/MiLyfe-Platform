export interface Jurisdiction {
  id: string;
  name: string;
  countryCode: string;
  subdivision?: string;
  level: 'national' | 'regional' | 'city' | 'neighborhood';
}

export interface PortableStanding {
  neighbor: number;
  carer: number;
  maker: number;
  teacher: number;
  keeper: number;
  voice: number;
  shop: number;
  helper: number;
  overall: number;
}

export type RegistrationStatus = 'active' | 'archived' | 'pending' | 'revoked';

export type RegistrationType = 'resident' | 'voter' | 'business' | 'library' | 'community_board';

export interface CivicRegistration {
  id: string;
  jurisdictionId: string;
  type: RegistrationType;
  status: RegistrationStatus;
  issuedAt: string;
  expiresAt?: string;
}

export interface PlaceshiftMigrationResult {
  /** The standing facets that travel with the citizen */
  migratedStanding: PortableStanding;
  /** Civic registrations that are location-bound and must be archived in the old jurisdiction */
  archivedRegistrations: CivicRegistration[];
  /** New civic registrations required or recommended in the destination jurisdiction */
  pendingRegistrations: Omit<CivicRegistration, 'id' | 'issuedAt'>[];
}

/**
 * Implements jurisdiction migration logic (Placeshift) by separating
 * portable personal standing from location-bound civic registrations.
 *
 * @param currentStanding The user's current 8-facet standing (fully portable)
 * @param currentRegistrations The user's active civic registrations
 * @param fromJurisdiction The jurisdiction the user is leaving
 * @param toJurisdiction The jurisdiction the user is migrating to
 * @returns PlaceshiftMigrationResult containing migrated standing and updated registrations
 */
export function migrateJurisdiction(
  currentStanding: PortableStanding,
  currentRegistrations: CivicRegistration[],
  fromJurisdiction: Jurisdiction,
  toJurisdiction: Jurisdiction
): PlaceshiftMigrationResult {
  // 1. Portable Personal Standing travels with the citizen without loss
  const migratedStanding: PortableStanding = {
    ...currentStanding
  };

  // 2. Location-bound civic registrations are archived for the departing jurisdiction
  const archivedRegistrations: CivicRegistration[] = currentRegistrations.map((reg) => {
    if (reg.jurisdictionId === fromJurisdiction.id && reg.status === 'active') {
      return { ...reg, status: 'archived' as RegistrationStatus };
    }
    return reg;
  });

  // 3. Setup pending location-bound civic registrations for the new jurisdiction
  const pendingRegistrations: Omit<CivicRegistration, 'id' | 'issuedAt'>[] = [
    {
      jurisdictionId: toJurisdiction.id,
      type: 'resident',
      status: 'pending',
    },
    // We assume most basic moves require registering to vote in the new local jurisdiction
    {
      jurisdictionId: toJurisdiction.id,
      type: 'voter',
      status: 'pending',
    }
  ];

  return {
    migratedStanding,
    archivedRegistrations,
    pendingRegistrations
  };
}
