import { describe, it, expect } from 'vitest';
import { createAppeal, selectJurorPool, tallyVerdict, CandidateJuror, Vote } from '../appeal';

describe('appeal module', () => {
  describe('createAppeal', () => {
    it('creates an appeal successfully', () => {
      const appeal = createAppeal('decision-1', 'user-1', 'I disagree with this');

      expect(appeal.id).toBeDefined();
      expect(appeal.decisionId).toBe('decision-1');
      expect(appeal.appellantId).toBe('user-1');
      expect(appeal.reason).toBe('I disagree with this');
      expect(appeal.status).toBe('pending');
      expect(appeal.createdAt).toBeInstanceOf(Date);
    });

    it('throws error if missing required fields', () => {
      expect(() => createAppeal('', 'user-1', 'reason')).toThrow('Missing required fields for appeal creation');
      expect(() => createAppeal('decision-1', '', 'reason')).toThrow('Missing required fields for appeal creation');
      expect(() => createAppeal('decision-1', 'user-1', '')).toThrow('Missing required fields for appeal creation');
    });
  });

  describe('selectJurorPool', () => {
    const candidates: CandidateJuror[] = [
      { id: '1', reputation: 100, isAvailable: true },
      { id: '2', reputation: 80, isAvailable: true },
      { id: '3', reputation: 40, isAvailable: true }, // Not enough reputation
      { id: '4', reputation: 90, isAvailable: false }, // Not available
      { id: '5', reputation: 60, isAvailable: true },
      { id: '6', reputation: 70, isAvailable: true },
      { id: '7', reputation: 50, isAvailable: true },
    ];

    it('selects a valid pool of jurors based on reputation and availability', () => {
      const pool = selectJurorPool(candidates, 3, 50);
      expect(pool.length).toBe(3);
      // Expected to sort by reputation descending: 100, 80, 70
      expect(pool[0].id).toBe('1');
      expect(pool[1].id).toBe('2');
      expect(pool[2].id).toBe('6');
    });

    it('throws error if not enough eligible candidates', () => {
      expect(() => selectJurorPool(candidates, 10, 50)).toThrow('Not enough eligible jurors to form a pool');
    });

    it('throws error if required size is invalid', () => {
      expect(() => selectJurorPool(candidates, 0, 50)).toThrow('Required size must be greater than 0');
    });
  });

  describe('tallyVerdict', () => {
    it('correctly tallies an upheld verdict', () => {
      const votes: Vote[] = ['upheld', 'upheld', 'overturned'];
      const result = tallyVerdict(votes);

      expect(result.upheld).toBe(2);
      expect(result.overturned).toBe(1);
      expect(result.verdict).toBe('upheld');
    });

    it('correctly tallies an overturned verdict', () => {
      const votes: Vote[] = ['overturned', 'upheld', 'overturned', 'overturned'];
      const result = tallyVerdict(votes);

      expect(result.upheld).toBe(1);
      expect(result.overturned).toBe(3);
      expect(result.verdict).toBe('overturned');
    });

    it('correctly identifies a tied verdict', () => {
      const votes: Vote[] = ['upheld', 'overturned', 'upheld', 'overturned'];
      const result = tallyVerdict(votes);

      expect(result.upheld).toBe(2);
      expect(result.overturned).toBe(2);
      expect(result.verdict).toBe('tied');
    });

    it('throws error if no votes are provided', () => {
      expect(() => tallyVerdict([])).toThrow('No votes provided');
    });
  });
});
