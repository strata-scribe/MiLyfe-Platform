import { describe, it, expect } from 'vitest';
import { isMinor, canAccessContent, hasGuardianConsent } from '../../src/lib/safety/childgate';

describe('Childgate Safety Module', () => {
  describe('isMinor', () => {
    it('returns true for age 17', () => {
      expect(isMinor(17)).toBe(true);
    });

    it('returns false for age 18', () => {
      expect(isMinor(18)).toBe(false);
    });

    it('returns false for age 19', () => {
      expect(isMinor(19)).toBe(false);
    });
  });

  describe('canAccessContent', () => {
    it('returns false for mature content and age 17', () => {
      expect(canAccessContent(true, 17)).toBe(false);
    });

    it('returns true for non-mature content and age 17', () => {
      expect(canAccessContent(false, 17)).toBe(true);
    });

    it('returns true for mature content and age 18', () => {
      expect(canAccessContent(true, 18)).toBe(true);
    });

    it('returns true for non-mature content and age 18', () => {
      expect(canAccessContent(false, 18)).toBe(true);
    });
  });

  describe('hasGuardianConsent', () => {
    it('returns true when specific action is in scopes', () => {
      expect(hasGuardianConsent('purchase', ['purchase', 'chat'])).toBe(true);
    });

    it('returns false when specific action is not in scopes', () => {
      expect(hasGuardianConsent('purchase', ['chat'])).toBe(false);
    });

    it('returns true when "all" is in scopes', () => {
      expect(hasGuardianConsent('purchase', ['all'])).toBe(true);
    });
  });
});
