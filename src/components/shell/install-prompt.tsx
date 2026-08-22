'use client';

import { useState, useEffect } from 'react';

/**
 * PWA Install Prompt — shows a banner encouraging users to install the app.
 * Only appears when the app is installable and hasn't been dismissed.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('milyfe-install-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 30 seconds of use
      setTimeout(() => setShow(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem('milyfe-install-dismissed', 'true');
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-harbor-800 text-white rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 fade-in max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="MiLyfe" className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <h3 className="text-sm font-bold">Install MiLyfe</h3>
          <p className="text-xs text-white/70 mt-0.5">
            Add to your home screen for faster access, offline support, and push notifications.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={handleInstall} className="flex-1 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg">
          Install
        </button>
        <button onClick={dismiss} className="px-4 py-2 text-sm text-white/60 hover:text-white">
          Later
        </button>
      </div>
    </div>
  );
}
