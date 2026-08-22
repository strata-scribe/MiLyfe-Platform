'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncQueue, getQueueCount } from './queue';

interface OfflineState {
  isOnline: boolean;
  queueCount: number;
  isSyncing: boolean;
  lastSyncResult: { synced: number; failed: number; remaining: number } | null;
}

/**
 * Hook to monitor online/offline state and manage the action queue.
 * Automatically syncs queued actions when reconnecting.
 */
export function useOffline(): OfflineState & { manualSync: () => Promise<void> } {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    queueCount: 0,
    isSyncing: false,
    lastSyncResult: null,
  });

  const refreshCount = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setState((s) => ({ ...s, queueCount: count }));
    } catch {
      // DB not available
    }
  }, []);

  const doSync = useCallback(async () => {
    setState((s) => ({ ...s, isSyncing: true }));
    try {
      const result = await syncQueue();
      setState((s) => ({
        ...s,
        isSyncing: false,
        lastSyncResult: result,
        queueCount: result.remaining,
      }));
    } catch {
      setState((s) => ({ ...s, isSyncing: false }));
    }
  }, []);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setState((s) => ({ ...s, isOnline: true }));
      doSync();
    };

    const handleOffline = () => {
      setState((s) => ({ ...s, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic queue count refresh
    const interval = setInterval(refreshCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [doSync, refreshCount]);

  return { ...state, manualSync: doSync };
}
