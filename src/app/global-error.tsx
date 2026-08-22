'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md mx-auto">
          <p className="text-6xl mb-6">🛠️</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We hit an unexpected error. Our team has been notified and is working on a fix.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
              <p className="text-sm font-mono text-red-700 dark:text-red-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-500 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/home"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
