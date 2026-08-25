'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Plus, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ProposalEditor } from '@/components/governance/proposal-editor';
import { castVote } from '@/lib/actions/governance';
import { executeWithOfflineFallback } from '@/lib/offline/action-wrapper';

interface Props {
  userId: string;
  activeProposals: any[];
  pastProposals: any[];
  userVotes: Map<string, string>;
}

export function GovernanceView({ userId, activeProposals, pastProposals, userVotes }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleVote(proposalId: string, direction: 'for' | 'against') {
    setVotingId(proposalId);
    startTransition(async () => {
      const result = await executeWithOfflineFallback(
        'voice.ballot',
        { proposal_id: proposalId, direction },
        () => castVote({ proposal_id: proposalId, direction }),
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.queued_offline ? 'Vote queued (offline)' : `Vote cast: ${direction}`);
        router.refresh();
      }
      setVotingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voice</h1>
          <p className="text-muted-foreground">Propose, discuss, vote</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Propose
        </button>
      </div>

      {/* Create Proposal (Tiptap editor modal) */}
      <ProposalEditor
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { router.refresh(); toast.success('Proposal submitted!'); }}
      />

      {/* Active Proposals */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Active Proposals ({activeProposals.length})
        </h2>

        {activeProposals.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-4xl">🗳️</p>
            <p className="mt-2 text-muted-foreground">No active proposals. Be the first to propose something.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProposals.map((proposal) => {
              const totalVotes = proposal.votes_for + proposal.votes_against;
              const forPercent = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 50;
              const hasVoted = userVotes.has(proposal.id);
              const userDirection = userVotes.get(proposal.id);
              const isVoting = votingId === proposal.id;

              return (
                <div key={proposal.id} className="rounded-lg border p-4">
                  {/* Header — clickable to detail page */}
                  <Link href={`/governance/${proposal.id}`} className="block group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {proposal.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          by {proposal.author?.display_name || proposal.author?.username || 'Member'} ·{' '}
                          {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        {proposal.category}
                      </span>
                    </div>

                    {/* Body preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {stripHtml(proposal.body).slice(0, 150)}
                    </p>
                  </Link>

                  {/* Vote progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600 font-medium">For: {proposal.votes_for}</span>
                      <span className="text-red-600 font-medium">Against: {proposal.votes_against}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${forPercent}%` }}
                      />
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${100 - forPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalVotes} / {proposal.quorum_required} quorum
                      {proposal.closes_at && (
                        <> · Closes {formatDistanceToNow(new Date(proposal.closes_at), { addSuffix: true })}</>
                      )}
                    </p>
                  </div>

                  {/* Vote buttons or status */}
                  {hasVoted ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      You voted <span className="font-medium capitalize">{userDirection}</span>
                      {' · '}
                      <Link href={`/governance/${proposal.id}`} className="text-primary hover:underline">
                        View discussion →
                      </Link>
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, 'for')}
                        disabled={isVoting || isPending}
                        className="flex-1 flex items-center justify-center gap-1 rounded-md border border-green-200 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'against')}
                        disabled={isVoting || isPending}
                        className="flex-1 flex items-center justify-center gap-1 rounded-md border border-red-200 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Against
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Proposals */}
      {pastProposals.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Past Proposals
          </h2>
          <div className="space-y-2">
            {pastProposals.map((p) => (
              <Link
                key={p.id}
                href={`/governance/${p.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.votes_for + p.votes_against} votes</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Strip HTML tags for preview text */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
