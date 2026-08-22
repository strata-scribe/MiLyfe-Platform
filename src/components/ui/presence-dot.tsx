'use client';

import { usePresence } from '@/lib/hooks/use-presence';

interface PresenceDotProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Visual indicator dot showing online/away/offline status for a user
 */
export function PresenceDot({ userId, size = 'sm', showLabel = false }: PresenceDotProps) {
  const { getUserStatus } = usePresence();
  const status = getUserStatus(userId);

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  const colorClasses = {
    online: 'bg-green-500',
    away: 'bg-amber-400',
    offline: 'bg-gray-300 dark:bg-gray-600',
  };

  const labels = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full flex-shrink-0 ${
          status === 'online' ? 'animate-pulse' : ''
        }`}
        aria-label={labels[status]}
        title={labels[status]}
      />
      {showLabel && (
        <span className={`text-xs ${
          status === 'online' ? 'text-green-600 dark:text-green-400' :
          status === 'away' ? 'text-amber-600 dark:text-amber-400' :
          'text-gray-400'
        }`}>
          {labels[status]}
        </span>
      )}
    </span>
  );
}

/**
 * Online count badge — shows how many users are currently online
 */
export function OnlineCountBadge() {
  const { onlineCount } = usePresence();

  if (onlineCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      {onlineCount} online
    </span>
  );
}
