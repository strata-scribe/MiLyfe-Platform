import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileView } from './profile-view';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, standingRes, badgesRes, walletRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('standing').select('*').eq('user_id', user.id).single(),
    supabase.from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
    supabase.from('wallets').select('total_earned, total_spent').eq('user_id', user.id).single(),
  ]);

  return (
    <ProfileView
      profile={profileRes.data}
      standing={standingRes.data}
      badges={badgesRes.data || []}
      walletStats={walletRes.data}
    />
  );
}
