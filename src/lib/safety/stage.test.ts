import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCapabilityStage, canPerformAction, STAGE_THRESHOLDS } from './stage';

describe('Capability Stages', () => {
  const mockNow = new Date('2024-10-01T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCapabilityStage', () => {
    it('returns Crawling for new accounts with 0 standing', () => {
      const createdAt = new Date('2024-10-01T10:00:00Z'); // 2 hours old
      expect(getCapabilityStage(createdAt, 0)).toBe('Crawling');
    });

    it('returns Crawling if standing is met but age is not', () => {
      // Standing is 5 (Running level), but account is 0 days old
      const createdAt = new Date('2024-10-01T10:00:00Z');
      expect(getCapabilityStage(createdAt, 5)).toBe('Crawling');
    });

    it('returns Crawling if age is met but standing is not', () => {
      // Account is 7 days old (Running level), but standing is 0
      const createdAt = new Date('2024-09-24T12:00:00Z');
      expect(getCapabilityStage(createdAt, 0)).toBe('Crawling');
    });

    it('returns Walking when minAge=1 and minStanding=1 are met', () => {
      // Exactly 1 day old
      const createdAt = new Date('2024-09-30T12:00:00Z');
      expect(getCapabilityStage(createdAt, 1)).toBe('Walking');
    });

    it('returns Running when minAge=7 and minStanding=5 are met', () => {
      // Exactly 7 days old
      const createdAt = new Date('2024-09-24T12:00:00Z');
      expect(getCapabilityStage(createdAt, 5)).toBe('Running');
    });

    it('returns Driving when minAge=30 and minStanding=20 are met', () => {
      // Exactly 30 days old
      const createdAt = new Date('2024-09-01T12:00:00Z');
      expect(getCapabilityStage(createdAt, 20)).toBe('Driving');
    });

    it('evaluates highest possible stage', () => {
      // 40 days old, standing 30 (Exceeds Driving)
      const createdAt = new Date('2024-08-20T12:00:00Z');
      expect(getCapabilityStage(createdAt, 30)).toBe('Driving');
    });

    it('works with string date inputs', () => {
      expect(getCapabilityStage('2024-09-24T12:00:00Z', 5)).toBe('Running');
    });

    it('accepts custom now parameter', () => {
      const createdAt = '2024-01-01T12:00:00Z';
      const customNow = new Date('2024-01-02T12:00:00Z'); // 1 day difference
      expect(getCapabilityStage(createdAt, 1, customNow)).toBe('Walking');
    });
  });

  describe('canPerformAction', () => {
    const crawlingDate = new Date('2024-10-01T10:00:00Z'); // Crawling (0 days)
    const walkingDate = new Date('2024-09-30T12:00:00Z');  // Walking (1 day)
    const runningDate = new Date('2024-09-24T12:00:00Z');  // Running (7 days)
    const drivingDate = new Date('2024-09-01T12:00:00Z');  // Driving (30 days)

    it('allows post for all stages', () => {
      expect(canPerformAction('post', crawlingDate, 0)).toBe(true);
      expect(canPerformAction('post', walkingDate, 1)).toBe(true);
      expect(canPerformAction('post', runningDate, 5)).toBe(true);
      expect(canPerformAction('post', drivingDate, 20)).toBe(true);
    });

    it('restricts vote to Walking and above', () => {
      expect(canPerformAction('vote', crawlingDate, 0)).toBe(false);
      expect(canPerformAction('vote', walkingDate, 1)).toBe(true);
      expect(canPerformAction('vote', runningDate, 5)).toBe(true);
      expect(canPerformAction('vote', drivingDate, 20)).toBe(true);
    });

    it('restricts propose to Running and above', () => {
      expect(canPerformAction('propose', crawlingDate, 0)).toBe(false);
      expect(canPerformAction('propose', walkingDate, 1)).toBe(false);
      expect(canPerformAction('propose', runningDate, 5)).toBe(true);
      expect(canPerformAction('propose', drivingDate, 20)).toBe(true);
    });

    it('restricts moderate to Driving and above', () => {
      expect(canPerformAction('moderate', crawlingDate, 0)).toBe(false);
      expect(canPerformAction('moderate', walkingDate, 1)).toBe(false);
      expect(canPerformAction('moderate', runningDate, 5)).toBe(false);
      expect(canPerformAction('moderate', drivingDate, 20)).toBe(true);
    });
  });
});
