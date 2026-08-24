import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileView } from './profile-view';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, standingRes, badgesRes, walletRes, attestationsGivenRes, attestationsReceivedRes, recentPostsRes, connectionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('standing').select('*').eq('user_id', user.id).single(),
    supabase.from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
    supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    supabase.from('attestations')
      .select('id')
      .eq('from_user_id', user.id),
    supabase.from('attestations')
      .select('*, from_user:profiles!attestations_from_user_id_fkey(username, display_name, avatar_url)')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('forum_posts')
      .select('id, title, created_at, space:forum_spaces!forum_posts_space_id_fkey(name, icon)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('connections')
      .select('id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted'),
  ]);

  return (
    <ProfileView
      profile={profileRes.data}
      standing={standingRes.data}
      badges={badgesRes.data || []}
      wallet={walletRes.data}
      attestationsGivenCount={attestationsGivenRes.data?.length || 0}
      attestationsReceived={attestationsReceivedRes.data || []}
      recentPosts={recentPostsRes.data || []}
      connectionCount={connectionsRes.data?.length || 0}
    />
  );
}
