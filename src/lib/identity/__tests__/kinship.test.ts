import { describe, it, expect } from 'vitest';
import { KinshipService, User, KinshipInvariantError } from '../kinship';

describe('KinshipService', () => {
  it('creates a household successfully for adult', () => {
    const hh = KinshipService.createHousehold('head1', 25);
    expect(hh.headId).toBe('head1');
    expect(hh.memberIds).toContain('head1');
  });

  it('fails to create a household for a minor', () => {
    expect(() => KinshipService.createHousehold('head2', 16)).toThrow(KinshipInvariantError);
  });

  it('adds a member to household', () => {
    let hh = KinshipService.createHousehold('head1');
    hh = KinshipService.addHouseholdMember(hh, 'member1');
    expect(hh.memberIds).toContain('member1');
  });

  it('fails to add an already existing member to household', () => {
    const hh = KinshipService.createHousehold('head1');
    expect(() => KinshipService.addHouseholdMember(hh, 'head1')).toThrow(KinshipInvariantError);
  });

  it('authorizes dependent care successfully', () => {
    const guardian: User = { id: 'g1', role: 'head' };
    const dependent: User = { id: 'd1', role: 'dependent' };
    const auth = KinshipService.authorizeDependentCare(guardian, dependent);
    expect(auth.guardianId).toBe('g1');
    expect(auth.dependentId).toBe('d1');
  });

  it('fails dependent care if guardian is dependent', () => {
    const guardian: User = { id: 'g1', role: 'dependent' };
    const dependent: User = { id: 'd1', role: 'dependent' };
    expect(() => KinshipService.authorizeDependentCare(guardian, dependent)).toThrow(KinshipInvariantError);
  });

  it('fails dependent care if proxy is dependent', () => {
    const guardian: User = { id: 'g1', role: 'head' };
    const dependent: User = { id: 'd1', role: 'proxy' };
    expect(() => KinshipService.authorizeDependentCare(guardian, dependent)).toThrow(KinshipInvariantError);
  });

  it('assigns elder proxy successfully', () => {
    const proxy: User = { id: 'p1', role: 'head' };
    const elder: User = { id: 'e1', role: 'elder' };
    const rep = KinshipService.assignElderProxy(proxy, elder);
    expect(rep.proxyId).toBe('p1');
    expect(rep.elderId).toBe('e1');
  });

  it('fails elder proxy assignment if proxy is elder', () => {
    const proxy: User = { id: 'p1', role: 'elder' };
    const elder: User = { id: 'e1', role: 'elder' };
    expect(() => KinshipService.assignElderProxy(proxy, elder)).toThrow(KinshipInvariantError);
  });

  it('checks if can act as proxy', () => {
    const proxy: User = { id: 'p1', role: 'head' };
    const elder: User = { id: 'e1', role: 'elder' };
    const rep = KinshipService.assignElderProxy(proxy, elder);
    expect(KinshipService.canActAsProxy('p1', 'e1', rep)).toBe(true);
    expect(KinshipService.canActAsProxy('invalid', 'e1', rep)).toBe(false);
  });
});
