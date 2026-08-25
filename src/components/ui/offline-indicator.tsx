'use client';

import { useState, useEffect } from 'react';
import { getPendingCount } from '@/lib/offline/outbox';
import { processOutbox } from '@/lib/offline/sync';

/**
 * Offline Indicator — shows real connectivity status and actual pending sync count from Dexie.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      setSyncing(true);
      processOutbox().then(() => {
        setSyncing(false);
        getPendingCount().then(setPendingCount);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll pending count every 5 seconds
    const interval = setInterval(() => {
      getPendingCount().then(setPendingCount);
    }, 5000);

    // Initial count
    getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't show anything when online and no pending items
  if (isOnline && pendingCount === 0 && !syncing) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 px-4 py-2 text-center text-sm font-medium ${
        !isOnline
          ? 'bg-yellow-500 text-yellow-950'
          : syncing
            ? 'bg-blue-500 text-white'
            : 'bg-orange-500 text-white'
      }`}
    >
      {!isOnline ? (
        <span>📴 You're offline — actions will sync when you reconnect ({pendingCount} queued)</span>
      ) : syncing ? (
        <span>🔄 Syncing {pendingCount} action{pendingCount !== 1 ? 's' : ''}...</span>
      ) : (
        <span>⏳ {pendingCount} action{pendingCount !== 1 ? 's' : ''} waiting to sync</span>
      )}
    </div>
  );
}
