import { Skeleton } from '@/components/ui/skeleton';

export default function WikiLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading wiki">
      <div>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-4 w-44" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}
