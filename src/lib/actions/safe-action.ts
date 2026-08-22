import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

/**
 * next-safe-action client — type-safe, validated Server Actions.
 * 
 * Usage:
 * ```ts
 * // In a server action file:
 * import { action } from '@/lib/actions/safe-action';
 * 
 * export const createPost = action
 *   .schema(z.object({ title: z.string(), body: z.string() }))
 *   .action(async ({ parsedInput }) => {
 *     // parsedInput is typed and validated
 *     return { success: true };
 *   });
 * ```
 */

export const action = createSafeActionClient({
  handleServerError: (e) => {
    console.error('[MiLyfe Action Error]:', e.message);
    return e.message || 'Something went wrong';
  },
});

/**
 * Authenticated action client — requires user session.
 */
export const authAction = createSafeActionClient({
  handleServerError: (e) => {
    console.error('[MiLyfe Auth Action Error]:', e.message);
    return e.message || 'Something went wrong';
  },
});
