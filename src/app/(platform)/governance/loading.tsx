import { Skeleton } from '@/components/ui/skeleton';

export default function GovernanceLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading governance">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}
