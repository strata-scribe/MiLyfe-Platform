import { describe, it, expect } from 'vitest';
import { PersonhoodService, PeerAttestation, PersonhoodInvariantError } from './personhood';

describe('PersonhoodService', () => {
  const subjectId = 'user_abc';
  const now = new Date();

  const createAttestation = (id: string, attestorId: string, subjId: string = subjectId): PeerAttestation => ({
    id,
    attestorId,
    subjectId: subjId,
    timestamp: now,
  });

  describe('verifyPersonhood', () => {
    it('returns verified: true when unique attestors meet the threshold', () => {
      const attestations = [
        createAttestation('1', 'user_1'),
        createAttestation('2', 'user_2'),
        createAttestation('3', 'user_3'),
      ];

      const result = PersonhoodService.verifyPersonhood(subjectId, attestations, 3);
      expect(result.verified).toBe(true);
      expect(result.uniqueAttestors).toBe(3);
    });

    it('returns verified: false when unique attestors are below the threshold', () => {
      const attestations = [
        createAttestation('1', 'user_1'),
        createAttestation('2', 'user_2'),
      ];

      const result = PersonhoodService.verifyPersonhood(subjectId, attestations, 3);
      expect(result.verified).toBe(false);
      expect(result.uniqueAttestors).toBe(2);
    });

    it('ignores self-attestations', () => {
      const attestations = [
        createAttestation('1', 'user_1'),
        createAttestation('2', subjectId), // Self-attestation
        createAttestation('3', 'user_2'),
      ];

      const result = PersonhoodService.verifyPersonhood(subjectId, attestations, 2);
      expect(result.verified).toBe(true);
      expect(result.uniqueAttestors).toBe(2);

      const resultHigherThreshold = PersonhoodService.verifyPersonhood(subjectId, attestations, 3);
      expect(resultHigherThreshold.verified).toBe(false);
    });

    it('counts multiple attestations from the same attestor only once', () => {
      const attestations = [
        createAttestation('1', 'user_1'),
        createAttestation('2', 'user_1'), // Duplicate attestor
        createAttestation('3', 'user_2'),
        createAttestation('4', 'user_2'), // Duplicate attestor
      ];

      const result = PersonhoodService.verifyPersonhood(subjectId, attestations, 2);
      expect(result.verified).toBe(true);
      expect(result.uniqueAttestors).toBe(2);

      const resultHigherThreshold = PersonhoodService.verifyPersonhood(subjectId, attestations, 3);
      expect(resultHigherThreshold.verified).toBe(false);
    });

    it('ignores attestations meant for a different subject', () => {
        const attestations = [
            createAttestation('1', 'user_1', subjectId),
            createAttestation('2', 'user_2', 'user_xyz'), // Different subject
        ];

        const result = PersonhoodService.verifyPersonhood(subjectId, attestations, 2);
        expect(result.verified).toBe(false);
        expect(result.uniqueAttestors).toBe(1);
    });

    it('throws PersonhoodInvariantError if threshold is 0', () => {
      expect(() => {
        PersonhoodService.verifyPersonhood(subjectId, [], 0);
      }).toThrow(PersonhoodInvariantError);
      expect(() => {
        PersonhoodService.verifyPersonhood(subjectId, [], 0);
      }).toThrow('Threshold must be greater than zero.');
    });

    it('throws PersonhoodInvariantError if threshold is negative', () => {
      expect(() => {
        PersonhoodService.verifyPersonhood(subjectId, [], -1);
      }).toThrow(PersonhoodInvariantError);
    });
  });
});
