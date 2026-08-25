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
    enrollmentsRes,
    openQuestsRes,
    activeProposalsRes,
    surplusRes,
    treasuryRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    supabase.from('standing').select('overall').eq('user_id', user.id).single(),
    supabase.from('rewards').select('id, type, amount, title, claimed').eq('user_id', user.id).eq('claimed', false).limit(3),
    supabase.from('learn_enrollments').select('id, progress_percent, learn_paths(title, icon, slug)').eq('user_id', user.id).eq('status', 'active').limit(3),
    supabase.from('quests').select('id, title, reward_mly, category, difficulty').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
    supabase.from('proposals').select('id, title, votes_for, votes_against, closes_at').eq('status', 'active').order('created_at', { ascending: false }).limit(3),
    supabase.from('surplus_items').select('id, title, category, available_until').eq('status', 'available').gt('available_until', new Date().toISOString()).limit(3),
    supabase.from('community_treasury').select('balance, citizen_count').order('snapshot_at', { ascending: false }).limit(1).single(),
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
      enrollments={enrollmentsRes.data || []}
      openQuests={openQuestsRes.data || []}
      activeProposals={activeProposalsRes.data || []}
      surplus={surplusRes.data || []}
      treasury={treasuryRes.data}
    />
  );
}
