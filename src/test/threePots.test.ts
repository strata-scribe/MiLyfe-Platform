import { describe, it, expect } from 'vitest';
import {
  validateThreePotsConfig,
  calculateSplit,
  ThreePotsConfig
} from '../lib/wallet/threePots';

describe('Three Pots Wallet Logic', () => {
  describe('validateThreePotsConfig', () => {
    it('returns true when percentages sum to exactly 100', () => {
      const config: ThreePotsConfig = { spending: 50, savings: 30, community: 20 };
      expect(validateThreePotsConfig(config)).toBe(true);
    });

    it('returns false when percentages sum to less than 100', () => {
      const config: ThreePotsConfig = { spending: 50, savings: 30, community: 10 };
      expect(validateThreePotsConfig(config)).toBe(false);
    });

    it('returns false when percentages sum to more than 100', () => {
      const config: ThreePotsConfig = { spending: 50, savings: 40, community: 20 };
      expect(validateThreePotsConfig(config)).toBe(false);
    });

    it('returns false when any percentage is negative', () => {
      const config: ThreePotsConfig = { spending: 110, savings: -10, community: 0 };
      expect(validateThreePotsConfig(config)).toBe(false);
    });

    it('returns true when some pots are zero but sum is 100', () => {
      const config: ThreePotsConfig = { spending: 100, savings: 0, community: 0 };
      expect(validateThreePotsConfig(config)).toBe(true);
    });
  });

  describe('calculateSplit', () => {
    it('throws error for invalid config', () => {
      const config: ThreePotsConfig = { spending: 50, savings: 50, community: 10 }; // sums to 110
      expect(() => calculateSplit(100, config)).toThrow('Invalid ThreePotsConfig: percentages must sum to 100 and be non-negative.');
    });

    it('splits amount exactly without remainders', () => {
      const config: ThreePotsConfig = { spending: 50, savings: 30, community: 20 };
      const split = calculateSplit(100, config);
      expect(split).toEqual({
        spending: 50,
        savings: 30,
        community: 20
      });
    });

    it('handles decimal amounts and routes remainder to largest pot', () => {
      // 100 / 3 = 33.33333...
      const config: ThreePotsConfig = { spending: 34, savings: 33, community: 33 };

      const split = calculateSplit(10, config);

      // Amount is 10.
      // Expected rough: spending: 3.4, savings: 3.3, community: 3.3
      // Floors: spending: 3.40, savings: 3.30, community: 3.30
      // Sum: 10. Remainder: 0
      expect(split).toEqual({
        spending: 3.40,
        savings: 3.30,
        community: 3.30
      });
    });

    it('handles rounding when remainders exist', () => {
      const config: ThreePotsConfig = { spending: 33.34, savings: 33.33, community: 33.33 };
      const split = calculateSplit(10, config);

      // Amount: 10
      // Rough: spending: 3.334, savings: 3.333, community: 3.333
      // Floor: spending: 3.33, savings: 3.33, community: 3.33
      // Sum: 9.99, Remainder: 0.01
      // Largest pot is spending, so remainder goes there
      expect(split.spending).toBe(3.34);
      expect(split.savings).toBe(3.33);
      expect(split.community).toBe(3.33);

      const totalSplit = split.spending + split.savings + split.community;
      expect(totalSplit).toBe(10);
    });

    it('handles an odd number with perfectly equal pots and assigns remainder to the first largest (spending)', () => {
       // Note: config must sum to 100, so we can't have exactly 33.333... for each pot.
       // Let's use 50, 25, 25 and an odd amount like 10.01
       const config: ThreePotsConfig = { spending: 50, savings: 25, community: 25 };
       const split = calculateSplit(10.01, config);

       // Rough: spending: 5.005, savings: 2.5025, community: 2.5025
       // Floor: spending: 5.00, savings: 2.50, community: 2.50
       // Sum: 10.00, Remainder: 0.01
       // Largest is spending, so it gets the 0.01
       expect(split).toEqual({
         spending: 5.01,
         savings: 2.50,
         community: 2.50
       });
       expect(split.spending + split.savings + split.community).toBeCloseTo(10.01);
    });
  });
});
