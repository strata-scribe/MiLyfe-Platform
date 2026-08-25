'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, enqueueAction } from '@/lib/offline/outbox';
import { initSync, onSyncStatusChange, processOutbox } from '@/lib/offline/sync';

/**
 * Hook for offline awareness and action queuing.
 *
 * Returns:
 * - isOnline: current network status
 * - pendingCount: number of actions waiting to sync
 * - queueAction: function to add an action to the outbox
 * - syncNow: manually trigger sync
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize sync engine
    const cleanup = initSync();

    // Listen for sync status changes
    const unsubscribe = onSyncStatusChange(setSyncStatus);

    // Poll pending count
    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    }, 5000);

    // Initial count
    getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanup();
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const queueAction = useCallback(
    async (actionType: string, payload: Record<string, unknown>) => {
      await enqueueAction(actionType, payload);
      const count = await getPendingCount();
      setPendingCount(count);

      // Try to sync immediately if online
      if (navigator.onLine) {
        processOutbox().then(async () => {
          const newCount = await getPendingCount();
          setPendingCount(newCount);
        });
      }
    },
    [],
  );

  const syncNow = useCallback(async () => {
    if (navigator.onLine) {
      const result = await processOutbox();
      const count = await getPendingCount();
      setPendingCount(count);
      return result;
    }
    return { synced: 0, failed: 0 };
  }, []);

  return {
    isOnline,
    pendingCount,
    syncStatus,
    queueAction,
    syncNow,
  };
}
