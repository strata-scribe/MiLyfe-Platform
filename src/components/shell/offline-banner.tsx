'use client';

import { useOffline } from '@/lib/offline';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { isOnline, queueCount, isSyncing } = useOffline();
  const { t } = useTranslation();

  if (isOnline && queueCount === 0) return null;

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-40 px-4 py-2 text-center text-sm font-medium transition-all ${
        !isOnline
          ? 'bg-amber-500 text-amber-950'
          : isSyncing
            ? 'bg-blue-500 text-white'
            : 'bg-green-500 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <span>
          ⚡ {t('offline.title')}
          {queueCount > 0 && ` · ${t('offline.queued', { count: queueCount })}`}
        </span>
      )}
      {isOnline && isSyncing && <span>🔄 {t('offline.syncing')}</span>}
      {isOnline && !isSyncing && queueCount > 0 && (
        <span>📋 {t('offline.queued', { count: queueCount })}</span>
      )}
    </div>
  );
}
