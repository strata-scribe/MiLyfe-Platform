import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PublicProfileView } from './public-profile-view';

interface PageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data } = await supabase.from('profiles').select('display_name').eq('username', params.username).single();
  return { title: data?.display_name || params.username };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!profile) notFound();

  const [standingRes, badgesRes, attestationsRes] = await Promise.all([
    supabase.from('standing').select('*').eq('user_id', profile.id).single(),
    supabase.from('learn_badges').select('badge_name, badge_icon, earned_at').eq('user_id', profile.id).order('earned_at', { ascending: false }),
    supabase.from('attestations').select('facet, reason, created_at, profiles!from_user_id(username, display_name)').eq('to_user_id', profile.id).order('created_at', { ascending: false }).limit(10),
  ]);

  return (
    <PublicProfileView
      profile={profile}
      standing={standingRes.data}
      badges={badgesRes.data || []}
      attestations={attestationsRes.data || []}
      isOwnProfile={profile.id === user.id}
      viewerId={user.id}
    />
  );
}
