import { offlineDB } from './db';
import {
  getPendingActions,
  markSending,
  markSynced,
  markFailed,
  retryFailedActions,
} from './outbox';

/**
 * Sync Engine — Replays outbox when online, caches data for offline
 *
 * Runs automatically when:
 * 1. App detects connectivity restored (navigator.onLine event)
 * 2. App starts and has pending items
 * 3. Periodic background sync (if service worker supports it)
 */

type SyncStatus = 'idle' | 'syncing' | 'error';

let syncStatus: SyncStatus = 'idle';
let syncListeners: Array<(status: SyncStatus) => void> = [];

/**
 * Subscribe to sync status changes.
 */
export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter((cb) => cb !== callback);
  };
}

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  syncListeners.forEach((cb) => cb(status));
}

/**
 * Process the outbox — send all pending actions to the server.
 */
export async function processOutbox(): Promise<{ synced: number; failed: number }> {
  if (syncStatus === 'syncing') return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  setSyncStatus('syncing');
  let synced = 0;
  let failed = 0;

  try {
    // Retry previously failed items first
    await retryFailedActions();

    const pending = await getPendingActions();

    for (const item of pending) {
      if (!item.id) continue;

      try {
        await markSending(item.id);

        // Route to appropriate API based on action type
        const endpoint = getEndpointForAction(item.action_type);
        if (!endpoint) {
          await markFailed(item.id, `Unknown action type: ${item.action_type}`);
          failed++;
          continue;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          await markSynced(item.id);
          synced++;
        } else {
          const errorText = await response.text();
          await markFailed(item.id, `HTTP ${response.status}: ${errorText}`);
          failed++;
        }
      } catch (error) {
        if (item.id) {
          await markFailed(item.id, error instanceof Error ? error.message : 'Network error');
        }
        failed++;
      }
    }

    setSyncStatus('idle');
  } catch (error) {
    setSyncStatus('error');
  }

  return { synced, failed };
}

/**
 * Map action types to API endpoints.
 */
function getEndpointForAction(actionType: string): string | null {
  const routes: Record<string, string> = {
    'pocket.thank': '/api/wallet/transfer',
    'voice.ballot': '/api/governance/vote',
    'quest.claim': '/api/street/quest/claim',
    'quest.submit': '/api/street/quest/submit',
    'learn.progress': '/api/learn/progress',
    'safety.leave_now': '/api/safety/leave-now',
    'safety.timer_arrived': '/api/safety/timer/arrived',
    'message.send': '/api/messages/send',
    'listing.create': '/api/street/listing/create',
  };
  return routes[actionType] || null;
}

/**
 * Cache data from server for offline access.
 */
export async function cacheProfileData(profile: {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  neighborhood: string | null;
}): Promise<void> {
  await offlineDB.profiles.put({
    ...profile,
    cached_at: Date.now(),
  });
}

export async function cacheWalletData(wallet: {
  id: string;
  spending_balance: number;
  savings_balance: number;
  community_balance: number;
}): Promise<void> {
  await offlineDB.wallets.put({
    ...wallet,
    cached_at: Date.now(),
  });
}

export async function cacheResources(
  resources: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    address: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    confidence: number;
  }>,
): Promise<void> {
  const now = Date.now();
  await offlineDB.resources.bulkPut(
    resources.map((r) => ({ ...r, cached_at: now })),
  );
}

/**
 * Get cached data when offline.
 */
export async function getCachedProfile(userId: string) {
  return offlineDB.profiles.get(userId);
}

export async function getCachedWallet(userId: string) {
  return offlineDB.wallets.get(userId);
}

export async function getCachedResources(category?: string) {
  if (category) {
    return offlineDB.resources.where('category').equals(category).toArray();
  }
  return offlineDB.resources.toArray();
}

/**
 * Initialize sync — call on app mount.
 * Sets up online/offline event listeners.
 */
export function initSync(): () => void {
  const handleOnline = () => {
    processOutbox();
  };

  window.addEventListener('online', handleOnline);

  // Process any pending items on startup
  if (navigator.onLine) {
    processOutbox();
  }

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
