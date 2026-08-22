'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('[MiLyfe] SW registered:', registration.scope);

          // Check for updates every 5 minutes
          setInterval(() => registration.update(), 5 * 60 * 1000);
        },
        (error) => {
          console.log('[MiLyfe] SW registration failed:', error);
        }
      );

      // Listen for SW update message — reload when new version available
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          console.log('[MiLyfe] New version available, reloading...');
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
