import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeDashboard } from './dashboard';

export const metadata = { title: 'Home' };

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    profileRes,
    walletRes,
    standingRes,
    rewardsRes,
    notificationsRes,
    recentTransactionsRes,
    recentPostsRes,
    activeProposalsRes,
    treasuryRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    supabase.from('standing').select('*').eq('user_id', user.id).single(),
    supabase.from('rewards').select('*').eq('user_id', user.id).eq('claimed', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions')
      .select('amount, type, created_at')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('forum_posts')
      .select('id, title, created_at, author:profiles!forum_posts_author_id_fkey(username, display_name, avatar_url), space:forum_spaces!forum_posts_space_id_fkey(name, icon)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('proposals').select('id').eq('status', 'active'),
    supabase.from('community_treasury').select('*').order('snapshot_at', { ascending: false }).limit(1).single(),
  ]);

  const profile = profileRes.data;
  if (profile && !profile.onboarding_complete) {
    redirect('/onboarding');
  }

  return (
    <HomeDashboard
      profile={profile}
      wallet={walletRes.data}
      standing={standingRes.data}
      rewards={rewardsRes.data || []}
      notifications={notificationsRes.data || []}
      recentTransactions={recentTransactionsRes.data || []}
      recentPosts={recentPostsRes.data || []}
      activeProposalCount={activeProposalsRes.data?.length || 0}
      treasury={treasuryRes.data}
    />
  );
}
