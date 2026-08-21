'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type GovTab = 'active' | 'create' | 'results';

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  voting_method: string;
  options: string[];
  quorum: number;
  ends_at: string;
  created_at: string;
  creator_id: string;
  profiles?: { display_name: string };
  vote_count?: number;
  results?: number[];
  userVote?: number | null;
}

const categoryIcons: Record<string, string> = {
  infrastructure: '🔧',
  safety: '🛡️',
  budget: '💰',
  program: '📋',
  policy: '⚖️',
  general: '📢',
};

export default function GovernPage() {
  const [tab, setTab] = useState<GovTab>('active');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pastProposals, setPastProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [options, setOptions] = useState(['Yes', 'No']);
  const [quorum, setQuorum] = useState('10');
  const [endsIn, setEndsIn] = useState('7');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadProposals();
  }, [user, supabase]);

  const loadProposals = async () => {
    const now = new Date().toISOString();

    // Active proposals
    const { data: active } = await supabase
      .from('proposals')
      .select('*, profiles!proposals_creator_id_fkey(display_name)')
      .eq('status', 'active')
      .gte('ends_at', now)
      .order('created_at', { ascending: false });

    // Past/completed proposals
    const { data: past } = await supabase
      .from('proposals')
      .select('*, profiles!proposals_creator_id_fkey(display_name)')
      .or(`status.neq.active,ends_at.lt.${now}`)
      .order('ends_at', { ascending: false })
      .limit(20);

    // Get vote counts and user's votes
    const enriched: Proposal[] = [];
    for (const p of active ?? []) {
      const { data: votes } = await supabase
        .from('proposal_votes')
        .select('choice')
        .eq('proposal_id', p.id);

      const results = (p.options as string[]).map((_, i) =>
        (votes ?? []).filter((v) => v.choice === i).length
      );

      let userVote: number | null = null;
      if (user) {
        const uv = (votes ?? []).find((v: any) => v.user_id === user.id);
        // Need separate query for user vote
        const { data: myVote } = await supabase
          .from('proposal_votes')
          .select('choice')
          .eq('proposal_id', p.id)
          .eq('user_id', user.id)
          .maybeSingle();
        userVote = myVote?.choice ?? null;
      }

      enriched.push({
        ...p,
        options: p.options as string[],
        vote_count: votes?.length ?? 0,
        results,
        userVote,
      });
    }

    setProposals(enriched);

    // Enrich past
    const enrichedPast: Proposal[] = [];
    for (const p of past ?? []) {
      const { data: votes } = await supabase
        .from('proposal_votes')
        .select('choice')
        .eq('proposal_id', p.id);

      const results = (p.options as string[]).map((_, i) =>
        (votes ?? []).filter((v) => v.choice === i).length
      );

      enrichedPast.push({
        ...p,
        options: p.options as string[],
        vote_count: votes?.length ?? 0,
        results,
        userVote: null,
      });
    }
    setPastProposals(enrichedPast);

    setLoading(false);
  };

  const handleVote = async (proposalId: string, choice: number) => {
    if (!user) return;
    setVoting(proposalId);

    await supabase.from('proposal_votes').insert({
      proposal_id: proposalId,
      user_id: user.id,
      choice,
    });

    // Award MLY for civic participation
    await supabase.from('mly_transactions').insert({
      to_id: user.id,
      amount: 3,
      type: 'earn',
      description: 'Voted on community proposal',
    });

    await loadProposals();
    setVoting(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(endsIn));

    await supabase.from('proposals').insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      options: options.filter((o) => o.trim()),
      quorum: parseInt(quorum) || 10,
      ends_at: endsAt.toISOString(),
      status: 'active',
    });

    setCreateSuccess(true);
    setTitle('');
    setDescription('');
    setOptions(['Yes', 'No']);
    setCreating(false);
    setTimeout(() => { setCreateSuccess(false); setTab('active'); loadProposals(); }, 2000);
  };

  const getWinner = (p: Proposal): string | null => {
    if (!p.results || p.results.every((r) => r === 0)) return null;
    const maxVotes = Math.max(...p.results);
    const winnerIdx = p.results.indexOf(maxVotes);
    return p.options[winnerIdx];
  };

  const getQuorumPercent = (p: Proposal): number => {
    return Math.min(100, Math.round(((p.vote_count ?? 0) / p.quorum) * 100));
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Community Governance</h1>
        <p className="text-xs text-gray-500 mt-0.5">Propose. Vote. Shape your city. Earn $MLY.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {([
          { key: 'active', label: `Active (${proposals.length})` },
          { key: 'create', label: '+ New' },
          { key: 'results', label: 'Results' },
        ] as { key: GovTab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={tab === t.key}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              tab === t.key
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Proposals */}
      {tab === 'active' && (
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="card skeleton h-32" />)
          ) : proposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">⚖️</p>
              <p className="text-gray-500">No active proposals.</p>
              <button onClick={() => setTab('create')} className="btn-teal mt-3 text-sm">
                Create the first one
              </button>
            </div>
          ) : (
            proposals.map((p) => (
              <div key={p.id} className="card space-y-3">
                {/* Header */}
                <div className="flex items-start gap-2">
                  <span className="text-lg">{categoryIcons[p.category] || '📢'}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      by {(p.profiles as any)?.display_name ?? 'Someone'} · ends {new Date(p.ends_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Quorum Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{p.vote_count} votes</span>
                    <span>Quorum: {p.quorum}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-harbor-800 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        getQuorumPercent(p) >= 100 ? 'bg-teal-500' : 'bg-harbor-400'
                      )}
                      style={{ width: `${getQuorumPercent(p)}%` }}
                    />
                  </div>
                </div>

                {/* Vote Buttons or Results */}
                {p.userVote !== null ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-teal-500 font-medium">✓ You voted: {p.options[p.userVote as number]}</p>
                    {p.options.map((opt, i) => {
                      const total = p.results?.reduce((a, b) => a + b, 0) || 1;
                      const pct = Math.round(((p.results?.[i] ?? 0) / total) * 100);
                      return (
                        <div key={i} className="relative">
                          <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-harbor-800 relative overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-teal-100 dark:bg-teal-900/30 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="relative font-medium">{opt}</span>
                            <span className="relative text-gray-500">{pct}% ({p.results?.[i] ?? 0})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {p.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleVote(p.id, i)}
                        disabled={voting === p.id}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                          i === 0 ? 'btn-teal' : 'btn-primary',
                          voting === p.id && 'opacity-50'
                        )}
                      >
                        {voting === p.id ? '...' : opt}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-gray-400 text-center">+3 $MLY for voting</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Proposal */}
      {tab === 'create' && (
        <form onSubmit={handleCreate} className="card space-y-4">
          {createSuccess && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 text-sm">
              ✓ Proposal published! The community can now vote.
            </div>
          )}

          <h2 className="font-medium text-harbor-800 dark:text-white">New Proposal</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field !py-2 text-sm"
              placeholder="e.g., Add speed bumps on Oak Street"
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field !py-2 text-sm resize-none h-24"
              placeholder="Explain what you're proposing and why it matters..."
              required
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field !py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="safety">Safety</option>
                <option value="budget">Budget</option>
                <option value="program">Program</option>
                <option value="policy">Policy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Voting period (days)</label>
              <input
                type="number"
                value={endsIn}
                onChange={(e) => setEndsIn(e.target.value)}
                className="input-field !py-2 text-sm"
                min="1"
                max="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Options (min 2)</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    className="input-field !py-2 text-sm flex-1"
                    placeholder={`Option ${i + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                      className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, ''])}
                  className="text-xs text-teal-500 font-medium"
                >
                  + Add option
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Quorum (min votes needed)</label>
            <input
              type="number"
              value={quorum}
              onChange={(e) => setQuorum(e.target.value)}
              className="input-field !py-2 text-sm"
              min="3"
              max="1000"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !title.trim() || !description.trim()}
            className="btn-teal w-full disabled:opacity-50"
          >
            {creating ? 'Publishing...' : 'Publish Proposal'}
          </button>
        </form>
      )}

      {/* Results */}
      {tab === 'results' && (
        <div className="space-y-4">
          {pastProposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-gray-500">No completed proposals yet.</p>
            </div>
          ) : (
            pastProposals.map((p) => {
              const winner = getWinner(p);
              const total = p.results?.reduce((a, b) => a + b, 0) || 0;

              return (
                <div key={p.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{p.title}</h3>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      total >= p.quorum ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {total >= p.quorum ? (winner ? `Passed: ${winner}` : 'Tied') : 'No quorum'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {p.options.map((opt, i) => {
                      const pct = total > 0 ? Math.round(((p.results?.[i] ?? 0) / total) * 100) : 0;
                      return (
                        <div key={i} className="relative">
                          <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-harbor-800 relative overflow-hidden">
                            <div
                              className={cn(
                                'absolute inset-y-0 left-0 transition-all',
                                winner === opt ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-harbor-700'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                            <span className="relative font-medium">{opt}</span>
                            <span className="relative text-gray-500">{pct}% ({p.results?.[i] ?? 0})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400">{total} total votes · Quorum: {p.quorum} · Ended {new Date(p.ends_at).toLocaleDateString()}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
