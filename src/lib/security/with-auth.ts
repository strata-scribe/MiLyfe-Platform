import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * withAuth — Unified authentication + CSRF protection wrapper for API routes.
 *
 * Usage:
 *   export async function POST(request: Request) {
 *     return withAuth(request, async (user, supabase) => {
 *       // your logic here
 *       return NextResponse.json({ success: true });
 *     });
 *   }
 *
 * Security:
 * - Verifies Supabase session (401 if missing)
 * - Validates Origin/Referer header for state-changing requests (CSRF)
 * - Returns standardized error responses
 */

type AuthHandler = (
  user: User,
  supabase: ReturnType<typeof createServerSupabase>
) => Promise<NextResponse>;

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://milyfe-platform.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

function isValidOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();

  // GET/HEAD/OPTIONS don't need CSRF protection
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  // Check Origin header first (most reliable)
  const origin = request.headers.get('origin');
  if (origin) {
    return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
  }

  // Fall back to Referer
  const referer = request.headers.get('referer');
  if (referer) {
    return ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));
  }

  // Server actions from Next.js include specific headers — allow those
  const nextAction = request.headers.get('next-action');
  if (nextAction) return true;

  // No origin info — block for safety on mutations
  return false;
}

export async function withAuth(
  request: Request,
  handler: AuthHandler
): Promise<NextResponse> {
  // CSRF check
  if (!isValidOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  // Auth check
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(user, supabase);
}

/**
 * withCronAuth — Validates cron secret for scheduled jobs.
 */
export function withCronAuth(request: Request): { authorized: boolean; error?: NextResponse } {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { authorized: true };
}
