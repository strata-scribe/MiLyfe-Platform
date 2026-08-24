import { Skeleton } from '@/components/ui/skeleton';

export default function AppsLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading apps">
      <div>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
