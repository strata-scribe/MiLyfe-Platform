import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSourceRecord,
  addCorrection,
  verifySource,
  calculateStaleness,
} from '../source';

describe('Source Protocol', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createSourceRecord', () => {
    it('creates a new source record with initial provenance', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const record = createSourceRecord(
        'src-123',
        { text: 'Initial content' },
        'user-1',
        'official_feed',
        0.9
      );

      expect(record.id).toBe('src-123');
      expect(record.content).toEqual({ text: 'Initial content' });
      expect(record.provenance).toEqual({
        sourceId: 'src-123',
        maintainer: 'user-1',
        verificationMethod: 'official_feed',
        confidence: 0.9,
        firstAddedAt: now.toISOString(),
        lastVerifiedAt: now.toISOString(),
        expiresAt: null,
        history: [],
      });
    });
  });

  describe('addCorrection', () => {
    it('updates content and adds an audit trail record', () => {
      const initialTime = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(initialTime);

      let record = createSourceRecord(
        'src-123',
        { text: 'Initial content' },
        'user-1',
        'official_feed',
        0.9
      );

      const correctionTime = new Date('2024-01-02T00:00:00Z');
      vi.setSystemTime(correctionTime);

      record = addCorrection(
        record,
        { text: 'Corrected content' },
        'user-2',
        'Typo fix'
      );

      expect(record.content).toEqual({ text: 'Corrected content' });
      expect(record.provenance.history).toHaveLength(1);

      const audit = record.provenance.history[0];
      expect(audit.sourceId).toBe('src-123');
      expect(audit.originalValue).toEqual({ text: 'Initial content' });
      expect(audit.newValue).toEqual({ text: 'Corrected content' });
      expect(audit.correctedBy).toBe('user-2');
      expect(audit.reason).toBe('Typo fix');
      expect(audit.timestamp).toBe(correctionTime.toISOString());
    });
  });

  describe('verifySource', () => {
    it('updates verification method, confidence, and timestamp', () => {
      const initialTime = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(initialTime);

      let record = createSourceRecord(
        'src-123',
        { text: 'Content' },
        'user-1',
        'unverified',
        0.1
      );

      const verificationTime = new Date('2024-01-05T00:00:00Z');
      vi.setSystemTime(verificationTime);

      record = verifySource(record, 'human_visit', 0.95);

      expect(record.provenance.verificationMethod).toBe('human_visit');
      expect(record.provenance.confidence).toBe(0.95);
      expect(record.provenance.lastVerifiedAt).toBe(verificationTime.toISOString());
      expect(record.provenance.firstAddedAt).toBe(initialTime.toISOString());
    });
  });

  describe('calculateStaleness', () => {
    it('is stale if explicit expiresAt is in the past', () => {
      const initialTime = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(initialTime);

      const expiresAt = new Date('2024-01-10T00:00:00Z').toISOString();
      const record = createSourceRecord(
        'src-123',
        { text: 'Content' },
        'user-1',
        'official_feed',
        0.9,
        expiresAt
      );

      // Current time is before expiresAt
      vi.setSystemTime(new Date('2024-01-05T00:00:00Z'));
      expect(calculateStaleness(record)).toBe(false);

      // Current time is after expiresAt
      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));
      expect(calculateStaleness(record)).toBe(true);
    });

    it('is stale if default TTL is exceeded (no explicit expiresAt)', () => {
      const initialTime = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(initialTime);

      const record = createSourceRecord(
        'src-123',
        { text: 'Content' },
        'user-1',
        'official_feed',
        0.9
      );

      // 10 days default TTL
      const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

      // 5 days later
      vi.setSystemTime(new Date('2024-01-06T00:00:00Z'));
      expect(calculateStaleness(record, tenDaysMs)).toBe(false);

      // 15 days later
      vi.setSystemTime(new Date('2024-01-16T00:00:00Z'));
      expect(calculateStaleness(record, tenDaysMs)).toBe(true);
    });
  });
});
