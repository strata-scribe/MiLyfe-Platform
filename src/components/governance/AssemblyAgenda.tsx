'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';

export interface Argument {
  id: string;
  author: string;
  content: string;
  type: 'pro' | 'con';
  weight: number;
  replies?: Argument[];
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  closesAt: string; // ISO date string
  arguments: Argument[];
}

interface AssemblyAgendaProps {
  proposal: Proposal;
  onVote: (vote: 'for' | 'against' | 'abstain') => void;
  onAddArgument: (content: string, type: 'pro' | 'con', parentId?: string) => void;
  onUpvoteArgument: (id: string) => void;
}

export function AssemblyAgenda({ proposal, onVote, onAddArgument, onUpvoteArgument }: AssemblyAgendaProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isClosed, setIsClosed] = useState(false);

  const [newArgContent, setNewArgContent] = useState('');
  const [newArgType, setNewArgType] = useState<'pro' | 'con'>('pro');

  useEffect(() => {
    const updateTimer = () => {
      const closingDate = new Date(proposal.closesAt);
      const now = new Date();
      if (now >= closingDate) {
        setIsClosed(true);
        setTimeLeft('Voting closed');
      } else {
        setIsClosed(false);
        setTimeLeft(formatDistanceToNow(closingDate) + ' remaining');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [proposal.closesAt]);

  // Calculate pros/cons weighting recursively
  const calculateWeight = (args: Argument[], type: 'pro' | 'con'): number => {
    return args.reduce((sum, arg) => {
      const selfWeight = arg.type === type ? arg.weight : 0;
      const childWeight = arg.replies ? calculateWeight(arg.replies, type) : 0;
      return sum + selfWeight + childWeight;
    }, 0);
  };

  const proWeight = calculateWeight(proposal.arguments, 'pro');
  const conWeight = calculateWeight(proposal.arguments, 'con');
  const totalWeight = proWeight + conWeight;
  const proPercentage = totalWeight > 0 ? (proWeight / totalWeight) * 100 : 50;

  const handleAddArgument = () => {
    if (newArgContent.trim()) {
      onAddArgument(newArgContent, newArgType);
      setNewArgContent('');
    }
  };

  return (
    <div className="space-y-6 rounded-lg border p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">{proposal.title}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{proposal.description}</p>
        </div>

        {/* Timeboxed Voting Status */}
        <div className="flex items-center justify-between rounded-md bg-muted p-3">
          <span className="text-sm font-medium">{timeLeft}</span>
          {!isClosed && (
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={() => onVote('for')}>Vote For</Button>
              <Button size="sm" variant="destructive" onClick={() => onVote('against')}>Vote Against</Button>
              <Button size="sm" variant="outline" onClick={() => onVote('abstain')}>Abstain</Button>
            </div>
          )}
        </div>

        {/* Pros/Cons Weighting Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">Pros Weight: {proWeight}</span>
            <span className="text-red-600 font-medium">Cons Weight: {conWeight}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-red-100 dark:bg-red-900/30">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${proPercentage}%` }}
            />
          </div>
        </div>

        {/* Arguments Tree */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Deliberation</h3>
          {proposal.arguments.map(arg => (
            <ArgumentNode
              key={arg.id}
              argument={arg}
              onAddReply={onAddArgument}
              onUpvote={onUpvoteArgument}
              isClosed={isClosed}
            />
          ))}
          {proposal.arguments.length === 0 && (
            <p className="text-sm text-gray-500">No arguments added yet. Be the first to start the deliberation.</p>
          )}
        </div>

        {/* Add Top-level Argument Form */}
        {!isClosed && (
          <div className="mt-4 rounded-md border p-4 bg-muted/50">
            <h4 className="mb-2 text-sm font-medium">Add your perspective</h4>
            <Textarea
              value={newArgContent}
              onChange={(e) => setNewArgContent(e.target.value)}
              placeholder="What are your thoughts?"
              className="mb-3"
            />
            <div className="flex items-center gap-3">
              <select
                value={newArgType}
                onChange={(e) => setNewArgType(e.target.value as 'pro' | 'con')}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-harbor-800"
              >
                <option value="pro">In Favor (Pro)</option>
                <option value="con">Against (Con)</option>
              </select>
              <Button onClick={handleAddArgument} disabled={!newArgContent.trim()}>
                Submit Argument
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for recursive arguments
interface ArgumentNodeProps {
  argument: Argument;
  onAddReply: (content: string, type: 'pro' | 'con', parentId?: string) => void;
  onUpvote: (id: string) => void;
  isClosed: boolean;
}

function ArgumentNode({ argument, onAddReply, onUpvote, isClosed }: ArgumentNodeProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyType, setReplyType] = useState<'pro' | 'con'>('pro');

  const handleReply = () => {
    if (replyContent.trim()) {
      onAddReply(replyContent, replyType, argument.id);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div className={cn(
      "rounded-lg border p-4",
      argument.type === 'pro' ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'
    )}>
      <div className="flex items-start justify-between">
        <div className="text-sm">
          <span className="font-semibold">{argument.author}</span>
          <span className="ml-2 text-xs uppercase text-gray-500">{argument.type}</span>
          <p className="mt-1">{argument.content}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Weight: {argument.weight}</span>
          {!isClosed && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => onUpvote(argument.id)}>
              Upvote
            </Button>
          )}
        </div>
      </div>

      {!isClosed && (
        <div className="mt-3">
          {isReplying ? (
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                 <select
                  value={replyType}
                  onChange={(e) => setReplyType(e.target.value as 'pro' | 'con')}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-harbor-800"
                >
                  <option value="pro">Pro</option>
                  <option value="con">Con</option>
                </select>
                <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>Submit</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => setIsReplying(true)}
            >
              Reply
            </button>
          )}
        </div>
      )}

      {/* Recursive Rendering of Replies */}
      {argument.replies && argument.replies.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {argument.replies.map(reply => (
            <ArgumentNode
              key={reply.id}
              argument={reply}
              onAddReply={onAddReply}
              onUpvote={onUpvote}
              isClosed={isClosed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
