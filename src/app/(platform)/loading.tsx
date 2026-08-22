/**
 * Global loading state for the platform route group.
 * Shows while page chunks are being loaded (code splitting).
 */
export default function PlatformLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-harbor-800 rounded-lg" />
          <div className="h-3 w-48 bg-gray-100 dark:bg-harbor-900 rounded" />
        </div>
        <div className="h-9 w-20 bg-gray-200 dark:bg-harbor-800 rounded-lg" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-harbor-900 rounded-xl" />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 bg-gray-100 dark:bg-harbor-900 rounded-xl" />

      {/* Content skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-harbor-900 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
