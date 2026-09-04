import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScopeGraph,
  resolvePermissions,
  ScopeEdge,
  ScopeCheckRequest,
} from '../../protocol/scope';

describe('MiScope Protocol - Permission Resolution', () => {
  let graph: ScopeGraph;

  beforeEach(() => {
    graph = new ScopeGraph();
  });

  it('allows self-access for all resources and actions', () => {
    const request: ScopeCheckRequest = {
      actorId: 'user-1',
      targetId: 'user-1',
      action: 'read',
      resource: 'health',
    };
    const result = resolvePermissions(graph, request);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('self-access');
  });

  describe('Guardian Relationships', () => {
    beforeEach(() => {
      graph.addEdge({
        from: 'guardian-1',
        to: 'ward-1',
        type: 'guardian',
      });
    });

    it('grants guardian full access to ward resources', () => {
      const request: ScopeCheckRequest = {
        actorId: 'guardian-1',
        targetId: 'ward-1',
        action: 'write',
        resource: 'finance',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('guardian-access');
    });

    it('denies access if relationship is reversed', () => {
      const request: ScopeCheckRequest = {
        actorId: 'ward-1',
        targetId: 'guardian-1',
        action: 'read',
        resource: 'profile',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('no-relationship-or-permission');
    });
  });

  describe('Household Relationships', () => {
    beforeEach(() => {
      // Household relationships can be symmetric or handled uniformly
      graph.addEdge({
        from: 'member-1',
        to: 'member-2',
        type: 'household',
      });
    });

    it('grants household members read access to basic profiles', () => {
      const request: ScopeCheckRequest = {
        actorId: 'member-1',
        targetId: 'member-2',
        action: 'read',
        resource: 'profile',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('household-read');
    });

    it('denies household members read access to health or finance', () => {
      const request1: ScopeCheckRequest = {
        actorId: 'member-1',
        targetId: 'member-2',
        action: 'read',
        resource: 'health',
      };
      expect(resolvePermissions(graph, request1).allowed).toBe(false);

      const request2: ScopeCheckRequest = {
        actorId: 'member-1',
        targetId: 'member-2',
        action: 'read',
        resource: 'finance',
      };
      expect(resolvePermissions(graph, request2).allowed).toBe(false);
    });
  });

  describe('Care Relationships', () => {
    beforeEach(() => {
      graph.addEdge({
        from: 'nurse-1',
        to: 'patient-1',
        type: 'care',
      });
    });

    it('grants care provider access to health resources', () => {
      const request: ScopeCheckRequest = {
        actorId: 'nurse-1',
        targetId: 'patient-1',
        action: 'write', // Depending on specific care roles, we might refine this
        resource: 'health',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('care-health-access');
    });

    it('denies care provider access to finance resources', () => {
      const request: ScopeCheckRequest = {
        actorId: 'nurse-1',
        targetId: 'patient-1',
        action: 'read',
        resource: 'finance',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('no-relationship-or-permission');
    });
  });

  describe('Delegation Relationships', () => {
    beforeEach(() => {
      graph.addEdge({
        from: 'delegate-1',
        to: 'user-1',
        type: 'delegation',
        metadata: {
          allowedActions: ['read', 'write'],
          allowedResources: ['finance'],
        },
      });
    });

    it('grants delegated access based on metadata allowed scopes', () => {
      const request: ScopeCheckRequest = {
        actorId: 'delegate-1',
        targetId: 'user-1',
        action: 'write',
        resource: 'finance',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('delegated-access');
    });

    it('denies access if action is not in metadata allowed scopes', () => {
      const request: ScopeCheckRequest = {
        actorId: 'delegate-1',
        targetId: 'user-1',
        action: 'delete',
        resource: 'finance',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('no-relationship-or-permission');
    });

    it('denies access if resource is not in metadata allowed scopes', () => {
      const request: ScopeCheckRequest = {
        actorId: 'delegate-1',
        targetId: 'user-1',
        action: 'read',
        resource: 'profile',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('no-relationship-or-permission');
    });
  });

  describe('Unrelated Users', () => {
    it('denies access if no relationship exists', () => {
      const request: ScopeCheckRequest = {
        actorId: 'random-1',
        targetId: 'user-1',
        action: 'read',
        resource: 'profile',
      };
      const result = resolvePermissions(graph, request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('no-relationship-or-permission');
    });
  });
});
