import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * GET /api/notifications — fetch user's notifications
 * POST /api/notifications — mark as read / register push subscription
 */

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const unreadOnly = url.searchParams.get('unread') === 'true';

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get unread count
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return NextResponse.json({ notifications: data, unread_count: count || 0 });
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`notif:${ip}`, RATE_LIMITS.general, 'notifications');
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: rateLimitHeaders(rateCheck) });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Mark notifications as read
  if (body.action === 'mark_read') {
    const ids = body.ids as string[] | undefined;
    if (ids && ids.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', ids).eq('user_id', user.id);
    } else {
      // Mark all as read
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    }
    return NextResponse.json({ success: true });
  }

  // Register push subscription
  if (body.action === 'register_push') {
    const { endpoint, p256dh, auth } = body.subscription || {};
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
    }

    // Upsert subscription
    await supabase.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint, p256dh, auth_key: auth },
      { onConflict: 'user_id,endpoint' }
    );

    return NextResponse.json({ success: true });
  }

  // Update preferences
  if (body.action === 'update_preferences') {
    const { push_enabled, email_enabled, email_digest, quiet_hours_start, quiet_hours_end, categories } = body;
    await supabase.from('notification_preferences').upsert(
      {
        user_id: user.id,
        ...(push_enabled !== undefined && { push_enabled }),
        ...(email_enabled !== undefined && { email_enabled }),
        ...(email_digest !== undefined && { email_digest }),
        ...(quiet_hours_start !== undefined && { quiet_hours_start }),
        ...(quiet_hours_end !== undefined && { quiet_hours_end }),
        ...(categories !== undefined && { categories }),
      },
      { onConflict: 'user_id' }
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
