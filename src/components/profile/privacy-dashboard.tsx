'use client';

import { getPrivacySummary, type PrivacySummary } from '@/lib/mi-scope';
import { useEffect, useState } from 'react';

/**
 * Privacy Dashboard — "Right now, X people can see your location"
 * Shows live privacy status for each data category.
 */
export function PrivacyDashboard() {
  const [privacy, setPrivacy] = useState<PrivacySummary | null>(null);

  useEffect(() => {
    getPrivacySummary('current-user').then(setPrivacy);
  }, []);

  if (!privacy) return null;

  const items = [
    {
      label: 'Location',
      value: privacy.location_viewers,
      icon: '📍',
      description: privacy.location_viewers === 0
        ? 'No one can see your location'
        : `${privacy.location_viewers} people can see your location`,
      color: privacy.location_viewers === 0 ? 'text-green-600' : 'text-yellow-600',
    },
    {
      label: 'Wallet',
      value: privacy.pocket_viewers,
      icon: '💰',
      description: 'Only you can see your balance',
      color: 'text-green-600',
    },
    {
      label: 'Health',
      value: privacy.health_viewers,
      icon: '❤️',
      description: 'Only you can see health check-ins',
      color: 'text-green-600',
    },
    {
      label: 'Profile',
      value: null,
      icon: '👤',
      description: `Profile visibility: ${privacy.profile_visibility}`,
      color: privacy.profile_visibility === 'public' ? 'text-blue-600' : 'text-green-600',
    },
  ];

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <span>🔒</span> Privacy Right Now
      </h3>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
            <span className={`text-xs font-medium ${item.color}`}>
              {item.description}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        MiLyfe defaults to maximum privacy. You control what's shared.
      </p>
    </div>
  );
}
