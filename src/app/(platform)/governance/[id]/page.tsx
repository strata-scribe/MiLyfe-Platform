import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { VotePanel } from '@/components/governance/vote-panel';
import { CommentThread } from '@/components/governance/comment-thread';
import { VotingLedger } from '@/components/governance/voting-ledger';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data } = await supabase.from('proposals').select('title').eq('id', params.id).single();
  return { title: data?.title || 'Proposal' };
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, profiles!author_id(username, display_name, avatar_url)')
    .eq('id', params.id)
    .single();

  if (!proposal) notFound();

  // Get user's vote
  const { data: userVoteData } = await supabase
    .from('votes')
    .select('direction')
    .eq('proposal_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  // Get comments (from dedicated proposal_comments table)
  const { data: comments } = await supabase
    .from('proposal_comments')
    .select('*, profiles:author_id(username, display_name, avatar_url)')
    .eq('proposal_id', params.id)
    .order('created_at', { ascending: true });

  // Get all votes for public ledger
  const { data: allVotes } = await supabase
    .from('votes')
    .select('id, direction, created_at, profiles:user_id(display_name, username)')
    .eq('proposal_id', params.id)
    .order('created_at', { ascending: false });

  const author = (proposal as any).profiles;
  const categoryLabels: Record<string, string> = {
    general: 'General',
    treasury: 'Treasury',
    policy: 'Policy',
    amendment: 'Amendment',
    recall: 'Recall',
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Back */}
      <a href="/governance" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to Governance
      </a>

      {/* Proposal header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            proposal.status === 'active' ? 'bg-blue-100 text-blue-700' :
            proposal.status === 'passed' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {proposal.status}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {categoryLabels[proposal.category] || proposal.category}
          </span>
          {proposal.stage && (
            <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium capitalize">
              Stage: {proposal.stage.replace('_', ' ')}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold">{proposal.title}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>By {author?.display_name || author?.username || 'Unknown'}</span>
          <span>·</span>
          <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Proposal body (rendered HTML from Tiptap) */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-6"
        dangerouslySetInnerHTML={{ __html: proposal.body }}
      />

      {/* Vote panel */}
      <VotePanel
        proposalId={proposal.id}
        userId={user.id}
        votesFor={proposal.votes_for}
        votesAgainst={proposal.votes_against}
        quorum={proposal.quorum_required}
        userVote={userVoteData?.direction as any}
        status={proposal.status}
        closesAt={proposal.closes_at}
      />

      {/* Public voting ledger */}
      <VotingLedger votes={allVotes || []} />

      {/* Comments */}
      <CommentThread
        proposalId={proposal.id}
        comments={comments || []}
        userId={user.id}
      />
    </div>
  );
}
