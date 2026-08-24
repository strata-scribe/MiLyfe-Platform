'use client';

import { useState } from 'react';
import { Landmark, ThumbsUp, ThumbsDown, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  userId: string;
  activeProposals: any[];
  pastProposals: any[];
  userVotes: Map<string, string>;
}

export function GovernanceView({ userId, activeProposals, pastProposals, userVotes }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function castVote(proposalId: string, direction: 'for' | 'against') {
    const supabase = createClient();
    const { error } = await supabase.from('votes').insert({
      proposal_id: proposalId,
      user_id: userId,
      direction,
    });

    if (error) {
      if (error.code === '23505') toast.error('You already voted on this proposal');
      else toast.error(error.message);
    } else {
      toast.success(`Vote cast: ${direction}`);
    }
  }

  async function createProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from('proposals').insert({
      author_id: userId,
      title: title.trim(),
      body: body.trim(),
      status: 'active',
      opens_at: new Date().toISOString(),
      closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Proposal created!');
      setTitle('');
      setBody('');
      setShowCreate(false);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Governance</h1>
          <p className="page-subtitle">Propose, discuss, vote</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          Propose
        </Button>
      </div>

      {/* Create proposal */}
      {showCreate && (
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader>
            <CardTitle>New Proposal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProposal} className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title"
                required
                maxLength={120}
                aria-label="Proposal title"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your proposal in detail..."
                required
                className="min-h-[120px]"
                aria-label="Proposal body"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active proposals */}
      <section aria-labelledby="active-proposals-heading">
        <h2 id="active-proposals-heading" className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Active Proposals ({activeProposals.length})
        </h2>

        {activeProposals.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No active proposals"
            description="Be the first to propose something for your community."
          />
        ) : (
          <div className="space-y-4">
            {activeProposals.map((proposal) => {
              const totalVotes = proposal.votes_for + proposal.votes_against;
              const forPercent = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 50;
              const hasVoted = userVotes.has(proposal.id);
              const userDirection = userVotes.get(proposal.id);

              return (
                <Card key={proposal.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar name={proposal.author?.display_name || 'U'} src={proposal.author?.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{proposal.title}</h3>
                        <p className="text-xs text-gray-500">
                          by @{proposal.author?.username} · {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="default" className="capitalize">{proposal.category}</Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{proposal.body}</p>

                    {/* Vote bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-600">For: {proposal.votes_for}</span>
                        <span className="text-red-500">Against: {proposal.votes_against}</span>
                      </div>
                      <div className="h-2 rounded-full bg-red-100 dark:bg-red-900/20 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${forPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalVotes} / {proposal.quorum_required} quorum
                      </p>
                    </div>

                    {/* Vote buttons */}
                    {hasVoted ? (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                        You voted <span className="font-medium capitalize">{userDirection}</span>
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => castVote(proposal.id, 'for')} className="flex-1">
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          For
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => castVote(proposal.id, 'against')} className="flex-1">
                          <ThumbsDown className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          Against
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Past proposals */}
      {pastProposals.length > 0 && (
        <section aria-labelledby="past-proposals-heading">
          <h2 id="past-proposals-heading" className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Past Proposals
          </h2>
          <div className="space-y-2">
            {pastProposals.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.votes_for + p.votes_against} votes</p>
                </div>
                <Badge
                  variant={p.status === 'passed' ? 'success' : 'destructive'}
                  className="capitalize shrink-0"
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
