export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-bold text-harbor-800 dark:text-white mb-2">
        You&apos;re offline
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        No worries — MiLyfe works offline too. Your check-ins and reports will sync when you reconnect.
      </p>
      <div className="mt-8 space-y-3 w-full max-w-xs">
        <a href="/health" className="btn-teal w-full block text-center">
          Health Check-in (offline)
        </a>
        <a href="/vault" className="btn-primary w-full block text-center">
          View Saved Documents
        </a>
      </div>
    </main>
  );
}
