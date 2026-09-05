export interface Location {
  latitude: number;
  longitude: number;
}

export type ListingType = 'request' | 'offer';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MutualAidListing {
  id: string;
  type: ListingType;
  location: Location;
  skillCategory: string;
  urgency: UrgencyLevel;
  radiusKm: number; // Maximum distance they are willing to travel or receive help from
  createdAt: Date;
}

export interface MatchScore {
  listingId: string;
  score: number;
  distanceKm: number;
}

// Convert degrees to radians
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 */
export function calculateDistanceKm(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  const lat1 = toRad(loc1.latitude);
  const lat2 = toRad(loc2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

const URGENCY_WEIGHTS: Record<UrgencyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 5,
};

/**
 * Finds matching listings for a given target listing from a pool of candidates.
 */
export function findMatches(
  target: MutualAidListing,
  candidates: MutualAidListing[]
): MatchScore[] {
  const matches: MatchScore[] = [];

  for (const candidate of candidates) {
    // 1. Must be opposite types (request vs offer)
    if (target.type === candidate.type) {
      continue;
    }

    // 2. Must be same skill category
    if (target.skillCategory !== candidate.skillCategory) {
      continue;
    }

    // 3. Must be within both parties' radius
    const distanceKm = calculateDistanceKm(target.location, candidate.location);
    if (distanceKm > target.radiusKm || distanceKm > candidate.radiusKm) {
      continue;
    }

    // Calculate score
    // Higher score is better.
    // Factor 1: Proximity (closer is better). Let's say max possible distance is roughly the radius.
    // Normalized distance score: 1 - (distance / max_allowed_distance).
    // If distance is 0, score is 1. If distance == radius, score is 0.
    const maxAllowedDistance = Math.min(target.radiusKm, candidate.radiusKm);

    // Avoid division by zero if maxAllowedDistance is 0
    let distanceScore = 1;
    if (maxAllowedDistance > 0) {
      distanceScore = 1 - (distanceKm / maxAllowedDistance);
      // Ensure distance score doesn't go negative (due to floating point inaccuracies)
      distanceScore = Math.max(0, distanceScore);
    }

    // Factor 2: Urgency. Weight the score heavily by the urgency of the request.
    // If target is request, candidate urgency doesn't matter as much, but let's use the request's urgency.
    // If target is offer, candidate is request, use candidate's urgency.
    const relevantUrgency = target.type === 'request' ? target.urgency : candidate.urgency;
    const urgencyScore = URGENCY_WEIGHTS[relevantUrgency];

    // Total score = base urgency weight * (1 + distance score)
    // This ensures that for same urgency, closer is ranked higher.
    const score = urgencyScore * (1 + distanceScore);

    matches.push({
      listingId: candidate.id,
      score,
      distanceKm,
    });
  }

  // Rank by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}
