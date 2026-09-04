import { describe, it, expect } from 'vitest';
import { migrateJurisdiction, PortableStanding, CivicRegistration, Jurisdiction } from '../../identity/placeshift';

describe('migrateJurisdiction', () => {
  it('should preserve portable standing and archive local registrations while creating pending new registrations', () => {
    const standing: PortableStanding = {
      neighbor: 10,
      carer: 5,
      maker: 2,
      teacher: 8,
      keeper: 4,
      voice: 6,
      shop: 1,
      helper: 3,
      overall: 4.875
    };

    const fromJur: Jurisdiction = { id: 'old-town', name: 'Old Town', countryCode: 'US', level: 'city' };
    const toJur: Jurisdiction = { id: 'new-city', name: 'New City', countryCode: 'US', level: 'city' };

    const regs: CivicRegistration[] = [
      { id: '1', jurisdictionId: 'old-town', type: 'resident', status: 'active', issuedAt: '2023-01-01' },
      { id: '2', jurisdictionId: 'old-town', type: 'library', status: 'active', issuedAt: '2023-02-01' },
      { id: '3', jurisdictionId: 'other-city', type: 'library', status: 'active', issuedAt: '2022-01-01' }
    ];

    const result = migrateJurisdiction(standing, regs, fromJur, toJur);

    // 1. Standing is exactly preserved
    expect(result.migratedStanding).toEqual(standing);

    // 2. Old registrations are archived (except those not in the departing jurisdiction)
    expect(result.archivedRegistrations.find(r => r.id === '1')?.status).toBe('archived');
    expect(result.archivedRegistrations.find(r => r.id === '2')?.status).toBe('archived');
    expect(result.archivedRegistrations.find(r => r.id === '3')?.status).toBe('active'); // Remains active since it's not from 'old-town'

    // 3. Pending registrations are created
    expect(result.pendingRegistrations).toHaveLength(2);
    expect(result.pendingRegistrations).toContainEqual({
      jurisdictionId: 'new-city',
      type: 'resident',
      status: 'pending'
    });
    expect(result.pendingRegistrations).toContainEqual({
      jurisdictionId: 'new-city',
      type: 'voter',
      status: 'pending'
    });
  });
});
