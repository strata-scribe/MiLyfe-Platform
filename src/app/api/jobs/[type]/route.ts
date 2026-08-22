import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyQStashSignature } from '@/lib/jobs/queue';

/**
 * Universal job handler — receives background jobs from QStash.
 * Each job type has its own handler function.
 */

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  // Verify the request is from QStash
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const jobType = params.type;
  const payload = await request.json().catch(() => ({}));

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    }
  );

  try {
    switch (jobType) {
      case 'standing_recalc':
        await handleStandingRecalc(supabase, payload);
        break;

      case 'mly_daily_stats':
        await handleDailyStats(supabase);
        break;

      case 'badge_check':
        await handleBadgeCheck(supabase, payload);
        break;

      case 'notification_digest':
        await handleNotificationDigest(supabase);
        break;

      case 'moderation_review':
        await handleModerationReview(supabase, payload);
        break;

      case 'search_index':
        await handleSearchIndex(supabase);
        break;

      case 'recording_process':
        await handleRecordingProcess(supabase, payload);
        break;

      case 'cleanup_expired':
        await handleCleanupExpired(supabase);
        break;

      default:
        return NextResponse.json({ error: `Unknown job type: ${jobType}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, type: jobType });
  } catch (err) {
    console.error(`[Job:${jobType}] Error:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Job failed' },
      { status: 500 }
    );
  }
}

// ─── JOB HANDLERS ────────────────────────────────────────────────

async function handleStandingRecalc(supabase: any, payload: any) {
  const userId = payload.user_id;
  if (userId) {
    // Recalc single user
    const { data: points } = await supabase.rpc('get_standing_points', { uid: userId });
    await supabase.from('profiles').update({ trust_score: Math.min(points || 0, 100) }).eq('id', userId);
  } else {
    // Recalc all active users (batch)
    const { data: users } = await supabase.from('profiles').select('id').limit(500);
    if (users) {
      for (const user of users) {
        const { data: points } = await supabase.rpc('get_standing_points', { uid: user.id });
        await supabase.from('profiles').update({ trust_score: Math.min(points || 0, 100) }).eq('id', user.id);
      }
    }
  }
}

async function handleDailyStats(supabase: any) {
  const today = new Date().toISOString().split('T')[0];

  // Aggregate daily stats
  const { count: activeUsers } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })
    .gte('last_active_at', `${today}T00:00:00Z`);

  const { data: txns } = await supabase
    .from('mly_transactions')
    .select('type, amount')
    .gte('created_at', `${today}T00:00:00Z`);

  let minted = 0, burned = 0, transferred = 0, earned = 0, spent = 0;
  for (const t of txns || []) {
    if (t.type === 'ubi') minted += Number(t.amount);
    else if (t.type === 'burn') burned += Number(t.amount);
    else if (t.type === 'transfer') transferred += Number(t.amount);
    else if (t.type === 'earn') earned += Number(t.amount);
    else if (t.type === 'spend') spent += Number(t.amount);
  }

  const { count: newUsers } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00Z`);

  await supabase.from('mly_daily_stats').upsert({
    date: today,
    minted, burned, transferred, earned, spent,
    active_users: activeUsers || 0,
    new_users: newUsers || 0,
  }, { onConflict: 'date' });

  // Update treasury summary
  const { data: supplyData } = await supabase
    .from('profiles').select('mly_balance');
  const totalCirculating = (supplyData || []).reduce((sum: number, p: any) => sum + Number(p.mly_balance), 0);

  await supabase.from('mly_treasury').update({
    total_circulating: totalCirculating,
    total_users: supplyData?.length || 0,
    updated_at: new Date().toISOString(),
  }).eq('id', (await supabase.from('mly_treasury').select('id').single()).data?.id);
}

async function handleBadgeCheck(supabase: any, payload: any) {
  const userId = payload.user_id;
  if (!userId) return;

  // Check badge criteria for this user
  const { data: badges } = await supabase.from('badges').select('*');
  const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const earnedIds = new Set((userBadges || []).map((ub: any) => ub.badge_id));

  for (const badge of badges || []) {
    if (earnedIds.has(badge.id)) continue;

    const criteria = badge.criteria as any;
    let earned = false;

    // Check criteria types
    if (criteria.checkins_count) {
      const { count } = await supabase.from('health_checkins').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      if ((count || 0) >= criteria.checkins_count) earned = true;
    }
    if (criteria.issues_count) {
      const { count } = await supabase.from('city_issues').select('*', { count: 'exact', head: true }).eq('reporter_id', userId);
      if ((count || 0) >= criteria.issues_count) earned = true;
    }
    if (criteria.votes_count) {
      const { count } = await supabase.from('proposal_votes').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      if ((count || 0) >= criteria.votes_count) earned = true;
    }
    if (criteria.courses_completed) {
      const { count } = await supabase.from('course_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true);
      if ((count || 0) >= criteria.courses_completed) earned = true;
    }
    if (criteria.mly_earned) {
      const { data: total } = await supabase.from('mly_transactions').select('amount').eq('to_id', userId);
      const sum = (total || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      if (sum >= criteria.mly_earned) earned = true;
    }

    if (earned) {
      await supabase.from('user_badges').insert({ user_id: userId, badge_id: badge.id });
      // Notify user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'reward',
        title: `Badge Earned: ${badge.icon} ${badge.name}`,
        body: badge.description,
        link: '/profile',
      });
    }
  }
}

async function handleNotificationDigest(supabase: any) {
  // Find users who want daily email digests
  const { data: users } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('email_enabled', true)
    .eq('email_digest', 'daily');

  if (!users || users.length === 0) return;

  for (const { user_id } of users) {
    const { data: unread } = await supabase
      .from('notifications')
      .select('title, body')
      .eq('user_id', user_id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!unread || unread.length === 0) continue;

    // Queue email send (would call Resend here)
    // For now just mark that digest was sent
  }
}

async function handleModerationReview(supabase: any, payload: any) {
  const flagId = payload.flag_id;
  if (!flagId) return;

  // Auto-review: if content has 3+ flags from different users, escalate
  const { data: flag } = await supabase.from('content_flags').select('*').eq('id', flagId).single();
  if (!flag) return;

  const { count } = await supabase
    .from('content_flags')
    .select('*', { count: 'exact', head: true })
    .eq('content_id', flag.content_id)
    .eq('content_type', flag.content_type);

  if ((count || 0) >= 3) {
    await supabase.from('content_flags')
      .update({ status: 'reviewing' })
      .eq('content_id', flag.content_id)
      .eq('content_type', flag.content_type);
  }
}

async function handleSearchIndex(_supabase: any) {
  // Placeholder: would rebuild search indexes
  // In production, use pgvector embeddings or Typesense
}

async function handleRecordingProcess(supabase: any, payload: any) {
  const recordingId = payload.recording_id;
  if (!recordingId) return;

  // AI categorization would happen here (call Groq/OpenAI)
  // For now, just mark as processed
  await supabase.from('community_recordings')
    .update({ status: 'routed' })
    .eq('id', recordingId)
    .eq('status', 'pending');
}

async function handleCleanupExpired(supabase: any) {
  const now = new Date().toISOString();

  // Clean expired broadcasts
  await supabase.from('broadcasts').delete().lt('expires_at', now);

  // Deactivate expired user restrictions
  await supabase.from('user_restrictions')
    .update({ active: false })
    .lt('ends_at', now)
    .eq('active', true);

  // Close expired proposals
  await supabase.from('proposals')
    .update({ status: 'closed' })
    .lt('ends_at', now)
    .eq('status', 'active');
}
