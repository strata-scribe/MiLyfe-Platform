import { Skeleton } from '@/components/ui/skeleton';

export default function WalletLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading wallet">
      <div>
        <Skeleton className="h-7 w-24 mb-2" />
        <Skeleton className="h-4 w-44" />
      </div>
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
