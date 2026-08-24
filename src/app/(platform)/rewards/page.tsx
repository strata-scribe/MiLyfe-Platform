import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RewardsView } from './rewards-view';

export const metadata = { title: 'Rewards' };

export default async function RewardsPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [pendingRes, claimedRes, badgesRes] = await Promise.all([
    supabase.from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('claimed', false)
      .order('created_at', { ascending: false }),
    supabase.from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('claimed', true)
      .order('claimed_at', { ascending: false })
      .limit(10),
    supabase.from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
  ]);

  return (
    <RewardsView
      userId={user.id}
      pendingRewards={pendingRes.data || []}
      claimedRewards={claimedRes.data || []}
      badges={badgesRes.data || []}
    />
  );
}
