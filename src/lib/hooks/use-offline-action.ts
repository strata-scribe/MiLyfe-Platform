'use client';

import { useTransition, useCallback, useState } from 'react';
import { enqueueAction, getPendingCount } from '@/lib/offline/outbox';

/**
 * Hook that wraps any server action with offline fallback.
 *
 * Usage:
 *   const { execute, isPending, error } = useOfflineAction('pocket.thank');
 *   await execute(payload, () => transferMLY(payload));
 *
 * If online: calls server action normally.
 * If offline: queues to Dexie outbox, returns synthetic success.
 */
export function useOfflineAction(actionType: string) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [queuedOffline, setQueuedOffline] = useState(false);

  const execute = useCallback(
    async <T extends { success?: boolean; error?: string }>(
      payload: Record<string, unknown>,
      serverAction: () => Promise<T>,
    ): Promise<T | { success: true; queued_offline: true }> => {
      setError(null);
      setQueuedOffline(false);

      // If online, try server action directly
      if (navigator.onLine) {
        return new Promise<T>((resolve) => {
          startTransition(async () => {
            try {
              const result = await serverAction();
              if (result.error) setError(result.error);
              resolve(result);
            } catch (err) {
              // Network error despite online — queue offline
              if (err instanceof TypeError) {
                await enqueueAction(actionType, payload);
                setQueuedOffline(true);
                resolve({ success: true, queued_offline: true } as any);
              } else {
                setError('Something went wrong');
                resolve({ error: 'Something went wrong' } as any);
              }
            }
          });
        });
      }

      // Offline: queue to outbox
      await enqueueAction(actionType, payload);
      setQueuedOffline(true);
      return { success: true, queued_offline: true };
    },
    [actionType],
  );

  return { execute, isPending, error, queuedOffline };
}
