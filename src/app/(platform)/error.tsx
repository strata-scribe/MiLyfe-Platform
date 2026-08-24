'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center" role="alert">
      <AlertTriangle className="h-12 w-12 text-mly-500 mb-4" aria-hidden="true" />
      <h1 className="text-lg font-bold text-harbor-800 dark:text-white mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="outline" onClick={reset}>
        <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
