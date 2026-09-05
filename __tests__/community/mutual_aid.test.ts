import { describe, it, expect } from 'vitest';
import {
  calculateDistanceKm,
  findMatches,
  MutualAidListing,
} from '../../src/lib/community/mutual_aid';

describe('Mutual Aid Logic', () => {
  describe('calculateDistanceKm', () => {
    it('should correctly calculate distance between two points (NYC to SF)', () => {
      // Rough coords for NYC and SF
      const nyc = { latitude: 40.7128, longitude: -74.006 };
      const sf = { latitude: 37.7749, longitude: -122.4194 };

      const distance = calculateDistanceKm(nyc, sf);
      // Rough distance is around 4129 km
      expect(distance).toBeGreaterThan(4000);
      expect(distance).toBeLessThan(4300);
    });

    it('should return 0 for same location', () => {
      const loc = { latitude: 40.7128, longitude: -74.006 };
      const distance = calculateDistanceKm(loc, loc);
      expect(distance).toBeCloseTo(0);
    });
  });

  describe('findMatches', () => {
    const baseListing: Omit<MutualAidListing, 'id' | 'type' | 'location' | 'skillCategory' | 'urgency' | 'radiusKm'> = {
      createdAt: new Date(),
    };

    const targetRequest: MutualAidListing = {
      ...baseListing,
      id: 'req1',
      type: 'request',
      location: { latitude: 40.7128, longitude: -74.006 }, // NYC
      skillCategory: 'plumbing',
      urgency: 'high',
      radiusKm: 50,
    };

    it('should filter out same type (request to request)', () => {
      const candidates: MutualAidListing[] = [
        {
          ...baseListing,
          id: 'req2',
          type: 'request',
          location: { latitude: 40.7128, longitude: -74.006 },
          skillCategory: 'plumbing',
          urgency: 'high',
          radiusKm: 50,
        },
      ];

      const matches = findMatches(targetRequest, candidates);
      expect(matches).toHaveLength(0);
    });

    it('should filter out mismatched skill categories', () => {
      const candidates: MutualAidListing[] = [
        {
          ...baseListing,
          id: 'off1',
          type: 'offer',
          location: { latitude: 40.7128, longitude: -74.006 },
          skillCategory: 'electrical', // mismatched
          urgency: 'low',
          radiusKm: 50,
        },
      ];

      const matches = findMatches(targetRequest, candidates);
      expect(matches).toHaveLength(0);
    });

    it('should filter out candidates outside mutually agreeable radius', () => {
      const candidates: MutualAidListing[] = [
        {
          ...baseListing,
          id: 'off1',
          type: 'offer',
          location: { latitude: 37.7749, longitude: -122.4194 }, // SF (far away)
          skillCategory: 'plumbing',
          urgency: 'low',
          radiusKm: 50,
        },
      ];

      const matches = findMatches(targetRequest, candidates);
      expect(matches).toHaveLength(0); // SF is > 50km away
    });

    it('should rank matches based on urgency and proximity', () => {
      const candidates: MutualAidListing[] = [
        {
          ...baseListing,
          id: 'off-far',
          type: 'offer',
          location: { latitude: 40.730610, longitude: -73.935242 }, // Queens (approx 8km)
          skillCategory: 'plumbing',
          urgency: 'low',
          radiusKm: 50,
        },
        {
          ...baseListing,
          id: 'off-close',
          type: 'offer',
          location: { latitude: 40.7130, longitude: -74.006 }, // Very close in Manhattan (<1km)
          skillCategory: 'plumbing',
          urgency: 'low',
          radiusKm: 50,
        },
      ];

      // Since target is a request, both offers will be scored using the request's urgency (high),
      // but 'off-close' is closer so it should have a higher score.
      const matches = findMatches(targetRequest, candidates);
      expect(matches).toHaveLength(2);
      expect(matches[0].listingId).toBe('off-close');
      expect(matches[1].listingId).toBe('off-far');
      expect(matches[0].score).toBeGreaterThan(matches[1].score);
    });

    it('should prioritize higher urgency over proximity when comparing different requests as an offer', () => {
      const targetOffer: MutualAidListing = {
        ...baseListing,
        id: 'off1',
        type: 'offer',
        location: { latitude: 40.7128, longitude: -74.006 }, // NYC
        skillCategory: 'medical',
        urgency: 'low',
        radiusKm: 50,
      };

      const candidates: MutualAidListing[] = [
        {
          ...baseListing,
          id: 'req-close-low-urgency',
          type: 'request',
          location: { latitude: 40.7130, longitude: -74.006 }, // Very close
          skillCategory: 'medical',
          urgency: 'low',
          radiusKm: 50,
        },
        {
          ...baseListing,
          id: 'req-far-critical-urgency',
          type: 'request',
          location: { latitude: 40.730610, longitude: -73.935242 }, // Farther
          skillCategory: 'medical',
          urgency: 'critical',
          radiusKm: 50,
        },
      ];

      const matches = findMatches(targetOffer, candidates);
      expect(matches).toHaveLength(2);
      // 'req-far-critical-urgency' has base score 5. Even with distance penalty,
      // it should outrank 'req-close-low-urgency' which has base score 1 (max 2).
      // Critical (5) * (1 + distance_score) will be > 1 * (1 + distance_score)
      expect(matches[0].listingId).toBe('req-far-critical-urgency');
      expect(matches[1].listingId).toBe('req-close-low-urgency');
    });
  });
});
