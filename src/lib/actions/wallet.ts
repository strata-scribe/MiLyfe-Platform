'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';

// ─── Claim Reward ────────────────────────────────────────────────────────────
const claimRewardSchema = z.object({
  rewardId: z.string().uuid(),
});

export async function claimReward(formData: { rewardId: string }) {
  const parsed = claimRewardSchema.safeParse(formData);
  if (!parsed.success) return { error: 'Invalid reward ID' };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Fetch reward — verify it belongs to user and is unclaimed
  const { data: reward, error: fetchErr } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', parsed.data.rewardId)
    .eq('user_id', user.id)
    .eq('claimed', false)
    .single();

  if (fetchErr || !reward) return { error: 'Reward not found or already claimed' };

  // Check expiry
  if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
    return { error: 'Reward has expired' };
  }

  // Mark reward as claimed
  const { error: claimErr } = await supabase
    .from('rewards')
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq('id', reward.id);

  if (claimErr) return { error: 'Failed to claim reward' };

  // Credit wallet spending balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('spending_balance, total_earned')
    .eq('user_id', user.id)
    .single();

  if (wallet) {
    await supabase
      .from('wallets')
      .update({
        spending_balance: wallet.spending_balance + reward.amount,
        total_earned: wallet.total_earned + reward.amount,
      })
      .eq('user_id', user.id);
  }

  // Record transaction
  await supabase.from('transactions').insert({
    from_user_id: null,
    to_user_id: user.id,
    amount: reward.amount,
    type: 'reward',
    pot: 'spending',
    description: reward.title,
  });

  return { success: true, amount: reward.amount };
}

// ─── Transfer $MLY ───────────────────────────────────────────────────────────
const transferSchema = z.object({
  toUsername: z.string().min(3).max(24),
  amount: z.number().positive().max(10000),
  pot: z.enum(['spending', 'savings', 'community']).default('spending'),
});

export async function transferMLY(formData: {
  toUsername: string;
  amount: number;
  pot?: 'spending' | 'savings' | 'community';
}) {
  const parsed = transferSchema.safeParse(formData);
  if (!parsed.success) return { error: 'Invalid transfer data' };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { toUsername, amount, pot } = parsed.data;

  // Look up recipient
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', toUsername)
    .single();

  if (!recipient) return { error: 'Recipient not found' };
  if (recipient.id === user.id) return { error: 'Cannot transfer to yourself' };

  // Get sender wallet
  const { data: senderWallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!senderWallet) return { error: 'Wallet not found' };

  // Check balance in the specified pot
  const balanceField = `${pot}_balance` as 'spending_balance' | 'savings_balance' | 'community_balance';
  if ((senderWallet as any)[balanceField] < amount) {
    return { error: `Insufficient ${pot} balance` };
  }

  // Debit sender
  await supabase
    .from('wallets')
    .update({
      [balanceField]: (senderWallet as any)[balanceField] - amount,
      total_spent: senderWallet.total_spent + amount,
    })
    .eq('user_id', user.id);

  // Credit recipient (always to spending)
  const { data: recipientWallet } = await supabase
    .from('wallets')
    .select('spending_balance, total_earned')
    .eq('user_id', recipient.id)
    .single();

  if (recipientWallet) {
    await supabase
      .from('wallets')
      .update({
        spending_balance: recipientWallet.spending_balance + amount,
        total_earned: recipientWallet.total_earned + amount,
      })
      .eq('user_id', recipient.id);
  }

  // Record transaction
  await supabase.from('transactions').insert({
    from_user_id: user.id,
    to_user_id: recipient.id,
    amount,
    type: 'transfer',
    pot: pot || 'spending',
    description: `Transfer to @${toUsername}`,
  });

  return { success: true, amount, to: toUsername };
}

// ─── Move Between Pots ───────────────────────────────────────────────────────
const movePotSchema = z.object({
  from: z.enum(['spending', 'savings', 'community']),
  to: z.enum(['spending', 'savings', 'community']),
  amount: z.number().positive(),
});

export async function moveBetweenPots(formData: {
  from: 'spending' | 'savings' | 'community';
  to: 'spending' | 'savings' | 'community';
  amount: number;
}) {
  const parsed = movePotSchema.safeParse(formData);
  if (!parsed.success) return { error: 'Invalid data' };

  const { from, to, amount } = parsed.data;
  if (from === to) return { error: 'Source and destination must differ' };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!wallet) return { error: 'Wallet not found' };

  const fromField = `${from}_balance` as keyof typeof wallet;
  const toField = `${to}_balance` as keyof typeof wallet;

  if ((wallet as any)[fromField] < amount) {
    return { error: `Insufficient ${from} balance` };
  }

  await supabase
    .from('wallets')
    .update({
      [fromField]: (wallet as any)[fromField] - amount,
      [toField]: (wallet as any)[toField] + amount,
    })
    .eq('user_id', user.id);

  return { success: true };
}

// ─── Distribute UBI (cron-triggered) ─────────────────────────────────────────
export async function distributeUBI(secret: string) {
  if (secret !== process.env.UBI_CRON_SECRET) {
    return { error: 'Unauthorized' };
  }

  const supabase = createServerSupabase();

  // Get all wallets that haven't received UBI in 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: eligibleWallets } = await supabase
    .from('wallets')
    .select('user_id, spending_balance, total_earned, last_ubi_at')
    .or(`last_ubi_at.is.null,last_ubi_at.lt.${cutoff}`);

  if (!eligibleWallets || eligibleWallets.length === 0) {
    return { distributed: 0 };
  }

  const UBI_AMOUNT = 10; // $MLY per day
  let distributed = 0;

  for (const wallet of eligibleWallets) {
    await supabase
      .from('wallets')
      .update({
        spending_balance: wallet.spending_balance + UBI_AMOUNT,
        total_earned: wallet.total_earned + UBI_AMOUNT,
        last_ubi_at: new Date().toISOString(),
      })
      .eq('user_id', wallet.user_id);

    await supabase.from('transactions').insert({
      from_user_id: null,
      to_user_id: wallet.user_id,
      amount: UBI_AMOUNT,
      type: 'ubi',
      pot: 'spending',
      description: 'Daily UBI distribution',
    });

    await supabase.from('rewards').insert({
      user_id: wallet.user_id,
      type: 'ubi',
      amount: UBI_AMOUNT,
      title: 'Daily UBI',
      description: 'Your daily universal basic income',
      claimed: true,
      claimed_at: new Date().toISOString(),
    });

    distributed++;
  }

  // Update treasury
  await supabase
    .from('community_treasury')
    .update({
      total_distributed: distributed * UBI_AMOUNT,
      citizen_count: eligibleWallets.length,
    })
    .not('id', 'is', null);

  return { success: true, distributed, amount: UBI_AMOUNT };
}
