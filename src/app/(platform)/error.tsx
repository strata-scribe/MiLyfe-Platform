'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Global error boundary for the platform route group.
 * Catches unhandled React errors and provides recovery options.
 */
export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry in production
    console.error('[MiLyfe Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-bold text-harbor-800 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Don&apos;t worry — your data is safe. This is likely a temporary issue.
        </p>
        {error.message && (
          <p className="text-xs text-gray-400 bg-gray-50 dark:bg-harbor-900 rounded-lg p-3 mb-4 font-mono">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/home'} variant="outline">
            Go Home
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-4">
          If this keeps happening, let us know at{' '}
          <a href="/support" className="text-teal-600 hover:underline">Support</a>
        </p>
      </div>
    </div>
  );
}
