'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import type { MapPin } from '@/components/ui/city-map';

// Lazy load map (Leaflet doesn't work with SSR)
const CityMap = lazy(() =>
  import('@/components/ui/city-map').then((mod) => ({ default: mod.CityMap }))
);

type MapFilter = 'all' | 'issues' | 'events' | 'resources' | 'aid';

export default function MapPage() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [filter, setFilter] = useState<MapFilter>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const loadMapData = async () => {
      const allPins: MapPin[] = [];

      // Load issues with location
      const { data: issues } = await supabase
        .from('city_issues')
        .select('id, title, category, status, location_lat, location_lng, address')
        .not('location_lat', 'is', null);

      if (issues) {
        issues.forEach((issue) => {
          if (issue.location_lat && issue.location_lng) {
            allPins.push({
              id: `issue-${issue.id}`,
              lat: issue.location_lat,
              lng: issue.location_lng,
              type: 'issue',
              title: issue.title,
              description: issue.address || issue.category,
              status: issue.status,
              link: '/city',
            });
          }
        });
      }

      // Load events with approximate location (Jacksonville area scatter for demo)
      const { data: events } = await supabase
        .from('city_events')
        .select('id, title, location, event_date')
        .gte('event_date', new Date().toISOString());

      if (events) {
        events.forEach((event, i) => {
          // Scatter around Jacksonville for events without exact coords
          allPins.push({
            id: `event-${event.id}`,
            lat: 30.3322 + (Math.random() - 0.5) * 0.05,
            lng: -81.6557 + (Math.random() - 0.5) * 0.05,
            type: 'event',
            title: event.title,
            description: event.location || new Date(event.event_date).toLocaleDateString(),
            link: '/city',
          });
        });
      }

      // Community resources (seeded data for Jacksonville)
      const resources: MapPin[] = [
        { id: 'res-1', lat: 30.3350, lng: -81.6600, type: 'resource', title: 'Sulzbacher Center', description: 'Emergency shelter & services' },
        { id: 'res-2', lat: 30.3180, lng: -81.6650, type: 'resource', title: 'Feeding Northeast Florida', description: 'Food bank — open M-F 9am-4pm' },
        { id: 'res-3', lat: 30.3400, lng: -81.6500, type: 'resource', title: 'Jacksonville Legal Aid', description: 'Free legal help — call 904-356-8371' },
        { id: 'res-4', lat: 30.3250, lng: -81.6400, type: 'resource', title: 'Clara White Mission', description: 'Meals, job training, housing' },
        { id: 'res-5', lat: 30.3500, lng: -81.6700, type: 'resource', title: 'Gateway Community Services', description: 'Addiction recovery & mental health' },
        { id: 'res-6', lat: 30.3100, lng: -81.6550, type: 'resource', title: 'Agape Community Health Center', description: 'Low-cost healthcare, no insurance needed' },
        { id: 'res-7', lat: 30.3450, lng: -81.6350, type: 'resource', title: 'Habitat for Humanity ReStore', description: 'Affordable building materials' },
        { id: 'res-8', lat: 30.3280, lng: -81.6750, type: 'resource', title: 'JASMYN', description: 'LGBTQ+ youth services & support' },
      ];

      allPins.push(...resources);

      setPins(allPins);
      setLoading(false);
    };

    loadMapData();
  }, [supabase]);

  const filteredPins = filter === 'all'
    ? pins
    : pins.filter((p) => p.type === filter.replace(/s$/, '') as MapPin['type']);

  const filterCounts = {
    all: pins.length,
    issues: pins.filter((p) => p.type === 'issue').length,
    events: pins.filter((p) => p.type === 'event').length,
    resources: pins.filter((p) => p.type === 'resource').length,
    aid: pins.filter((p) => p.type === 'aid').length,
  };

  return (
    <div className="space-y-3 animate-slide-up -mx-4 -my-4">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Community Map</h1>
        <p className="text-xs text-gray-500 mt-0.5">Issues, events, and resources near you.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {([
          { key: 'all', label: 'All', icon: '🗺️' },
          { key: 'issues', label: 'Issues', icon: '🏛️' },
          { key: 'events', label: 'Events', icon: '📅' },
          { key: 'resources', label: 'Resources', icon: '⭐' },
          { key: 'aid', label: 'Mutual Aid', icon: '🤝' },
        ] as { key: MapFilter; label: string; icon: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              filter === f.key
                ? 'bg-harbor-800 text-white dark:bg-teal-500'
                : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            <span className="text-[10px] opacity-70">({filterCounts[f.key]})</span>
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-14rem)] px-4">
        {loading ? (
          <div className="w-full h-full skeleton rounded-xl" />
        ) : (
          <Suspense fallback={<div className="w-full h-full skeleton rounded-xl" />}>
            <CityMap
              pins={filteredPins}
              onPinClick={(pin) => setSelectedPin(pin)}
            />
          </Suspense>
        )}
      </div>

      {/* Selected Pin Detail */}
      {selectedPin && (
        <div className="fixed bottom-20 left-4 right-4 z-50 card shadow-2xl animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {selectedPin.type === 'issue' ? '🏛️' : selectedPin.type === 'event' ? '📅' : selectedPin.type === 'resource' ? '⭐' : '🤝'}
                </span>
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{selectedPin.title}</h3>
              </div>
              {selectedPin.description && (
                <p className="text-xs text-gray-500 mt-1">{selectedPin.description}</p>
              )}
              {selectedPin.status && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                  {selectedPin.status}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
