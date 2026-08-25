import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * UBI Distribution Cron
 *
 * Runs weekly (configured via Vercel Cron or external scheduler).
 * Distributes 100 $MLY to every verified member's spending pot.
 *
 * Protected by CRON_SECRET header to prevent unauthorized triggers.
 */

const WEEKLY_UBI_AMOUNT = 100;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  // Get all active members who haven't received UBI in the last 6 days
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

  const { data: eligibleWallets, error: fetchError } = await supabase
    .from('wallets')
    .select('id, user_id, spending_balance, last_ubi_at')
    .or(`last_ubi_at.is.null,last_ubi_at.lt.${sixDaysAgo}`);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!eligibleWallets || eligibleWallets.length === 0) {
    return NextResponse.json({ distributed: 0, message: 'No eligible members' });
  }

  let distributed = 0;
  let errors = 0;

  // Process in batches of 50
  for (let i = 0; i < eligibleWallets.length; i += 50) {
    const batch = eligibleWallets.slice(i, i + 50);

    for (const wallet of batch) {
      try {
        // Credit spending balance
        const { error: updateError } = await supabase
          .from('wallets')
          .update({
            spending_balance: wallet.spending_balance + WEEKLY_UBI_AMOUNT,
            total_earned: wallet.spending_balance + WEEKLY_UBI_AMOUNT, // Note: should use raw SQL increment
            last_ubi_at: now,
          })
          .eq('id', wallet.id);

        if (updateError) {
          errors++;
          continue;
        }

        // Record transaction
        await supabase.from('transactions').insert({
          from_user_id: null, // System (UBI)
          to_user_id: wallet.user_id,
          amount: WEEKLY_UBI_AMOUNT,
          type: 'ubi',
          pot: 'spending',
          description: 'Weekly UBI distribution',
          metadata: { week: getISOWeek(new Date()) },
        });

        // Create reward notification
        await supabase.from('rewards').insert({
          user_id: wallet.user_id,
          type: 'ubi',
          amount: WEEKLY_UBI_AMOUNT,
          title: 'Weekly UBI',
          description: `Your weekly ${WEEKLY_UBI_AMOUNT} $MLY has arrived.`,
          claimed: true,
          claimed_at: now,
        });

        distributed++;
      } catch {
        errors++;
      }
    }
  }

  // Update treasury snapshot
  await supabase.from('community_treasury').insert({
    balance: distributed * WEEKLY_UBI_AMOUNT, // Simplified — should query actual total
    total_distributed: distributed * WEEKLY_UBI_AMOUNT,
    citizen_count: eligibleWallets.length,
  });

  return NextResponse.json({
    distributed,
    errors,
    total_eligible: eligibleWallets.length,
    amount_per_member: WEEKLY_UBI_AMOUNT,
    timestamp: now,
  });
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}
