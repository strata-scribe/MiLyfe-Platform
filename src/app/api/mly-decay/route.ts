import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * MLY Decay/Burn Automation
 * 
 * Economics:
 * - Inactive decay: Users inactive for 14+ days lose 2% of balance daily (encourages participation)
 * - Hoarding tax: Balances over 1000 MLY decay at 1% daily (encourages circulation)
 * - Burn: Decayed tokens are burned (removed from supply), not redistributed
 * 
 * Called via Vercel Cron at midnight UTC daily.
 */

const DECAY_CRON_SECRET = process.env.UBI_CRON_SECRET || 'milyfe-ubi-secret';
const INACTIVE_DAYS_THRESHOLD = 14;
const INACTIVE_DECAY_RATE = 0.02; // 2% daily
const HOARDING_THRESHOLD = 1000; // MLY
const HOARDING_DECAY_RATE = 0.01; // 1% daily on amount over threshold
const MIN_DECAY_AMOUNT = 0.5; // Don't bother decaying less than $0.50

export async function POST(request: Request) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for') || 'cron';
  const rateCheck = await checkRateLimit(`decay:${ip}`, RATE_LIMITS.decay, 'decay');
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitHeaders(rateCheck) }
    );
  }

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${DECAY_CRON_SECRET}`) {
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

  const now = new Date();
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - INACTIVE_DAYS_THRESHOLD);

  let totalBurned = 0;
  let inactiveDecayed = 0;
  let hoardingDecayed = 0;
  const affectedUsers: string[] = [];

  // === INACTIVE DECAY ===
  // Find users who haven't done anything in 14+ days but have a balance
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, mly_balance, last_active_at')
    .gt('mly_balance', MIN_DECAY_AMOUNT);

  if (allProfiles) {
    for (const profile of allProfiles) {
      let decayAmount = 0;
      const lastActive = profile.last_active_at 
        ? new Date(profile.last_active_at) 
        : new Date(0);
      const isInactive = lastActive < inactiveCutoff;
      const balance = profile.mly_balance || 0;

      // Inactive decay
      if (isInactive && balance > MIN_DECAY_AMOUNT) {
        const inactiveDecay = Math.floor(balance * INACTIVE_DECAY_RATE * 100) / 100;
        if (inactiveDecay >= MIN_DECAY_AMOUNT) {
          decayAmount += inactiveDecay;
          inactiveDecayed++;
        }
      }

      // Hoarding tax (applies to everyone, even active users)
      if (balance > HOARDING_THRESHOLD) {
        const excessBalance = balance - HOARDING_THRESHOLD;
        const hoardingDecay = Math.floor(excessBalance * HOARDING_DECAY_RATE * 100) / 100;
        if (hoardingDecay >= MIN_DECAY_AMOUNT) {
          decayAmount += hoardingDecay;
          hoardingDecayed++;
        }
      }

      // Apply decay
      if (decayAmount >= MIN_DECAY_AMOUNT) {
        const finalDecay = Math.min(decayAmount, balance - 1); // Never go below $1
        if (finalDecay > 0) {
          // Deduct from balance
          await supabase.rpc('increment_balance', { 
            user_id: profile.id, 
            amount: -finalDecay 
          });

          // Record burn transaction
          await supabase.from('mly_transactions').insert({
            from_id: profile.id,
            amount: finalDecay,
            type: 'burn',
            description: isInactive 
              ? `Inactive decay (-${INACTIVE_DECAY_RATE * 100}%): ${INACTIVE_DAYS_THRESHOLD}+ days inactive`
              : `Circulation tax (-${HOARDING_DECAY_RATE * 100}% on balance over $${HOARDING_THRESHOLD})`,
          });

          totalBurned += finalDecay;
          affectedUsers.push(profile.id);
        }
      }
    }
  }

  // Record total burn in system ledger
  if (totalBurned > 0) {
    await supabase.from('mly_burns').insert({
      amount: totalBurned,
      reason: 'daily_decay',
      affected_users: affectedUsers.length,
      inactive_decayed: inactiveDecayed,
      hoarding_decayed: hoardingDecayed,
      executed_at: now.toISOString(),
    });

    // Notify affected users (only inactive ones — hoarding is silent)
    if (inactiveDecayed > 0) {
      const inactiveNotifications = affectedUsers.slice(0, 50).map((userId) => ({
        user_id: userId,
        type: 'system' as const,
        title: 'Balance decay — stay active!',
        body: `Your $MLY balance decayed due to inactivity. Check in or participate to stop decay.`,
        link: '/health',
      }));
      await supabase.from('notifications').insert(inactiveNotifications);
    }
  }

  return NextResponse.json({
    total_burned: Math.round(totalBurned * 100) / 100,
    users_affected: affectedUsers.length,
    inactive_decayed: inactiveDecayed,
    hoarding_decayed: hoardingDecayed,
    rates: {
      inactive_threshold_days: INACTIVE_DAYS_THRESHOLD,
      inactive_rate: `${INACTIVE_DECAY_RATE * 100}%/day`,
      hoarding_threshold: HOARDING_THRESHOLD,
      hoarding_rate: `${HOARDING_DECAY_RATE * 100}%/day over $${HOARDING_THRESHOLD}`,
    },
    timestamp: now.toISOString(),
  });
}

// GET — public economics info
export async function GET() {
  return NextResponse.json({
    mechanics: {
      inactive_decay: {
        description: 'Users inactive for 14+ days lose 2% of balance daily',
        threshold_days: INACTIVE_DAYS_THRESHOLD,
        rate: `${INACTIVE_DECAY_RATE * 100}% per day`,
        purpose: 'Encourages regular community participation',
      },
      hoarding_tax: {
        description: 'Balances over 1000 MLY lose 1% of excess daily',
        threshold: HOARDING_THRESHOLD,
        rate: `${HOARDING_DECAY_RATE * 100}% per day on excess`,
        purpose: 'Encourages $MLY circulation in the community',
      },
      burn: {
        description: 'Decayed tokens are permanently removed from supply',
        effect: 'Maintains value of circulating $MLY',
      },
    },
    how_to_avoid: [
      'Check in daily on MiHealth',
      'Report community issues',
      'Spend $MLY at local businesses',
      'Send $MLY to neighbors',
      'Participate in governance votes',
    ],
  });
}
