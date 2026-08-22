'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { FeatureGate } from '@/components/ui/feature-gate';
import { format, formatDistanceToNow, differenceInSeconds, isPast } from 'date-fns';

type GovTab = 'active' | 'create' | 'results' | 'constitution';

interface Proposal {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'passed' | 'failed' | 'closed';
  voting_method: string;
  options: string[];
  quorum: number;
  ends_at: string;
  created_at: string;
  profiles?: { display_name: string };
}

interface Vote {
  id: string;
  proposal_id: string;
  user_id: string;
  choice: number;
  weight: number;
  created_at: string;
}

const categories = ['infrastructure', 'safety', 'budget', 'program', 'policy', 'general'] as const;

const categoryColors: Record<string, string> = {
  infrastructure: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  safety: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  budget: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  program: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  policy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const tabs: { key: GovTab; label: string; icon: string }[] = [
  { key: 'active', label: 'Active', icon: '🗳️' },
  { key: 'create', label: 'Create', icon: '✏️' },
  { key: 'results', label: 'Results', icon: '📊' },
  { key: 'constitution', label: 'Constitution', icon: '📜' },
];

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const seconds = differenceInSeconds(new Date(endsAt), new Date());
      if (seconds <= 0) {
        setTimeLeft('Ended');
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const mins = Math.floor((seconds % 3600) / 60);

      if (days > 0) setTimeLeft(`${days}d ${hours}h remaining`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m remaining`);
      else setTimeLeft(`${mins}m remaining`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = differenceInSeconds(new Date(endsAt), new Date()) < 86400;

  return (
    <span className={cn(
      'text-xs font-medium',
      timeLeft === 'Ended' ? 'text-gray-400' : isUrgent ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'
    )}>
      ⏱️ {timeLeft}
    </span>
  );
}

export default function GovernPage() {
  const [tab, setTab] = useState<GovTab>('active');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Create form state
  const [createStep, setCreateStep] = useState(1);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState<typeof categories[number]>('general');
  const [createOptions, setCreateOptions] = useState<string[]>(['Yes', 'No']);
  const [createDuration, setCreateDuration] = useState('7');
  const [createQuorum, setCreateQuorum] = useState('10');
  const [publishing, setPublishing] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: proposalData } = await supabase
      .from('proposals')
      .select('*, profiles!proposals_creator_id_fkey(display_name)')
      .order('created_at', { ascending: false });

    if (proposalData) setProposals(proposalData);

    const { data: voteData } = await supabase
      .from('proposal_votes')
      .select('*');

    if (voteData) setVotes(voteData);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const activeProposals = useMemo(
    () => proposals.filter((p) => p.status === 'active' && !isPast(new Date(p.ends_at))),
    [proposals]
  );

  const pastProposals = useMemo(
    () => proposals.filter((p) => p.status !== 'active' || isPast(new Date(p.ends_at))),
    [proposals]
  );

  const getVotesForProposal = (proposalId: string) =>
    votes.filter((v) => v.proposal_id === proposalId);

  const getUserVote = (proposalId: string) =>
    votes.find((v) => v.proposal_id === proposalId && v.user_id === user?.id);

  const handleVote = async (proposalId: string, choice: number) => {
    if (!user) return;
    setVotingId(proposalId);

    await supabase.from('proposal_votes').insert({
      proposal_id: proposalId,
      user_id: user.id,
      choice,
      weight: 1,
    });

    // Award MLY
    await supabase.from('mly_transactions').insert({
      user_id: user.id,
      amount: 3,
      type: 'vote_reward',
      description: 'Voted on a community proposal',
    });

    setVotingId(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAddOption = () => {
    if (createOptions.length >= 6) return;
    setCreateOptions([...createOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (createOptions.length <= 2) return;
    setCreateOptions(createOptions.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updated = [...createOptions];
    updated[index] = value;
    setCreateOptions(updated);
  };

  const handlePublish = async () => {
    if (!user || !createTitle.trim() || !createDesc.trim()) return;
    if (createOptions.some((o) => !o.trim())) return;
    setPublishing(true);

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(createDuration));

    await supabase.from('proposals').insert({
      creator_id: user.id,
      title: createTitle.trim(),
      description: createDesc.trim(),
      category: createCategory,
      status: 'active',
      voting_method: 'single_choice',
      options: createOptions.map((o) => o.trim()),
      quorum: parseInt(createQuorum),
      ends_at: endsAt.toISOString(),
    });

    // Award MLY for creating
    await supabase.from('mly_transactions').insert({
      user_id: user.id,
      amount: 5,
      type: 'proposal_reward',
      description: 'Created a community proposal',
    });

    // Reset form
    setCreateStep(1);
    setCreateTitle('');
    setCreateDesc('');
    setCreateCategory('general');
    setCreateOptions(['Yes', 'No']);
    setCreateDuration('7');
    setCreateQuorum('10');
    setPublishing(false);
    setRefreshKey((k) => k + 1);
    setTab('active');
  };

  const ProposalCard = ({ proposal, showResults }: { proposal: Proposal; showResults: boolean }) => {
    const proposalVotes = getVotesForProposal(proposal.id);
    const userVote = getUserVote(proposal.id);
    const totalVotes = proposalVotes.length;
    const isExpanded = expandedId === proposal.id;
    const quorumMet = totalVotes >= proposal.quorum;
    const quorumProgress = Math.min((totalVotes / proposal.quorum) * 100, 100);
    const hasEnded = isPast(new Date(proposal.ends_at));

    // Count votes per option
    const optionVotes = (proposal.options || []).map((_, idx) =>
      proposalVotes.filter((v) => v.choice === idx).length
    );

    const maxVotes = Math.max(...optionVotes, 1);
    const winnerIdx = optionVotes.indexOf(Math.max(...optionVotes));

    return (
      <div className="card space-y-3 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', categoryColors[proposal.category] || categoryColors.general)}>
                {proposal.category}
              </span>
              {!hasEnded && <CountdownTimer endsAt={proposal.ends_at} />}
              {hasEnded && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  quorumMet ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600'
                )}>
                  {quorumMet ? '✓ Quorum Met' : '✗ Quorum Not Met'}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-harbor-800 dark:text-white">{proposal.title}</h3>
          </div>
          {userVote && (
            <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
              ✓ Voted
            </span>
          )}
        </div>

        {/* Description */}
        <div>
          <p className={cn('text-sm text-gray-600 dark:text-gray-400', !isExpanded && 'line-clamp-2')}>
            {proposal.description}
          </p>
          {proposal.description.length > 120 && (
            <button
              onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
              className="text-xs text-teal-600 hover:underline mt-0.5"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>By {proposal.profiles?.display_name || 'Anonymous'}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}</span>
          <span>·</span>
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>

        {/* Quorum progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Quorum: {totalVotes}/{proposal.quorum}</span>
            <span className="text-gray-400">{Math.round(quorumProgress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                quorumMet ? 'bg-green-500' : 'bg-teal-500'
              )}
              style={{ width: `${quorumProgress}%` }}
            />
          </div>
        </div>

        {/* Voting options / Results */}
        {(showResults || userVote || hasEnded) ? (
          <div className="space-y-2">
            {(proposal.options || []).map((option, idx) => {
              const count = optionVotes[idx];
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isWinner = showResults && idx === winnerIdx && totalVotes > 0;
              const isUserChoice = userVote?.choice === idx;

              return (
                <div key={idx} className="relative">
                  <div className={cn(
                    'rounded-lg border p-2.5 relative overflow-hidden',
                    isWinner ? 'border-teal-300 dark:border-teal-700' : 'border-gray-200 dark:border-gray-700',
                    isUserChoice && 'ring-2 ring-teal-500/30'
                  )}>
                    {/* Background fill */}
                    <div
                      className={cn(
                        'absolute inset-0 transition-all duration-500 opacity-20',
                        isWinner ? 'bg-teal-500' : 'bg-gray-400'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isUserChoice && <span className="text-xs text-teal-600">✓</span>}
                        <span className={cn('text-sm font-medium', isWinner ? 'text-teal-700 dark:text-teal-400' : 'text-harbor-800 dark:text-white')}>
                          {option}
                        </span>
                        {isWinner && <span className="text-xs">👑</span>}
                      </div>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {(proposal.options || []).map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleVote(proposal.id, idx)}
                disabled={votingId === proposal.id}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-sm font-medium text-harbor-800 dark:text-white disabled:opacity-50"
              >
                {option}
              </button>
            ))}
            <p className="text-xs text-teal-600 dark:text-teal-400 text-center">
              💰 +$3 MLY for voting
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Governance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Your voice, your vote. Shape the community democratically.
          </p>
        </div>
        <Link href="/govern/delegate" className="btn-secondary text-xs !py-2 !px-3">
          🤝 Delegate
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all',
              tab === t.key
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <span className="hidden sm:inline">{t.icon} </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Proposals */}
      {tab === 'active' && (
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="card skeleton h-48" />)
          ) : activeProposals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🗳️</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No active proposals</p>
              <p className="text-xs text-gray-400 mt-1">
                <button onClick={() => setTab('create')} className="text-teal-500 hover:underline">Create one</button> to get the community involved.
              </p>
            </div>
          ) : (
            activeProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} showResults={false} />
            ))
          )}
        </div>
      )}

      {/* Create Proposal */}
      {tab === 'create' && (
        <div className="card space-y-5 animate-slide-up">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  createStep >= step
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                )}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={cn('w-8 h-0.5', createStep > step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700')} />
                )}
              </div>
            ))}
            <span className="text-xs text-gray-500 ml-2">
              Step {createStep} of 3
            </span>
          </div>

          {/* Step 1: Title + Description */}
          {createStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-harbor-800 dark:text-white">What do you propose?</h3>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="input-field"
                placeholder="Proposal title"
                maxLength={100}
              />
              <div>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="Describe your proposal in detail. What problem does it solve? How should it be implemented?"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{createDesc.length}/500</p>
              </div>
              <button
                onClick={() => setCreateStep(2)}
                disabled={!createTitle.trim() || !createDesc.trim()}
                className="btn-teal w-full disabled:opacity-50"
              >
                Next: Options →
              </button>
            </div>
          )}

          {/* Step 2: Category + Options */}
          {createStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-harbor-800 dark:text-white">Category & Options</h3>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCreateCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                        createCategory === cat
                          ? categoryColors[cat]
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Voting Options (min 2, max 6)
                </label>
                <div className="space-y-2">
                  {createOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateOption(idx, e.target.value)}
                        className="input-field flex-1"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {createOptions.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(idx)}
                          className="text-red-400 hover:text-red-600 text-lg px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {createOptions.length < 6 && (
                  <button
                    onClick={handleAddOption}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-2"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setCreateStep(1)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  ← Back
                </button>
                <button
                  onClick={() => setCreateStep(3)}
                  disabled={createOptions.some((o) => !o.trim())}
                  className="btn-teal flex-1 disabled:opacity-50"
                >
                  Next: Settings →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Duration + Quorum + Preview */}
          {createStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-harbor-800 dark:text-white">Settings & Preview</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={createDuration}
                    onChange={(e) => setCreateDuration(e.target.value)}
                    className="input-field"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quorum (votes needed)
                  </label>
                  <input
                    type="number"
                    value={createQuorum}
                    onChange={(e) => setCreateQuorum(e.target.value)}
                    className="input-field"
                    min="2"
                    max="100"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', categoryColors[createCategory])}>
                    {createCategory}
                  </span>
                  <span className="text-xs text-gray-400">{createDuration} day{parseInt(createDuration) !== 1 ? 's' : ''} · {createQuorum} votes needed</span>
                </div>
                <h4 className="text-sm font-bold text-harbor-800 dark:text-white">{createTitle}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{createDesc}</p>
                <div className="flex flex-wrap gap-1">
                  {createOptions.map((opt, i) => (
                    <span key={i} className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 flex items-center gap-2">
                <span className="text-lg">💰</span>
                <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                  You&apos;ll earn +$5 MLY for publishing this proposal.
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setCreateStep(2)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  ← Back
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="btn-teal flex-1"
                >
                  {publishing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    '🗳️ Publish Proposal'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {tab === 'results' && (
        <div className="space-y-4">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="card skeleton h-48" />)
          ) : pastProposals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📊</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No completed proposals yet</p>
              <p className="text-xs text-gray-400 mt-1">Results will appear here once voting ends.</p>
            </div>
          ) : (
            pastProposals.map((proposal) => {
              const proposalVotes = getVotesForProposal(proposal.id);
              const totalVotes = proposalVotes.length;
              const quorumMet = totalVotes >= proposal.quorum;

              return (
                <div key={proposal.id}>
                  <ProposalCard proposal={proposal} showResults={true} />
                  <div className="flex items-center gap-3 mt-2 px-1">
                    <span className={cn(
                      'text-xs font-medium',
                      quorumMet ? 'text-green-600' : 'text-red-500'
                    )}>
                      {quorumMet ? '✓ Passed' : '✗ Failed (no quorum)'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      Ended {formatDistanceToNow(new Date(proposal.ends_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Constitution Tab */}
      {tab === 'constitution' && (
        <div className="space-y-4">
          <a href="/constitution" className="card flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-harbor-800 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-harbor-800 text-2xl">📜</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-harbor-800 dark:text-white">MiLyfe Constitution</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                The founding document of our community. Read and propose amendments.
              </p>
            </div>
            <span className="text-gray-400 text-lg">→</span>
          </a>

          <a href="/constitution/policy" className="card flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center">
              <span className="text-white text-2xl">⚖️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-harbor-800 dark:text-white">Platform Policy</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Community rules, moderation guidelines, and enforcement procedures.
              </p>
            </div>
            <span className="text-gray-400 text-lg">→</span>
          </a>

          {/* Preview of first article */}
          <div className="card space-y-3 bg-gray-50 dark:bg-gray-800/50">
            <h4 className="text-sm font-bold text-harbor-800 dark:text-white">Article I — Purpose</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              MiLyfe exists to empower community members through democratic participation,
              mutual aid, and transparent governance. Every member has an equal voice in shaping
              the platform&apos;s direction and policies.
            </p>
            <a href="/constitution" className="text-xs text-teal-600 hover:underline">
              Read the full constitution →
            </a>
          </div>

          {/* Governance stats */}
          <div className="card space-y-2">
            <h4 className="text-sm font-bold text-harbor-800 dark:text-white">Governance Stats</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-harbor-800 dark:text-white">{proposals.length}</p>
                <p className="text-xs text-gray-500">Total Proposals</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-harbor-800 dark:text-white">{votes.length}</p>
                <p className="text-xs text-gray-500">Total Votes</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-harbor-800 dark:text-white">{activeProposals.length}</p>
                <p className="text-xs text-gray-500">Active Now</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
