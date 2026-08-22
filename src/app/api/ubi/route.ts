import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

// UBI Distribution — Daily $MLY airdrop to active users
// Called via cron (Vercel Cron / external scheduler) or manually
// Active = checked in within last 7 days OR reported an issue within 7 days

const UBI_AMOUNT = 10; // $MLY per day per active user
const UBI_CRON_SECRET = process.env.UBI_CRON_SECRET || 'milyfe-ubi-secret';

export async function POST(request: Request) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for') || 'cron';
  const rateCheck = checkRateLimit(`ubi:${ip}`, RATE_LIMITS.ubi);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitHeaders(rateCheck) }
    );
  }

  // Verify cron secret (prevents unauthorized triggers)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${UBI_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString();

  // Find active users: checked in OR reported issue in last 7 days
  const { data: activeCheckinUsers } = await supabase
    .from('health_checkins')
    .select('user_id')
    .gte('created_at', cutoff);

  const { data: activeIssueUsers } = await supabase
    .from('city_issues')
    .select('reporter_id')
    .gte('created_at', cutoff);

  // Deduplicate
  const activeUserIds = new Set<string>();
  activeCheckinUsers?.forEach((r) => activeUserIds.add(r.user_id));
  activeIssueUsers?.forEach((r) => activeUserIds.add(r.reporter_id));

  if (activeUserIds.size === 0) {
    return NextResponse.json({ distributed: 0, message: 'No active users found' });
  }

  // Create UBI transactions
  const transactions = Array.from(activeUserIds).map((userId) => ({
    to_id: userId,
    amount: UBI_AMOUNT,
    type: 'ubi' as const,
    description: 'Daily UBI — community participation reward',
  }));

  const { error: txError } = await supabase
    .from('mly_transactions')
    .insert(transactions);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Update balances
  for (const userId of Array.from(activeUserIds)) {
    await supabase.rpc('increment_balance', { user_id: userId, amount: UBI_AMOUNT });
  }

  // Create notifications for each recipient
  const notifications = Array.from(activeUserIds).map((userId) => ({
    user_id: userId,
    type: 'ubi' as const,
    title: `+${UBI_AMOUNT} $MLY received`,
    body: 'Daily UBI drop for community participation. Keep it up!',
    link: '/profile',
  }));

  await supabase.from('notifications').insert(notifications);

  return NextResponse.json({
    distributed: activeUserIds.size,
    amount_per_user: UBI_AMOUNT,
    total_distributed: activeUserIds.size * UBI_AMOUNT,
    timestamp: new Date().toISOString(),
  });
}

// GET — check UBI status (public info)
export async function GET() {
  return NextResponse.json({
    ubi_amount: UBI_AMOUNT,
    frequency: 'daily',
    eligibility: 'Active community participation in last 7 days (health check-in or issue report)',
    next_distribution: getNextDistributionTime(),
  });
}

function getNextDistributionTime(): string {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0); // 6 AM UTC daily
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}
