'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Users, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Vote {
  id: string;
  direction: 'for' | 'against';
  created_at: string;
  profiles: {
    display_name: string | null;
    username: string | null;
  } | { display_name: string | null; username: string | null }[] | null;
}

interface Props {
  votes: Vote[];
}

export function VotingLedger({ votes }: Props) {
  const [expanded, setExpanded] = useState(false);
  const displayVotes = expanded ? votes : votes.slice(0, 10);
  const hasMore = votes.length > 10;

  const forCount = votes.filter(v => v.direction === 'for').length;
  const againstCount = votes.filter(v => v.direction === 'against').length;

  if (votes.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-harbor-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-harbor-800 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-500" aria-hidden="true" />
            Public Voting Record
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              {forCount}
            </span>
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
              <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
              {againstCount}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          All votes are public — this is a democracy.
        </p>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-harbor-800">
        {displayVotes.map((vote) => (
          <div key={vote.id} className="flex items-center gap-3 px-5 py-3">
            <div className={`rounded-full p-1.5 ${
              vote.direction === 'for'
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              {vote.direction === 'for' ? (
                <ThumbsUp className="h-3 w-3 text-green-600 dark:text-green-400" aria-hidden="true" />
              ) : (
                <ThumbsDown className="h-3 w-3 text-red-500 dark:text-red-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                {(() => {
                  const p = Array.isArray(vote.profiles) ? vote.profiles[0] : vote.profiles;
                  return p?.display_name || p?.username || 'Anonymous Citizen';
                })()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-medium ${
                vote.direction === 'for' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {vote.direction === 'for' ? 'For' : 'Against'}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true }).replace('about ', '')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1 px-5 py-3 text-sm text-teal-600 dark:text-teal-400 hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors border-t border-gray-100 dark:border-harbor-800"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
          Show all {votes.length} votes
        </button>
      )}
    </div>
  );
}
