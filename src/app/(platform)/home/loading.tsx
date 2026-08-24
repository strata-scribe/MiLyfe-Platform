import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading dashboard">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl col-span-2 md:col-span-1" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
