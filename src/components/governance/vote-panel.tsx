'use client';

import { useState, useTransition, useEffect } from 'react';
import { castVote } from '@/lib/actions/governance';
import { createBrowserClient } from '@supabase/ssr';

interface VotePanelProps {
  proposalId: string;
  userId: string;
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  userVote?: 'for' | 'against' | 'abstain' | null;
  status: string;
  closesAt: string | null;
}

export function VotePanel({
  proposalId,
  userId,
  votesFor: initialFor,
  votesAgainst: initialAgainst,
  quorum,
  userVote: initialUserVote,
  status,
  closesAt,
}: VotePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votesFor, setVotesFor] = useState(initialFor);
  const [votesAgainst, setVotesAgainst] = useState(initialAgainst);

  const totalVotes = votesFor + votesAgainst;
  const forPercent = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 50;
  const quorumPercent = quorum > 0 ? Math.min(100, (totalVotes / quorum) * 100) : 100;
  const isActive = status === 'active';
  const isClosed = closesAt && new Date(closesAt) < new Date();

  // Real-time subscription for live vote counts
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const channel = supabase
      .channel(`votes-${proposalId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `proposal_id=eq.${proposalId}` },
        (payload) => {
          const vote = payload.new as { direction: string };
          if (vote.direction === 'for') setVotesFor(v => v + 1);
          if (vote.direction === 'against') setVotesAgainst(v => v + 1);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [proposalId]);

  async function handleVote(direction: 'for' | 'against' | 'abstain') {
    setError(null);
    startTransition(async () => {
      const result = await castVote({ proposal_id: proposalId, direction });
      if (result.error) {
        setError(result.error);
      } else {
        setUserVote(direction);
        if (direction === 'for') setVotesFor(v => v + 1);
        if (direction === 'against') setVotesAgainst(v => v + 1);
      }
    });
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">Vote</h3>

      {/* Vote progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-green-600 font-medium">For: {votesFor}</span>
          <span className="text-red-600 font-medium">Against: {votesAgainst}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${100 - forPercent}%` }}
          />
        </div>
      </div>

      {/* Quorum progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Quorum: {totalVotes}/{quorum}</span>
          <span>{Math.round(quorumPercent)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${quorumPercent}%` }}
          />
        </div>
        {quorumPercent < 100 && (
          <p className="text-xs text-muted-foreground mt-1">
            {quorum - totalVotes} more vote{quorum - totalVotes !== 1 ? 's' : ''} needed for quorum
          </p>
        )}
      </div>

      {/* Time remaining */}
      {closesAt && isActive && !isClosed && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
          getDaysLeft(closesAt) <= 1 ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
          getDaysLeft(closesAt) <= 3 ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
          'bg-gray-50 text-gray-600 dark:bg-harbor-800 dark:text-gray-400'
        }`}>
          <span className={`inline-block h-2 w-2 rounded-full ${
            getDaysLeft(closesAt) <= 1 ? 'bg-red-500 animate-pulse' :
            getDaysLeft(closesAt) <= 3 ? 'bg-orange-500' :
            'bg-gray-400'
          }`} />
          {getDaysLeft(closesAt) === 0 ? 'Closing today!' :
           getDaysLeft(closesAt) === 1 ? '1 day left — vote now!' :
           `${getDaysLeft(closesAt)} days left (closes ${new Date(closesAt).toLocaleDateString()})`}
        </div>
      )}

      {/* Vote buttons */}
      {isActive && !isClosed && !userVote && (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote('for')}
            disabled={isPending}
            className="flex-1 rounded-md bg-green-600 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-green-700"
          >
            Vote For
          </button>
          <button
            onClick={() => handleVote('against')}
            disabled={isPending}
            className="flex-1 rounded-md bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-red-700"
          >
            Vote Against
          </button>
          <button
            onClick={() => handleVote('abstain')}
            disabled={isPending}
            className="rounded-md border px-3 py-2.5 text-sm text-muted-foreground disabled:opacity-50"
          >
            Abstain
          </button>
        </div>
      )}

      {/* Already voted */}
      {userVote && (
        <div className={`rounded-md px-3 py-2 text-sm font-medium ${
          userVote === 'for' ? 'bg-green-100 text-green-700' :
          userVote === 'against' ? 'bg-red-100 text-red-700' :
          'bg-muted text-muted-foreground'
        }`}>
          You voted: {userVote}
        </div>
      )}

      {/* Closed */}
      {(isClosed || status !== 'active') && (
        <div className={`rounded-md px-3 py-2 text-sm font-medium ${
          status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {status === 'passed' ? '✓ Passed' : status === 'rejected' ? '✗ Rejected' : 'Voting closed'}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function getDaysLeft(closesAt: string): number {
  return Math.max(0, Math.ceil((new Date(closesAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}
