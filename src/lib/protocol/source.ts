export type VerificationMethod =
  | 'human_visit'
  | 'phone_call'
  | 'web_scrape'
  | 'api_check'
  | 'community_report'
  | 'official_feed'
  | 'unverified';

export interface CorrectionAudit {
  id: string;
  sourceId: string;
  originalValue: any;
  newValue: any;
  correctedBy: string; // user id
  reason: string;
  timestamp: string; // ISO string
}

export interface Provenance {
  sourceId: string;
  maintainer: string; // organization or user id
  verificationMethod: VerificationMethod;
  confidence: number; // 0 to 1
  firstAddedAt: string; // ISO string
  lastVerifiedAt: string; // ISO string
  expiresAt: string | null; // ISO string, null if no explicit expiration
  history: CorrectionAudit[];
}

export interface SourceData {
  id: string;
  content: any;
  provenance: Provenance;
}

export function createSourceRecord(
  id: string,
  content: any,
  maintainer: string,
  verificationMethod: VerificationMethod,
  confidence: number,
  expiresAt: string | null = null
): SourceData {
  const now = new Date().toISOString();
  return {
    id,
    content,
    provenance: {
      sourceId: id,
      maintainer,
      verificationMethod,
      confidence,
      firstAddedAt: now,
      lastVerifiedAt: now,
      expiresAt,
      history: [],
    },
  };
}

export function addCorrection(
  source: SourceData,
  newValue: any,
  correctedBy: string,
  reason: string
): SourceData {
  const now = new Date().toISOString();
  const correction: CorrectionAudit = {
    id: `corr_${Math.random().toString(36).substr(2, 9)}`,
    sourceId: source.id,
    originalValue: source.content,
    newValue,
    correctedBy,
    reason,
    timestamp: now,
  };

  return {
    ...source,
    content: newValue,
    provenance: {
      ...source.provenance,
      history: [...source.provenance.history, correction],
    },
  };
}

export function verifySource(
  source: SourceData,
  verificationMethod: VerificationMethod,
  confidence: number,
  expiresAt: string | null = null
): SourceData {
  const now = new Date().toISOString();
  return {
    ...source,
    provenance: {
      ...source.provenance,
      verificationMethod,
      confidence,
      lastVerifiedAt: now,
      expiresAt: expiresAt || source.provenance.expiresAt,
    },
  };
}

/**
 * Calculates staleness of a source.
 * A source is considered stale if:
 * 1. It has an explicit expiresAt date that is in the past.
 * 2. It does not have an expiresAt date, but the lastVerifiedAt date is older than the default TTL (in ms).
 *
 * @param source The source data
 * @param defaultTtlMs Default time-to-live in milliseconds if expiresAt is not provided. Default is 30 days.
 * @returns true if stale, false otherwise
 */
export function calculateStaleness(
  source: SourceData,
  defaultTtlMs: number = 30 * 24 * 60 * 60 * 1000
): boolean {
  const now = new Date().getTime();

  if (source.provenance.expiresAt) {
    return now > new Date(source.provenance.expiresAt).getTime();
  }

  const lastVerified = new Date(source.provenance.lastVerifiedAt).getTime();
  return now - lastVerified > defaultTtlMs;
}
