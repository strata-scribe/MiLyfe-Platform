import { offlineDB, type OutboxItem } from './db';

/**
 * Outbox Pattern — Queue actions when offline, replay when online
 *
 * Any state-changing action (thank, vote, quest claim, etc.) goes through
 * the outbox when the device is offline. When connectivity returns, the
 * sync engine replays pending items in order.
 */

/**
 * Add an action to the outbox for later sync.
 */
export async function enqueueAction(
  actionType: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const id = await offlineDB.outbox.add({
    action_type: actionType,
    payload,
    created_at: Date.now(),
    retries: 0,
    last_error: null,
    status: 'pending',
  });
  return id as number;
}

/**
 * Get all pending outbox items (ordered by creation time).
 */
export async function getPendingActions(): Promise<OutboxItem[]> {
  return offlineDB.outbox
    .where('status')
    .equals('pending')
    .sortBy('created_at');
}

/**
 * Get count of pending actions (shown in UI as sync badge).
 */
export async function getPendingCount(): Promise<number> {
  return offlineDB.outbox
    .where('status')
    .anyOf(['pending', 'sending'])
    .count();
}

/**
 * Mark an outbox item as sending (in-progress).
 */
export async function markSending(id: number): Promise<void> {
  await offlineDB.outbox.update(id, { status: 'sending' });
}

/**
 * Remove a successfully synced item from the outbox.
 */
export async function markSynced(id: number): Promise<void> {
  await offlineDB.outbox.delete(id);
}

/**
 * Mark an item as failed (will retry later).
 */
export async function markFailed(id: number, error: string): Promise<void> {
  const item = await offlineDB.outbox.get(id);
  if (item) {
    await offlineDB.outbox.update(id, {
      status: 'failed',
      retries: item.retries + 1,
      last_error: error,
    });
  }
}

/**
 * Reset failed items back to pending (for retry).
 * Only retries items with < 5 attempts.
 */
export async function retryFailedActions(): Promise<number> {
  const failed = await offlineDB.outbox
    .where('status')
    .equals('failed')
    .filter((item) => item.retries < 5)
    .toArray();

  for (const item of failed) {
    if (item.id !== undefined) {
      await offlineDB.outbox.update(item.id, { status: 'pending' });
    }
  }

  return failed.length;
}

/**
 * Clear all completed/synced items (cleanup).
 */
export async function clearOutbox(): Promise<void> {
  await offlineDB.outbox.clear();
}
