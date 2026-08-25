import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { TreasuryView } from './treasury-view';

export const metadata: Metadata = { title: 'Treasury' };

export default async function TreasuryPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get treasury snapshot
  const { data: treasury } = await supabase
    .from('community_treasury')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get recent treasury transactions (UBI payouts, fees, etc.)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, from_user_id, to_user_id, amount, type, description, created_at')
    .or('type.eq.ubi,type.eq.treasury_fee,type.eq.quest_reward,type.eq.proposal_fund')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get distribution stats
  const { data: weeklyStats } = await supabase
    .from('transactions')
    .select('amount, type, created_at')
    .eq('type', 'ubi')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  return (
    <TreasuryView
      treasury={treasury}
      transactions={transactions || []}
      weeklyStats={weeklyStats || []}
    />
  );
}
