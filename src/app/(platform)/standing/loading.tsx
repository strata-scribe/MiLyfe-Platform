import { Skeleton } from '@/components/ui/skeleton';

export default function StandingLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading standing">
      <div>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
