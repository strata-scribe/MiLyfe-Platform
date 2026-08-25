import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Proposal Auto-Close Cron
 *
 * Runs every hour. Closes expired proposals using the database function.
 * Marks as 'passed' if quorum met + majority for. Otherwise 'rejected'.
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();

  const { data, error } = await supabase.rpc('close_expired_proposals');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...(data as any),
    timestamp: new Date().toISOString(),
  });
}
