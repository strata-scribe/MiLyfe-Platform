'use client';

import { offlineDB, type QueuedAction } from './db';
import { createClient } from '@/lib/supabase/client';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

/**
 * Add an action to the offline queue.
 * If online, attempts immediate execution. If offline or failed, queues for later.
 */
export async function queueAction(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>
): Promise<{ queued: boolean; executed: boolean }> {
  if (navigator.onLine) {
    try {
      await executeAction(action);
      return { queued: false, executed: true };
    } catch {
      // Failed while online — queue it
    }
  }

  await offlineDB.actions.add({
    ...action,
    createdAt: Date.now(),
    retries: 0,
  });

  return { queued: true, executed: false };
}

/**
 * Execute a single queued action against Supabase
 */
async function executeAction(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>
): Promise<void> {
  const supabase = createClient();

  const { endpoint, method, payload } = action;

  // Route to appropriate Supabase table/RPC based on endpoint pattern
  if (endpoint.startsWith('table:')) {
    const table = endpoint.replace('table:', '');
    if (method === 'POST') {
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw new Error(error.message);
    } else if (method === 'PUT' || method === 'PATCH') {
      const { id, ...rest } = payload as { id: string; [key: string]: unknown };
      const { error } = await supabase.from(table).update(rest).eq('id', id);
      if (error) throw new Error(error.message);
    } else if (method === 'DELETE') {
      const { id } = payload as { id: string };
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
  } else if (endpoint.startsWith('rpc:')) {
    const fnName = endpoint.replace('rpc:', '');
    const { error } = await supabase.rpc(fnName, payload);
    if (error) throw new Error(error.message);
  } else if (endpoint.startsWith('/api/')) {
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

/**
 * Process all queued actions. Called when coming back online.
 */
export async function syncQueue(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  const actions = await offlineDB.actions.orderBy('createdAt').toArray();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      await executeAction(action);
      await offlineDB.actions.delete(action.id!);
      synced++;
    } catch (err) {
      const newRetries = action.retries + 1;
      if (newRetries >= MAX_RETRIES) {
        // Give up after max retries — leave in queue for manual review
        await offlineDB.actions.update(action.id!, {
          retries: newRetries,
          lastError: err instanceof Error ? err.message : 'Unknown error',
        });
        failed++;
      } else {
        await offlineDB.actions.update(action.id!, {
          retries: newRetries,
          lastError: err instanceof Error ? err.message : 'Unknown error',
        });
        // Wait before next retry
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * newRetries));
        failed++;
      }
    }
  }

  const remaining = await offlineDB.actions.count();
  return { synced, failed, remaining };
}

/**
 * Get count of pending queued actions
 */
export async function getQueueCount(): Promise<number> {
  return offlineDB.actions.count();
}

/**
 * Clear all queued actions (e.g., on logout)
 */
export async function clearQueue(): Promise<void> {
  await offlineDB.actions.clear();
}
