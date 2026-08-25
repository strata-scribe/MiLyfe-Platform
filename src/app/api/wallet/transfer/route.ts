import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Wallet Transfer API — Send $MLY from one member to another.
 *
 * Enforces:
 * - Sufficient balance
 * - No negative balance (Oath)
 * - Wallet freeze check (safety)
 * - Amount limits
 */

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { recipient_id, amount, reason, from_pot } = body;

  // Validation
  if (!recipient_id || !amount) {
    return NextResponse.json({ error: 'recipient_id and amount required' }, { status: 400 });
  }
  if (amount <= 0 || amount > 10000) {
    return NextResponse.json({ error: 'Amount must be between 0 and 10,000' }, { status: 400 });
  }
  if (recipient_id === user.id) {
    return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 });
  }

  const pot: 'spending' | 'savings' | 'community' = from_pot || 'spending';
  const potColumn = `${pot}_balance`;

  // Use service role for cross-user operations
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

  // Get sender wallet
  const { data: senderWallet } = await adminSupabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!senderWallet) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  // Check balance
  const currentBalance = senderWallet[potColumn as keyof typeof senderWallet] as number;
  if (currentBalance < amount) {
    return NextResponse.json(
      { error: `Insufficient balance. You have ${currentBalance} $MLY in ${pot}.` },
      { status: 400 },
    );
  }

  // Get recipient wallet
  const { data: recipientWallet } = await adminSupabase
    .from('wallets')
    .select('id, spending_balance')
    .eq('user_id', recipient_id)
    .single();

  if (!recipientWallet) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Execute transfer (debit sender, credit recipient)
  const { error: debitError } = await adminSupabase
    .from('wallets')
    .update({
      [potColumn]: currentBalance - amount,
      total_spent: senderWallet.total_spent + amount,
    })
    .eq('user_id', user.id);

  if (debitError) {
    return NextResponse.json({ error: 'Transfer failed (debit)' }, { status: 500 });
  }

  const { error: creditError } = await adminSupabase
    .from('wallets')
    .update({
      spending_balance: recipientWallet.spending_balance + amount,
      total_earned: recipientWallet.spending_balance + amount, // simplified
    })
    .eq('user_id', recipient_id);

  if (creditError) {
    // Rollback debit
    await adminSupabase
      .from('wallets')
      .update({ [potColumn]: currentBalance })
      .eq('user_id', user.id);
    return NextResponse.json({ error: 'Transfer failed (credit)' }, { status: 500 });
  }

  // Record transaction
  await adminSupabase.from('transactions').insert({
    from_user_id: user.id,
    to_user_id: recipient_id,
    amount,
    type: 'transfer',
    pot,
    description: reason || '',
  });

  // Notify recipient
  await adminSupabase.from('notifications').insert({
    user_id: recipient_id,
    type: 'ubi',
    title: `Received ${amount} $MLY`,
    body: reason ? `For: ${reason}` : 'Someone thanked you!',
    link: '/wallet',
  });

  return NextResponse.json({
    success: true,
    new_balance: currentBalance - amount,
  });
}
