'use client';

import { useOffline } from '@/lib/hooks/use-offline';

/**
 * Offline Indicator — shows connectivity status and pending sync count.
 * Appears at the top of the screen when offline or when actions are queued.
 */
export function OfflineIndicator() {
  const { isOnline, pendingCount, syncStatus } = useOffline();

  // Don't show anything when online and no pending items
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 px-4 py-2 text-center text-sm font-medium ${
        !isOnline
          ? 'bg-yellow-500 text-yellow-950'
          : syncStatus === 'syncing'
            ? 'bg-blue-500 text-white'
            : 'bg-orange-500 text-white'
      }`}
    >
      {!isOnline ? (
        <span>📴 You're offline — actions will sync when you reconnect</span>
      ) : syncStatus === 'syncing' ? (
        <span>🔄 Syncing {pendingCount} action{pendingCount !== 1 ? 's' : ''}...</span>
      ) : (
        <span>⏳ {pendingCount} action{pendingCount !== 1 ? 's' : ''} waiting to sync</span>
      )}
    </div>
  );
}
