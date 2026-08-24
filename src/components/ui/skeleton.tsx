import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-gray-200 dark:bg-harbor-800', className)}
      aria-hidden="true"
    />
  );
}

/** Standard page loading skeleton with title + content blocks */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading content">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Card-style skeleton for lists */
export function CardSkeleton() {
  return (
    <div className="card space-y-3" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

/** List skeleton — n items */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
