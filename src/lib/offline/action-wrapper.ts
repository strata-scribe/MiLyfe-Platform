/**
 * Offline-Aware Action Wrapper
 *
 * Wraps any server action call so that:
 * - If online: calls the server action normally
 * - If offline: queues to the Dexie outbox for later sync
 *
 * This is the bridge between the component layer and the offline system.
 */

import { enqueueAction, getPendingCount } from './outbox';

type ActionResult = { success?: boolean; error?: string; [key: string]: any };

/**
 * Execute a server action with offline fallback.
 *
 * @param actionType - The action type for outbox routing (e.g. 'pocket.thank')
 * @param payload - The payload to send to the server action
 * @param serverAction - The actual server action function to call
 * @returns The server action result, or a synthetic success if queued offline
 */
export async function executeWithOfflineFallback<T extends ActionResult>(
  actionType: string,
  payload: Record<string, unknown>,
  serverAction: () => Promise<T>,
): Promise<T & { queued_offline?: boolean }> {
  // If online, try the server action directly
  if (navigator.onLine) {
    try {
      const result = await serverAction();
      return result;
    } catch (error) {
      // Network error despite navigator.onLine (flaky connection)
      // Fall through to offline queue
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error — queue for later
      } else {
        throw error; // Re-throw non-network errors
      }
    }
  }

  // Offline (or network error): queue to outbox
  await enqueueAction(actionType, payload);
  const count = await getPendingCount();

  return {
    success: true,
    queued_offline: true,
    pending_count: count,
    message: `Queued for sync (${count} pending). Will send when connected.`,
  } as unknown as T & { queued_offline?: boolean };
}

/**
 * Check if we should show offline UI hints.
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
