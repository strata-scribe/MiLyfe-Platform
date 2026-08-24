import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeDashboard } from './dashboard';

export const metadata = { title: 'Home' };

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileRes, walletRes, standingRes, rewardsRes, notificationsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    supabase.from('standing').select('*').eq('user_id', user.id).single(),
    supabase.from('rewards').select('*').eq('user_id', user.id).eq('claimed', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(5),
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
    />
  );
}
