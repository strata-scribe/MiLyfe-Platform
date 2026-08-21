'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons in Next.js
const issueIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏛️</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const eventIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#00C1AE;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📅</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const resourceIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#FFC107;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">⭐</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const aidIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#8b5cf6;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🤝</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  type: 'issue' | 'event' | 'resource' | 'aid';
  title: string;
  description?: string;
  status?: string;
  link?: string;
}

interface CityMapProps {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
  onPinClick?: (pin: MapPin) => void;
}

function getIcon(type: string) {
  switch (type) {
    case 'issue': return issueIcon;
    case 'event': return eventIcon;
    case 'resource': return resourceIcon;
    case 'aid': return aidIcon;
    default: return issueIcon;
  }
}

// Component to handle user location
function LocationFinder({ onLocation }: { onLocation: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 14);
          onLocation(latitude, longitude);
        },
        () => {
          // Default to Jacksonville
          map.setView([30.3322, -81.6557], 12);
        },
        { timeout: 5000 }
      );
    }
  }, [map, onLocation]);

  return null;
}

export function CityMap({ pins, center = [30.3322, -81.6557], zoom = 12, onPinClick }: CityMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-harbor-700">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationFinder onLocation={(lat, lng) => setUserLocation([lat, lng])} />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={new L.DivIcon({
              className: 'custom-marker',
              html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Data pins */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={getIcon(pin.type)}
            eventHandlers={{
              click: () => onPinClick?.(pin),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <p className="font-bold text-sm">{pin.title}</p>
                {pin.description && <p className="text-xs text-gray-500 mt-1">{pin.description}</p>}
                {pin.status && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block capitalize">
                    {pin.status}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
