import { Skeleton } from '@/components/ui/skeleton';

export default function ForumLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading forum">
      <div>
        <Skeleton className="h-7 w-20 mb-2" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
