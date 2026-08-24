import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GovernanceView } from './governance-view';

export const metadata = { title: 'Governance' };

export default async function GovernancePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [activeRes, pastRes, userVotesRes] = await Promise.all([
    supabase.from('proposals')
      .select('*, author:profiles!proposals_author_id_fkey(username, display_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('proposals')
      .select('*, author:profiles!proposals_author_id_fkey(username, display_name)')
      .in('status', ['passed', 'rejected', 'expired'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('votes')
      .select('proposal_id, direction')
      .eq('user_id', user.id),
  ]);

  const userVoteMap = new Map(
    (userVotesRes.data || []).map(v => [v.proposal_id, v.direction])
  );

  return (
    <GovernanceView
      userId={user.id}
      activeProposals={activeRes.data || []}
      pastProposals={pastRes.data || []}
      userVotes={userVoteMap}
    />
  );
}
