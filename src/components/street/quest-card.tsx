'use client';

import { useState, useTransition } from 'react';
import { claimQuest } from '@/lib/actions/street';
import { executeWithOfflineFallback } from '@/lib/offline/action-wrapper';

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    reward_mly: number;
    difficulty: string;
    time_estimate_minutes: number | null;
    location_text: string | null;
    max_completions: number;
    current_completions: number;
    status: string;
    expires_at: string | null;
    created_at: string;
    creator_id?: string;
    profiles: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
  userId: string;
  onClaimed?: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const CATEGORY_ICONS: Record<string, string> = {
  community: '🏘️',
  cleanup: '🧹',
  repair: '🔧',
  delivery: '🚚',
  teaching: '📚',
  caregiving: '💜',
  verification: '✅',
  safety: '🛡️',
  gardening: '🌱',
  tech_support: '💻',
};

export function QuestCard({ quest, userId, onClaimed }: QuestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const spotsLeft = quest.max_completions - quest.current_completions;
  const isExpiringSoon =
    quest.expires_at &&
    new Date(quest.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const isOwnQuest = quest.creator_id === userId;

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await executeWithOfflineFallback(
        'quest.claim',
        { quest_id: quest.id },
        () => claimQuest(quest.id),
      );
      if (result.error) {
        setError(result.error);
      } else {
        setClaimed(true);
        onClaimed?.();
      }
    });
  }

  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
          {CATEGORY_ICONS[quest.category] || '⚡'}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title + reward */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium">{quest.title}</h3>
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700">
              +{quest.reward_mly} $MLY
            </span>
          </div>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {quest.description}
          </p>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[quest.difficulty]}`}>
              {quest.difficulty}
            </span>
            {quest.time_estimate_minutes && (
              <span className="text-xs text-muted-foreground">
                ~{quest.time_estimate_minutes}min
              </span>
            )}
            {quest.location_text && (
              <span className="text-xs text-muted-foreground">
                📍 {quest.location_text}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </span>
            {isExpiringSoon && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                Expires soon
              </span>
            )}
          </div>

          {/* Action row */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              By {quest.profiles.display_name || quest.profiles.username}
            </p>

            {!isOwnQuest && !claimed && spotsLeft > 0 && (
              <button
                onClick={handleClaim}
                disabled={isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {isPending ? 'Claiming...' : 'Accept Quest'}
              </button>
            )}
            {claimed && (
              <span className="rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                Claimed ✓
              </span>
            )}
            {isOwnQuest && (
              <span className="text-xs text-muted-foreground">Your quest</span>
            )}
          </div>

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
