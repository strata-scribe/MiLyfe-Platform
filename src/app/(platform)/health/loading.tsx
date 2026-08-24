import { Skeleton } from '@/components/ui/skeleton';

export default function HealthLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading health">
      <div>
        <Skeleton className="h-7 w-20 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
