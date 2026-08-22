'use client';

import { useEffect, useRef, useState } from 'react';

// MapLibre types
interface MapPin {
  id: string;
  lat: number;
  lng: number;
  type: string;
  label?: string;
  color?: string;
}

interface MapViewProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  pins?: MapPin[];
  showUserLocation?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

/**
 * Interactive map component using MapLibre GL JS.
 * Uses free OpenStreetMap tiles (no API key required).
 */
export function MapView({
  center = [-81.6557, 30.3322], // Jacksonville, FL
  zoom = 12,
  pins = [],
  showUserLocation = true,
  onMapClick,
  className = 'w-full aspect-[4/3] rounded-xl overflow-hidden',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    // Dynamic import to avoid SSR issues
    import('maplibre-gl').then((maplibregl) => {
      if (cancelled || !mapContainer.current) return;

      // Import CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);

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
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center,
        zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      // User location
      if (showUserLocation) {
        map.addControl(
          new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
          }),
          'top-right'
        );
      }

      // Map click handler
      if (onMapClick) {
        map.on('click', (e: any) => {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        });
      }

      // Add pins when map loads
      map.on('load', () => {
        setLoaded(true);
        addPins(map, maplibregl, pins);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update pins when they change
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    import('maplibre-gl').then((maplibregl) => {
      // Remove existing markers
      const existing = mapContainer.current?.querySelectorAll('.maplibregl-marker');
      existing?.forEach(el => el.remove());
      addPins(mapRef.current, maplibregl, pins);
    });
  }, [pins, loaded]);

  return <div ref={mapContainer} className={className} />;
}

function addPins(map: any, maplibregl: any, pins: MapPin[]) {
  for (const pin of pins) {
    const el = document.createElement('div');
    el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs cursor-pointer';
    el.style.backgroundColor = pin.color || '#ef4444';
    el.title = pin.label || pin.type;
    el.textContent = getTypeEmoji(pin.type);

    new maplibregl.Marker({ element: el })
      .setLngLat([pin.lng, pin.lat])
      .addTo(map);
  }
}

function getTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    hazard: '⚠', police: '🚔', construction: '🚧', flood: '🌊',
    accident: '💥', closure: '🚫', speed_trap: '📸', user: '📍',
  };
  return map[type] || '📍';
}
