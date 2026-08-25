import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { logAudit } from '@/lib/security/audit';

const transferSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
  amount: z.number().positive('Amount must be positive').max(10000, 'Max transfer is 10,000 $MLY'),
  reason: z.string().max(200, 'Reason too long').optional().default(''),
  from_pot: z.enum(['spending', 'savings', 'community']).optional().default('spending'),
});

/**
 * Wallet Transfer API — Send $MLY from one member to another.
 *
 * Security:
 * - Rate limited: 10 transfers per minute
 * - Zod validated input
 * - Atomic transfer via RPC (PostgreSQL transaction)
 * - Wallet freeze check
 * - Self-transfer prevention
 */
export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit
  const rl = await checkRateLimit(user.id, 'wallet-transfer', RATE_LIMITS.transfer);
  if (!rl.success) return rl.error!;

  // Parse and validate
  let input: z.infer<typeof transferSchema>;
  try {
    const body = await request.json();
    input = transferSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (input.recipient_id === user.id) {
    return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 });
  }

  const adminSupabase = createServiceSupabase();

  // Check wallet freeze
  const { data: frozen } = await adminSupabase.rpc('is_wallet_frozen', {
    p_user_id: user.id,
  });

  if (frozen) {
    return NextResponse.json(
      { error: 'Your wallet is frozen for safety. Contact a keeper if you need help.' },
      { status: 403 },
    );
  }

  // Attempt atomic transfer via RPC
  // If the RPC doesn't exist yet, fall back to manual (with rollback)
  const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('transfer_mly', {
    p_sender_id: user.id,
    p_recipient_id: input.recipient_id,
    p_amount: input.amount,
    p_pot: input.from_pot,
    p_reason: input.reason,
  });

  if (rpcError) {
    // RPC might not exist — fall back to manual transfer
    if (rpcError.code === '42883') {
      return await fallbackTransfer(adminSupabase, user.id, input);
    }
    // Business logic errors from RPC
    if (rpcError.message.includes('Insufficient') || rpcError.message.includes('not found')) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }

  // Audit log
  logAudit(user.id, 'wallet.transfer', 'wallet', input.recipient_id, {
    amount: input.amount,
    pot: input.from_pot,
    recipient_id: input.recipient_id,
  });

  return NextResponse.json({
    success: true,
    new_balance: rpcResult,
  });
}

/** Fallback manual transfer if RPC not yet deployed */
async function fallbackTransfer(
  adminSupabase: any,
  senderId: string,
  input: z.infer<typeof transferSchema>
) {
  const potColumn = `${input.from_pot}_balance`;

  // Get sender wallet
  const { data: senderWallet } = await adminSupabase
    .from('wallets')
    .select('*')
    .eq('user_id', senderId)
    .single();

  if (!senderWallet) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  const currentBalance = senderWallet[potColumn as keyof typeof senderWallet] as number;
  if (currentBalance < input.amount) {
    return NextResponse.json(
      { error: `Insufficient balance. You have ${currentBalance} $MLY in ${input.from_pot}.` },
      { status: 400 },
    );
  }

  // Get recipient wallet
  const { data: recipientWallet } = await adminSupabase
    .from('wallets')
    .select('id, spending_balance, total_earned')
    .eq('user_id', input.recipient_id)
    .single();

  if (!recipientWallet) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Debit sender
  const { error: debitError } = await adminSupabase
    .from('wallets')
    .update({
      [potColumn]: currentBalance - input.amount,
      total_spent: senderWallet.total_spent + input.amount,
    })
    .eq('user_id', senderId)
    .eq(potColumn, currentBalance); // Optimistic lock — only update if balance hasn't changed

  if (debitError) {
    return NextResponse.json({ error: 'Transfer failed — balance may have changed. Please retry.' }, { status: 409 });
  }

  // Credit recipient
  const { error: creditError } = await adminSupabase
    .from('wallets')
    .update({
      spending_balance: recipientWallet.spending_balance + input.amount,
      total_earned: recipientWallet.total_earned + input.amount,
    })
    .eq('user_id', input.recipient_id);

  if (creditError) {
    // Rollback debit
    await adminSupabase
      .from('wallets')
      .update({ [potColumn]: currentBalance, total_spent: senderWallet.total_spent })
      .eq('user_id', senderId);
    return NextResponse.json({ error: 'Transfer failed (credit)' }, { status: 500 });
  }

  // Record transaction
  await adminSupabase.from('transactions').insert({
    from_user_id: senderId,
    to_user_id: input.recipient_id,
    amount: input.amount,
    type: 'transfer',
    pot: input.from_pot,
    description: input.reason || '',
  });

  // Notify recipient
  await adminSupabase.from('notifications').insert({
    user_id: input.recipient_id,
    type: 'ubi',
    title: `Received ${input.amount} $MLY`,
    body: input.reason ? `For: ${input.reason}` : 'Someone thanked you!',
    link: '/wallet',
  });

  return NextResponse.json({
    success: true,
    new_balance: currentBalance - input.amount,
  });
}
