import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading profile">
      <Skeleton className="h-7 w-20" />
      <div className="card flex flex-col items-center py-8">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-5 w-32 mt-3" />
        <Skeleton className="h-4 w-24 mt-1" />
        <Skeleton className="h-3 w-48 mt-3" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
