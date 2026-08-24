import { Skeleton } from '@/components/ui/skeleton';

export default function ConnectLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading connections">
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
