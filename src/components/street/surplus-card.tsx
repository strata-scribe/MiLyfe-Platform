'use client';

import { useState, useTransition } from 'react';
import { claimSurplus } from '@/lib/actions/street';

interface SurplusCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    quantity: string;
    pickup_location: string;
    available_until: string;
    status: string;
    donor_id?: string;
    created_at: string;
    profiles: {
      username: string;
      display_name: string;
    };
  };
  userId?: string;
  onClaimed?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🥫',
  goods: '📦',
  clothing: '👕',
  furniture: '🪑',
  other: '🎁',
};

export function SurplusCard({ item, userId, onClaimed }: SurplusCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const expiresIn = getExpiresIn(item.available_until);
  const isUrgent = new Date(item.available_until).getTime() - Date.now() < 4 * 60 * 60 * 1000;
  const isOwnItem = item.donor_id === userId;

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimSurplus(item.id);
      if (result.error) {
        setError(result.error);
      } else {
        setClaimed(true);
        onClaimed?.();
      }
    });
  }

  return (
    <div className={`rounded-lg border p-3 ${isUrgent ? 'border-orange-300 bg-orange-50/50' : ''}`}>
      <div className="flex items-start gap-2">
        <span className="text-2xl">{CATEGORY_ICONS[item.category] || '🎁'}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{item.title}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>📍 {item.pickup_location}</span>
            <span>×{item.quantity}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              From {item.profiles.display_name || item.profiles.username}
            </span>
            <span className={`text-xs ${isUrgent ? 'font-medium text-orange-600' : 'text-muted-foreground'}`}>
              {expiresIn}
            </span>
          </div>

          {/* Claim button */}
          {!isOwnItem && !claimed && (
            <button
              onClick={handleClaim}
              disabled={isPending}
              className="mt-2 w-full rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isPending ? 'Claiming...' : 'Claim (I\'ll pick it up)'}
            </button>
          )}
          {claimed && (
            <div className="mt-2 rounded-md bg-green-100 px-3 py-2 text-xs text-green-700">
              ✓ Claimed! Pick up at: {item.pickup_location}
            </div>
          )}
          {isOwnItem && (
            <p className="mt-2 text-xs text-muted-foreground">Your item</p>
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function getExpiresIn(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}min left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}
