'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('[MiLyfe] SW registered:', registration.scope);
        },
        (error) => {
          console.log('[MiLyfe] SW registration failed:', error);
        }
      );
    }
  }, []);

  return null;
}
