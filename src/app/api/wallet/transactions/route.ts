import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Wallet Transactions API — Paginated + filterable.
 *
 * Query params:
 * - cursor: ISO date string (for cursor-based pagination — fetch older than this)
 * - type: filter by transaction type (ubi, transfer, reward, spend, etc.)
 * - limit: number of results (default 20, max 50)
 */
export async function GET(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor'); // ISO date — fetch older than this
  const type = searchParams.get('type');
  const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

  let query = supabase
    .from('transactions')
    .select('*')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Cursor pagination — get transactions older than cursor
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Type filter
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = data && data.length === limit;
  const nextCursor = data && data.length > 0 ? data[data.length - 1].created_at : null;

  return NextResponse.json({
    transactions: data || [],
    hasMore,
    nextCursor,
  });
}
