'use client';

import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils/cn';

interface InfiniteScrollProps {
  /** Called when the sentinel enters the viewport */
  onLoadMore: () => void;
  /** Whether more data is available */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Children (the list items) */
  children: React.ReactNode;
  /** Custom loading indicator */
  loader?: React.ReactNode;
  /** Custom end-of-list message */
  endMessage?: React.ReactNode;
  /** Root margin for early trigger (default: 200px) */
  rootMargin?: string;
  /** Custom className */
  className?: string;
}

/**
 * Production-ready infinite scroll powered by react-intersection-observer.
 * Triggers onLoadMore when the sentinel element enters the viewport.
 * 
 * Usage:
 * ```tsx
 * <InfiniteScroll
 *   onLoadMore={() => fetchNextPage()}
 *   hasMore={hasNextPage}
 *   isLoading={isFetchingNextPage}
 * >
 *   {items.map(item => <ItemCard key={item.id} {...item} />)}
 * </InfiniteScroll>
 * ```
 */
export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  children,
  loader,
  endMessage,
  rootMargin = '200px',
  className,
}: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    rootMargin,
    threshold: 0,
  });

  React.useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  return (
    <div className={className}>
      {children}

      {/* Sentinel element — triggers load when visible */}
      <div ref={ref} className="h-1" aria-hidden="true" />

      {/* Loading state */}
      {isLoading && (
        loader || (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )
      )}

      {/* End of list */}
      {!hasMore && !isLoading && (
        endMessage || (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">You&apos;ve reached the end</p>
          </div>
        )
      )}
    </div>
  );
}

/**
 * Hook variant for more control.
 * Returns a ref to attach to your sentinel element.
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  rootMargin = '200px',
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  rootMargin?: string;
}) {
  const { ref, inView } = useInView({ rootMargin, threshold: 0 });

  React.useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  return { sentinelRef: ref, inView };
}
