import { describe, it, expect, beforeEach } from 'vitest';
import { DelegationManager } from './delegation';

describe('DelegationManager', () => {
  let manager: DelegationManager;

  beforeEach(() => {
    manager = new DelegationManager();
  });

  it('should resolve to self if no delegation exists', () => {
    expect(manager.resolveDelegate('alice')).toBe('alice');
  });

  it('should support direct delegation (general topic)', () => {
    manager.delegate('alice', 'bob');
    expect(manager.resolveDelegate('alice')).toBe('bob');
  });

  it('should support transitive delegation', () => {
    manager.delegate('alice', 'bob');
    manager.delegate('bob', 'charlie');
    expect(manager.resolveDelegate('alice')).toBe('charlie');
  });

  it('should prioritize topic-specific delegation over general delegation', () => {
    manager.delegate('alice', 'bob', 'general');
    manager.delegate('alice', 'dave', 'environmental');

    expect(manager.resolveDelegate('alice', 'general')).toBe('bob');
    expect(manager.resolveDelegate('alice', 'environmental')).toBe('dave');
    expect(manager.resolveDelegate('alice', 'economy')).toBe('bob'); // Fallback to general
  });

  it('should allow transitive delegation with topic fallback', () => {
    manager.delegate('alice', 'bob', 'general');
    manager.delegate('bob', 'charlie', 'environmental');

    // Alice delegates to Bob (general)
    // Bob delegates to Charlie (environmental)
    // For environmental, Alice -> Bob -> Charlie
    expect(manager.resolveDelegate('alice', 'environmental')).toBe('charlie');
  });

  it('should immediately revoke delegation', () => {
    manager.delegate('alice', 'bob');
    expect(manager.resolveDelegate('alice')).toBe('bob');

    manager.revokeDelegation('alice');
    expect(manager.resolveDelegate('alice')).toBe('alice');
  });

  it('should detect cycles and return delegatorId to break chain', () => {
    manager.delegate('alice', 'bob');
    manager.delegate('bob', 'charlie');
    manager.delegate('charlie', 'alice'); // Cycle: Alice -> Bob -> Charlie -> Alice

    // Due to the cycle, the chain is broken, so it should resolve to Alice (the start of the query)
    expect(manager.resolveDelegate('alice')).toBe('alice');
    expect(manager.resolveDelegate('bob')).toBe('bob');
  });

  it('should not allow self delegation', () => {
    expect(() => {
      manager.delegate('alice', 'alice');
    }).toThrow('Self-delegation is not allowed in this operation.');
  });
});
