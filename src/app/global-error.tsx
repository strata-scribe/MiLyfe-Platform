'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            An unexpected error occurred. We&apos;ve been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#1e3a6e] text-white rounded-xl font-medium hover:bg-[#2c5189] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
