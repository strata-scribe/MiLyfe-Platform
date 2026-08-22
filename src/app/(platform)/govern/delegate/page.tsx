'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Delegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  category: string | null; // null = all categories
  weight: number;
  active: boolean;
  created_at: string;
  delegate_name?: string;
  delegator_name?: string;
}

interface CommunityMember {
  id: string;
  display_name: string;
  email: string;
  vote_count: number;
}

const CATEGORIES = ['all', 'infrastructure', 'safety', 'budget', 'program', 'policy', 'general'] as const;

export default function DelegatePage() {
  const [tab, setTab] = useState<'my-delegates' | 'delegated-to-me' | 'delegate'>('my-delegates');
  const [myDelegations, setMyDelegations] = useState<Delegation[]>([]);
  const [delegatedToMe, setDelegatedToMe] = useState<Delegation[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delegation form
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [delegating, setDelegating] = useState(false);
  const [success, setSuccess] = useState(false);

  const { user } = useAppStore();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    // My delegations (I delegated to someone)
    const { data: myDel } = await supabase
      .from('vote_delegations')
      .select('*, delegate:profiles!vote_delegations_delegate_id_fkey(display_name)')
      .eq('delegator_id', user!.id)
      .eq('active', true);

    if (myDel) {
      setMyDelegations(
        myDel.map((d: any) => ({
          ...d,
          delegate_name: d.delegate?.display_name || 'Unknown',
        }))
      );
    }

    // Delegated to me
    const { data: toMe } = await supabase
      .from('vote_delegations')
      .select('*, delegator:profiles!vote_delegations_delegator_id_fkey(display_name)')
      .eq('delegate_id', user!.id)
      .eq('active', true);

    if (toMe) {
      setDelegatedToMe(
        toMe.map((d: any) => ({
          ...d,
          delegator_name: d.delegator?.display_name || 'Unknown',
        }))
      );
    }

    // Load community members for search
    const { data: memberData } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .neq('id', user!.id)
      .limit(50);

    if (memberData) {
      setMembers(memberData.map((m: any) => ({ ...m, vote_count: 0 })));
    }

    setLoading(false);
  }

  async function handleDelegate() {
    if (!user || !selectedMember) return;
    setDelegating(true);

    const supabase = createClient();

    // Check for existing delegation in same category
    const category = selectedCategory === 'all' ? null : selectedCategory;

    const { data: existing } = await supabase
      .from('vote_delegations')
      .select('id')
      .eq('delegator_id', user.id)
      .eq('active', true)
      .is('category', category);

    if (existing && existing.length > 0) {
      // Revoke existing delegation for this category
      await supabase
        .from('vote_delegations')
        .update({ active: false })
        .eq('delegator_id', user.id)
        .eq('active', true)
        .is('category', category);
    }

    // Create new delegation
    await supabase.from('vote_delegations').insert({
      delegator_id: user.id,
      delegate_id: selectedMember.id,
      category: category,
      weight: 1,
      active: true,
    });

    setSuccess(true);
    setSelectedMember(null);
    setSelectedCategory('all');
    setTimeout(() => setSuccess(false), 3000);
    setDelegating(false);
    loadData();
  }

  async function revokeDelegation(delegationId: string) {
    const supabase = createClient();
    await supabase
      .from('vote_delegations')
      .update({ active: false })
      .eq('id', delegationId);
    loadData();
  }

  const filteredMembers = searchQuery
    ? members.filter(
        (m) =>
          m.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members.slice(0, 10);

  const totalDelegatedWeight = delegatedToMe.reduce((sum, d) => sum + d.weight, 0);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Sign in to manage vote delegation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Vote Delegation</h1>
          <p className="text-xs text-gray-500">
            Delegate your voting power to trusted community members.
          </p>
        </div>
        <Link href="/govern" className="text-xs text-teal-600 hover:underline">
          ← Back to Governance
        </Link>
      </div>

      {/* Info card */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>How delegation works:</strong> When you delegate to someone, they vote on your
          behalf for proposals you miss. You can delegate by category or for all votes. You can
          revoke at any time, and voting yourself always overrides delegation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'my-delegates', label: 'My Delegates' },
          { key: 'delegated-to-me', label: `Delegated to Me (${delegatedToMe.length})` },
          { key: 'delegate', label: '+ Delegate' },
        ] as { key: typeof tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              tab === t.key
                ? 'bg-harbor-800 text-white dark:bg-teal-500'
                : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* My Delegates */}
      {tab === 'my-delegates' && (
        <div className="space-y-3">
          {loading ? (
            <div className="card skeleton h-32" />
          ) : myDelegations.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-sm text-gray-500">You haven&apos;t delegated to anyone yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Delegate your vote to someone you trust when you can&apos;t participate.
              </p>
              <button
                onClick={() => setTab('delegate')}
                className="btn-teal mt-3 text-xs"
              >
                + Delegate Now
              </button>
            </div>
          ) : (
            myDelegations.map((d) => (
              <div key={d.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-400">
                    {d.delegate_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">
                      {d.delegate_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.category ? `Category: ${d.category}` : 'All categories'} · Weight: {d.weight}x
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeDelegation(d.id)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delegated to Me */}
      {tab === 'delegated-to-me' && (
        <div className="space-y-3">
          {/* Power summary */}
          <div className="card bg-gradient-to-r from-teal-500 to-harbor-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Your Voting Power</p>
                <p className="text-2xl font-bold">{1 + totalDelegatedWeight}x</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Delegators</p>
                <p className="text-2xl font-bold">{delegatedToMe.length}</p>
              </div>
            </div>
            <p className="text-xs opacity-80 mt-2">
              Your base vote (1) + {totalDelegatedWeight} delegated votes
            </p>
          </div>

          {delegatedToMe.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No one has delegated to you yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Be active in governance to earn community trust.
              </p>
            </div>
          ) : (
            delegatedToMe.map((d) => (
              <div key={d.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-400">
                  {d.delegator_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">
                    {d.delegator_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {d.category ? `Category: ${d.category}` : 'All categories'} · +{d.weight} vote weight
                  </p>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delegate Form */}
      {tab === 'delegate' && (
        <div className="space-y-4">
          {success && (
            <div className="card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-center py-3">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                ✓ Delegation set successfully!
              </p>
            </div>
          )}

          {/* Search for delegate */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
              Choose a Delegate
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field"
            />

            {/* Member list */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                    selectedMember?.id === m.id
                      ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700'
                      : 'hover:bg-gray-50 dark:hover:bg-harbor-800'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-harbor-700 flex items-center justify-center text-xs font-bold">
                    {m.display_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                      {m.display_name || m.email}
                    </p>
                  </div>
                  {selectedMember?.id === m.id && (
                    <span className="text-teal-600 text-sm">✓</span>
                  )}
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No members found</p>
              )}
            </div>
          </div>

          {/* Category selector */}
          {selectedMember && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
                Delegation Scope
              </h3>
              <p className="text-xs text-gray-500">
                Choose which proposal categories to delegate, or delegate all.
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                      selectedCategory === cat
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {cat === 'all' ? '🌐 All Categories' : cat}
                  </button>
                ))}
              </div>

              {/* Confirmation */}
              <div className="bg-gray-50 dark:bg-harbor-800/50 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Delegating to:</strong> {selectedMember.display_name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Scope:</strong>{' '}
                  {selectedCategory === 'all'
                    ? 'All proposal categories'
                    : `Only "${selectedCategory}" proposals`}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  You can revoke this anytime. Voting yourself overrides delegation.
                </p>
              </div>

              <button
                onClick={handleDelegate}
                disabled={delegating}
                className="btn-teal w-full"
              >
                {delegating ? 'Delegating...' : '🤝 Confirm Delegation'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
