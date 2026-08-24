import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StandingView } from './standing-view';

export const metadata = { title: 'Standing' };

export default async function StandingPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [standingRes, attestationsRes, profileRes] = await Promise.all([
    supabase.from('standing').select('*').eq('user_id', user.id).single(),
    supabase.from('attestations')
      .select('*, from_user:profiles!attestations_from_user_id_fkey(username, display_name, avatar_url)')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase.from('profiles').select('display_name, username').eq('id', user.id).single(),
  ]);

  return (
    <StandingView
      standing={standingRes.data}
      attestations={attestationsRes.data || []}
      profile={profileRes.data}
    />
  );
}
