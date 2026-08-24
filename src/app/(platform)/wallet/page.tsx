import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WalletView } from './wallet-view';

export const metadata = { title: 'Wallet' };

export default async function WalletPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [walletRes, transactionsRes, treasuryRes] = await Promise.all([
    supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    supabase.from('transactions')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('community_treasury').select('*').order('snapshot_at', { ascending: false }).limit(1).single(),
  ]);

  return (
    <WalletView
      userId={user.id}
      wallet={walletRes.data}
      transactions={transactionsRes.data || []}
      treasury={treasuryRes.data}
    />
  );
}
