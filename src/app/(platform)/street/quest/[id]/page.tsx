import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { QuestDetailView } from './quest-detail-view';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data } = await supabase.from('quests').select('title').eq('id', params.id).single();
  return { title: data?.title || 'Quest' };
}

export default async function QuestDetailPage({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: quest } = await supabase
    .from('quests')
    .select('*, profiles!creator_id(id, username, display_name, avatar_url)')
    .eq('id', params.id)
    .single();

  if (!quest) notFound();

  // Get user's claim on this quest (if any)
  const { data: userClaim } = await supabase
    .from('quest_claims')
    .select('*')
    .eq('quest_id', params.id)
    .eq('claimer_id', user.id)
    .maybeSingle();

  // Get all claims (for creator to verify)
  const { data: allClaims } = await supabase
    .from('quest_claims')
    .select('*, profiles!claimer_id(username, display_name)')
    .eq('quest_id', params.id)
    .order('claimed_at');

  return (
    <QuestDetailView
      quest={quest}
      userId={user.id}
      userClaim={userClaim}
      allClaims={allClaims || []}
    />
  );
}
