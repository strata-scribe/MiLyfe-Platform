'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Street Map — Renders resources, quests, and surplus on a MapLibre map.
 * Uses MapLibre GL JS (already installed, no tile server needed for basic display).
 */

interface MapPin {
  id: string;
  lat: number;
  lon: number;
  type: 'resource' | 'quest' | 'surplus' | 'listing';
  title: string;
  subtitle: string;
}

interface StreetMapProps {
  pins: MapPin[];
  center?: { lat: number; lon: number };
}

const TYPE_COLORS: Record<string, string> = {
  resource: '#2563eb',
  quest: '#f59e0b',
  surplus: '#10b981',
  listing: '#8b5cf6',
};

const TYPE_ICONS: Record<string, string> = {
  resource: '📍',
  quest: '⚡',
  surplus: '🎁',
  listing: '🛒',
};

export function StreetMap({ pins, center }: StreetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    async function initMap() {
      try {
        const maplibregl = (await import('maplibre-gl')).default;
        // @ts-ignore — CSS import handled by bundler
        await import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});

        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors',
              },
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
          },
          center: [center?.lon || -81.6557, center?.lat || 30.3322], // Jacksonville default
          zoom: 12,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
          setMapLoaded(true);

          // Add pins as markers
          for (const pin of pins) {
            const el = document.createElement('div');
            el.className = 'map-marker';
            el.style.cssText = `
              width: 30px; height: 30px; border-radius: 50%;
              background: ${TYPE_COLORS[pin.type] || '#666'};
              display: flex; align-items: center; justify-content: center;
              font-size: 14px; cursor: pointer; border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;
            el.textContent = TYPE_ICONS[pin.type] || '📍';

            const popup = new maplibregl.Popup({ offset: 20 }).setHTML(`
              <div style="padding: 4px 8px; min-width: 120px;">
                <strong style="font-size: 13px;">${pin.title}</strong>
                <p style="font-size: 11px; color: #666; margin-top: 2px;">${pin.subtitle}</p>
              </div>
            `);

            new maplibregl.Marker({ element: el })
              .setLngLat([pin.lon, pin.lat])
              .setPopup(popup)
              .addTo(map);
          }
        });

        mapRef.current = map;
      } catch (err) {
        setError('Map failed to load');
        console.error('MapLibre error:', err);
      }
    }

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [pins, center]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border overflow-hidden">
      <div ref={mapContainer} className="h-80 w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}
      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-2 rounded-md bg-background/90 px-2 py-1 text-xs">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" />Resources</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Quests</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Surplus</span>
      </div>
    </div>
  );
}
