'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Reusable Supabase query hook with TanStack Query caching.
 * Replaces manual useState + useEffect data fetching patterns.
 */
export function useSupabaseQuery<T>(
  key: string[],
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<T>,
  options?: { enabled?: boolean; staleTime?: number; refetchInterval?: number }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();
      return queryFn(supabase);
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Reusable Supabase mutation hook with automatic cache invalidation.
 */
export function useSupabaseMutation<TVariables, TResult = void>(
  mutationFn: (supabase: ReturnType<typeof createClient>, variables: TVariables) => Promise<TResult>,
  options?: { invalidateKeys?: string[][]; onSuccess?: (data: TResult) => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const supabase = createClient();
      return mutationFn(supabase, variables);
    },
    onSuccess: (data) => {
      // Invalidate related queries
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      options?.onSuccess?.(data);
    },
  });
}

/**
 * Paginated Supabase query hook.
 */
export function useSupabasePaginatedQuery<T>(
  key: string[],
  table: string,
  options: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    page?: number;
    pageSize?: number;
    enabled?: boolean;
  }
) {
  const page = options.page ?? 0;
  const pageSize = options.pageSize ?? 20;

  return useQuery({
    queryKey: [...key, page, pageSize, options.filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from(table)
        .select(options.select || '*', { count: 'exact' });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([col, val]) => {
          if (val !== undefined && val !== null && val !== 'all') {
            query = query.eq(col, val);
          }
        });
      }

      // Order
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
      }

      // Pagination
      const from = page * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data as T[], count: count ?? 0, page, pageSize };
    },
    enabled: options.enabled ?? true,
  });
}
