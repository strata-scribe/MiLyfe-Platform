'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl">📴</p>
      <h1 className="mt-4 text-2xl font-bold">You're offline</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        MiLyfe works offline for many things — your wallet balance, learning progress,
        and community resources are cached on your device. When you reconnect, everything
        will sync automatically.
      </p>
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>What still works offline:</p>
        <ul className="space-y-1">
          <li>✓ View cached wallet balance</li>
          <li>✓ Continue learning (offline packs)</li>
          <li>✓ View cached resources</li>
          <li>✓ Queue actions (sync when online)</li>
          <li>✓ Safety features (leave-now, timer)</li>
        </ul>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Try Again
      </button>
    </div>
  );
}
