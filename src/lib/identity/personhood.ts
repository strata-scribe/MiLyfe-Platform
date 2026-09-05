/**
 * MiLyfe Personhood Module
 *
 * Implements privacy-preserving uniqueness verification using web-of-trust
 * peer attestations without collecting government IDs.
 */

// --- Types ---

export interface PeerAttestation {
  id: string;
  attestorId: string;
  subjectId: string;
  timestamp: Date;
}

export interface PersonhoodStatus {
  verified: boolean;
  uniqueAttestors: number;
  threshold: number;
}

// --- Safety Invariants (Errors) ---

export class PersonhoodInvariantError extends Error {
  constructor(message: string) {
    super(`Personhood Invariant Violation: ${message}`);
    this.name = 'PersonhoodInvariantError';
  }
}

// --- Logic ---

export class PersonhoodService {
  /**
   * Verifies personhood based on peer attestations and a required threshold.
   *
   * Safety Invariants:
   * - Threshold must be greater than 0.
   * - Self-attestations are strictly ignored.
   * - Multiple attestations from the same attestor count only once towards the threshold.
   */
  static verifyPersonhood(
    subjectId: string,
    attestations: PeerAttestation[],
    threshold: number
  ): PersonhoodStatus {
    if (threshold <= 0) {
      throw new PersonhoodInvariantError('Threshold must be greater than zero.');
    }

    const uniqueAttestorIds = new Set<string>();

    for (const attestation of attestations) {
      // Must be an attestation for this specific subject
      if (attestation.subjectId !== subjectId) {
        continue;
      }

      // Ignore self-attestations
      if (attestation.attestorId === subjectId) {
        continue;
      }

      uniqueAttestorIds.add(attestation.attestorId);
    }

    const uniqueCount = uniqueAttestorIds.size;

    return {
      verified: uniqueCount >= threshold,
      uniqueAttestors: uniqueCount,
      threshold,
    };
  }
}
