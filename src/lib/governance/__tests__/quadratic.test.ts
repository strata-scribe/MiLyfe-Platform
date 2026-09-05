import { describe, it, expect } from 'vitest';
import { calculateQuadraticCost, allocateVoiceCredits, validateVoteCast } from '../quadratic';

describe('Quadratic Voting', () => {
  describe('calculateQuadraticCost', () => {
    it('calculates the cost for positive votes correctly', () => {
      expect(calculateQuadraticCost(1)).toBe(1);
      expect(calculateQuadraticCost(2)).toBe(4);
      expect(calculateQuadraticCost(3)).toBe(9);
      expect(calculateQuadraticCost(4)).toBe(16);
      expect(calculateQuadraticCost(10)).toBe(100);
    });

    it('calculates the cost for negative votes correctly (assuming negative votes mean opposition but still cost absolute squared)', () => {
      expect(calculateQuadraticCost(-1)).toBe(1);
      expect(calculateQuadraticCost(-2)).toBe(4);
      expect(calculateQuadraticCost(-3)).toBe(9);
    });

    it('calculates the cost for zero votes as zero', () => {
      expect(calculateQuadraticCost(0)).toBe(0);
    });
  });

  describe('allocateVoiceCredits', () => {
    it('adds credits correctly', () => {
      expect(allocateVoiceCredits(10, 5)).toBe(15);
      expect(allocateVoiceCredits(0, 100)).toBe(100);
    });

    it('throws an error if allocation amount is negative', () => {
      expect(() => allocateVoiceCredits(10, -5)).toThrow('Allocation amount must be non-negative');
    });
  });

  describe('validateVoteCast', () => {
    it('returns valid when credits are sufficient', () => {
      const result = validateVoteCast(3, 10);
      expect(result).toEqual({
        valid: true,
        cost: 9,
        remaining: 1,
      });
    });

    it('returns valid when credits are exactly sufficient', () => {
      const result = validateVoteCast(4, 16);
      expect(result).toEqual({
        valid: true,
        cost: 16,
        remaining: 0,
      });
    });

    it('returns valid for zero votes with zero available credits', () => {
      const result = validateVoteCast(0, 0);
      expect(result).toEqual({
        valid: true,
        cost: 0,
        remaining: 0,
      });
    });

    it('returns invalid when credits are insufficient (exhaustion validation)', () => {
      const result = validateVoteCast(5, 20); // 5 votes cost 25
      expect(result).toEqual({
        valid: false,
        cost: 25,
        remaining: 20, // should be unchanged since it failed
        error: 'Insufficient voice credits. Required: 25, Available: 20',
      });
    });

    it('returns invalid with negative votes if credits are insufficient', () => {
      const result = validateVoteCast(-3, 8); // -3 votes cost 9
      expect(result).toEqual({
        valid: false,
        cost: 9,
        remaining: 8,
        error: 'Insufficient voice credits. Required: 9, Available: 8',
      });
    });
  });
});
