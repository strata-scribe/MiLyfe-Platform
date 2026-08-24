import { Skeleton } from '@/components/ui/skeleton';

export default function RewardsLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading rewards">
      <div>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
