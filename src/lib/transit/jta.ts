/**
 * JTA (Jacksonville Transportation Authority) Transit Data
 * 
 * Uses the Transitland API (free, no key needed for basic queries)
 * Onestop ID: f-djmu-jacksonvilletransportationauthority
 * 
 * Endpoints:
 * - Routes: https://transit.land/api/v2/rest/routes?operator_onestop_id=f-djmu-jacksonvilletransportationauthority
 * - Stops: https://transit.land/api/v2/rest/stops?operator_onestop_id=f-djmu-jacksonvilletransportationauthority
 */

const TRANSITLAND_BASE = 'https://transit.land/api/v2/rest';
const JTA_ONESTOP_ID = 'o-djmu-jacksonvilletransportationauthority';
const FEED_ONESTOP_ID = 'f-djmu-jacksonvilletransportationauthority';

export interface TransitRoute {
  id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number; // 3 = bus
  route_color: string;
  route_text_color: string;
}

export interface TransitStop {
  id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number;
  routes: string[];
}

/**
 * Fetch all JTA bus routes from Transitland
 */
export async function fetchJTARoutes(): Promise<TransitRoute[]> {
  try {
    const res = await fetch(
      `${TRANSITLAND_BASE}/routes?operator_onestop_id=${JTA_ONESTOP_ID}&limit=100`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!res.ok) {
      // Fallback to hardcoded JTA routes if API is down
      return JTA_FALLBACK_ROUTES;
    }

    const data = await res.json();
    return (data.routes || []).map((r: any) => ({
      id: r.id || r.onestop_id,
      route_short_name: r.route_short_name || '',
      route_long_name: r.route_long_name || '',
      route_type: r.route_type || 3,
      route_color: r.route_color || '1e3a6e',
      route_text_color: r.route_text_color || 'ffffff',
    }));
  } catch {
    return JTA_FALLBACK_ROUTES;
  }
}

/**
 * Fetch JTA stops near a location
 */
export async function fetchJTAStops(lat: number, lng: number, radiusMeters: number = 1000): Promise<TransitStop[]> {
  try {
    const res = await fetch(
      `${TRANSITLAND_BASE}/stops?operator_onestop_id=${JTA_ONESTOP_ID}&lat=${lat}&lon=${lng}&radius=${radiusMeters}&limit=20`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.stops || []).map((s: any) => ({
      id: s.id || s.onestop_id,
      stop_name: s.stop_name || 'Unknown Stop',
      stop_lat: s.geometry?.coordinates?.[1] || s.stop_lat || lat,
      stop_lon: s.geometry?.coordinates?.[0] || s.stop_lon || lng,
      wheelchair_boarding: s.wheelchair_boarding || 0,
      routes: (s.route_stops || []).map((rs: any) => rs.route?.route_short_name).filter(Boolean),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch all stops for a specific route
 */
export async function fetchRouteStops(routeId: string): Promise<TransitStop[]> {
  try {
    const res = await fetch(
      `${TRANSITLAND_BASE}/routes/${routeId}/stops?limit=100`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.stops || []).map((s: any) => ({
      id: s.id,
      stop_name: s.stop_name || '',
      stop_lat: s.geometry?.coordinates?.[1] || 0,
      stop_lon: s.geometry?.coordinates?.[0] || 0,
      wheelchair_boarding: s.wheelchair_boarding || 0,
      routes: [],
    }));
  } catch {
    return [];
  }
}

// Fallback routes when API is unavailable (JTA's main routes as of 2026)
const JTA_FALLBACK_ROUTES: TransitRoute[] = [
  { id: 'jta-1', route_short_name: '1', route_long_name: 'Kings Rd / Edgewood Ave', route_type: 3, route_color: '0072ce', route_text_color: 'ffffff' },
  { id: 'jta-2', route_short_name: '2', route_long_name: 'Main St / San Marco', route_type: 3, route_color: 'e31837', route_text_color: 'ffffff' },
  { id: 'jta-3', route_short_name: '3', route_long_name: 'Pearl / Moncrief', route_type: 3, route_color: '009b3a', route_text_color: 'ffffff' },
  { id: 'jta-4', route_short_name: '4', route_long_name: 'Plymouth / Hwy 1', route_type: 3, route_color: 'f7941d', route_text_color: '000000' },
  { id: 'jta-5', route_short_name: '5', route_long_name: 'Springfield / Brentwood', route_type: 3, route_color: '662d91', route_text_color: 'ffffff' },
  { id: 'jta-7', route_short_name: '7', route_long_name: 'N Main / Trout River', route_type: 3, route_color: '0072ce', route_text_color: 'ffffff' },
  { id: 'jta-8', route_short_name: '8', route_long_name: 'Arlington / Ft Caroline', route_type: 3, route_color: 'e31837', route_text_color: 'ffffff' },
  { id: 'jta-9', route_short_name: '9', route_long_name: 'Lem Turner / Broward', route_type: 3, route_color: '009b3a', route_text_color: 'ffffff' },
  { id: 'jta-10', route_short_name: '10', route_long_name: 'Beach Blvd', route_type: 3, route_color: 'f7941d', route_text_color: '000000' },
  { id: 'jta-11', route_short_name: '11', route_long_name: 'Atlantic / U of North FL', route_type: 3, route_color: '662d91', route_text_color: 'ffffff' },
  { id: 'jta-51', route_short_name: '51', route_long_name: 'Northside Express', route_type: 3, route_color: '1e3a6e', route_text_color: 'ffffff' },
  { id: 'jta-52', route_short_name: '52', route_long_name: 'Westside Express', route_type: 3, route_color: '1e3a6e', route_text_color: 'ffffff' },
];
