import { Skeleton } from '@/components/ui/skeleton';

export default function NewsLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading news">
      <div>
        <Skeleton className="h-7 w-20 mb-2" />
        <Skeleton className="h-4 w-44" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
