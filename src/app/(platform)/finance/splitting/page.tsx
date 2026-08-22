'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface BillSplit {
  id: string;
  creator_id: string;
  title: string;
  total_amount: number;
  split_method: 'equal' | 'custom';
  status: 'active' | 'completed';
  created_at: string;
}

interface SplitMember {
  id: string;
  split_id: string;
  user_id: string;
  display_name: string;
  share_amount: number;
  paid: boolean;
  paid_at: string | null;
}

interface SearchResult {
  id: string;
  display_name: string;
}

type SplitTab = 'my-splits' | 'create';

export default function BillSplittingPage() {
  const [tab, setTab] = useState<SplitTab>('my-splits');
  const [splits, setSplits] = useState<BillSplit[]>([]);
  const [splitMembers, setSplitMembers] = useState<Record<string, SplitMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSplit, setExpandedSplit] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<{ id: string; name: string; customAmount: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadSplits(); }, []);

  async function loadSplits() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('bill_splits')
      .select('*')
      .or(`creator_id.eq.${user.id},id.in.(select split_id from split_members where user_id = '${user.id}')`)
      .order('created_at', { ascending: false });

    if (data) setSplits(data);
    setLoading(false);
  }

  async function loadSplitMembers(splitId: string) {
    if (expandedSplit === splitId) {
      setExpandedSplit(null);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from('split_members')
      .select('*, profiles(display_name)')
      .eq('split_id', splitId);

    if (data) {
      setSplitMembers(prev => ({
        ...prev,
        [splitId]: data.map((m: any) => ({ ...m, display_name: m.profiles?.display_name || 'Member' })),
      }));
    }
    setExpandedSplit(splitId);
  }

  async function searchMembers(query: string) {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', `%${query}%`)
      .neq('id', user?.id || '')
      .limit(5);
    if (data) setSearchResults(data);
    setSearching(false);
  }

  function addMember(member: SearchResult) {
    if (selectedMembers.find(m => m.id === member.id)) return;
    setSelectedMembers(prev => [...prev, { id: member.id, name: member.display_name, customAmount: '' }]);
    setSearchQuery('');
    setSearchResults([]);
  }

  function removeMember(id: string) {
    setSelectedMembers(prev => prev.filter(m => m.id !== id));
  }

  function updateCustomAmount(id: string, amount: string) {
    setSelectedMembers(prev => prev.map(m => m.id === id ? { ...m, customAmount: amount } : m));
  }

  async function createSplit() {
    if (!user || !title.trim() || !totalAmount || selectedMembers.length === 0) return;
    setCreating(true);
    const supabase = createClient();
    const total = parseFloat(totalAmount);
    const allMembers = [{ id: user.id, name: 'You', customAmount: '' }, ...selectedMembers];
    const memberCount = allMembers.length;

    const { data: splitData, error } = await supabase
      .from('bill_splits')
      .insert({
        creator_id: user.id,
        title: title.trim(),
        total_amount: total,
        split_method: splitMethod,
        status: 'active',
      })
      .select()
      .single();

    if (error || !splitData) {
      toast.error('Failed to create split');
      setCreating(false);
      return;
    }

    // Insert members
    const memberInserts = allMembers.map(member => {
      let share = total / memberCount;
      if (splitMethod === 'custom' && member.customAmount) {
        share = parseFloat(member.customAmount);
      }
      return {
        split_id: splitData.id,
        user_id: member.id,
        share_amount: share,
        paid: false,
      };
    });

    await supabase.from('split_members').insert(memberInserts);

    toast.success('Bill split created!');
    setTitle(''); setTotalAmount(''); setSelectedMembers([]);
    setTab('my-splits');
    loadSplits();
    setCreating(false);
  }

  async function payMyShare(splitId: string) {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('split_members')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('split_id', splitId)
      .eq('user_id', user.id);

    if (!error) {
      toast.success('Share paid!');
      // Check if all members paid
      const { data: remaining } = await supabase
        .from('split_members')
        .select('id')
        .eq('split_id', splitId)
        .eq('paid', false);
      if (remaining && remaining.length === 0) {
        await supabase.from('bill_splits').update({ status: 'completed' }).eq('id', splitId);
      }
      loadSplits();
      if (expandedSplit === splitId) loadSplitMembers(splitId);
    } else {
      toast.error('Payment failed');
    }
  }

  function getMyShareInfo(splitId: string): { amount: number; paid: boolean } | null {
    const members = splitMembers[splitId];
    if (!members || !user) return null;
    const me = members.find(m => m.user_id === user.id);
    return me ? { amount: me.share_amount, paid: me.paid } : null;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Bill Splitting</h1>
        <p className="text-xs text-gray-500">Split expenses fairly with community members</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['my-splits', 'create'] as SplitTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'my-splits' ? 'My Splits' : '+ Create Split'}
          </button>
        ))}
      </div>

      {/* My Splits */}
      {tab === 'my-splits' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            splits.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✂️</p>
                <p className="text-sm text-gray-500">No bill splits yet</p>
                <button onClick={() => setTab('create')} className="btn-teal text-xs mt-3">Create Your First Split</button>
              </div>
            ) : splits.map(split => (
              <div key={split.id} className="card space-y-2">
                <button onClick={() => loadSplitMembers(split.id)} className="w-full text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{split.title}</p>
                      <p className="text-[10px] text-gray-400">{new Date(split.created_at).toLocaleDateString()} · {split.split_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-harbor-800 dark:text-white">${split.total_amount}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded',
                        split.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      )}>{split.status}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded member details */}
                {expandedSplit === split.id && splitMembers[split.id] && (
                  <div className="pt-2 border-t border-gray-100 dark:border-harbor-800 space-y-1.5">
                    {splitMembers[split.id].map(member => (
                      <div key={member.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {member.paid ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-gray-300">○</span>
                          )}
                          <span className={cn(member.paid ? 'text-gray-400' : 'text-harbor-800 dark:text-white')}>{member.display_name}</span>
                        </div>
                        <span className={cn(member.paid ? 'text-green-600' : 'text-harbor-800 dark:text-white')}>
                          ${member.share_amount.toFixed(2)} {member.paid && '✓'}
                        </span>
                      </div>
                    ))}
                    {/* Pay my share */}
                    {user && splitMembers[split.id].find(m => m.user_id === user.id && !m.paid) && (
                      <button onClick={() => payMyShare(split.id)} className="btn-teal w-full text-xs mt-2">
                        Pay My Share (${splitMembers[split.id].find(m => m.user_id === user.id)?.share_amount.toFixed(2)})
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* Create Split */}
      {tab === 'create' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to create a split</p>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create a Bill Split</h3>

              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's this for? (dinner, rent, trip...)" className="input-field" />
              <input value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Total amount ($MLY)" className="input-field" type="number" />

              <div className="flex gap-2">
                <button onClick={() => setSplitMethod('equal')} className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-all', splitMethod === 'equal' ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' : 'border-gray-200 dark:border-harbor-700 text-gray-500')}>
                  Equal Split
                </button>
                <button onClick={() => setSplitMethod('custom')} className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-all', splitMethod === 'custom' ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' : 'border-gray-200 dark:border-harbor-700 text-gray-500')}>
                  Custom Amounts
                </button>
              </div>

              {/* Member Search */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Add Members</label>
                <input value={searchQuery} onChange={e => searchMembers(e.target.value)} placeholder="Search by name..." className="input-field" />
                {searching && <p className="text-[10px] text-gray-400">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 dark:border-harbor-700 rounded-lg overflow-hidden">
                    {searchResults.map(result => (
                      <button key={result.id} onClick={() => addMember(result)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-harbor-800 border-b border-gray-100 dark:border-harbor-800 last:border-0 text-harbor-800 dark:text-white">
                        + {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">Split between you + {selectedMembers.length} {selectedMembers.length === 1 ? 'person' : 'people'}</p>
                  {totalAmount && splitMethod === 'equal' && (
                    <p className="text-xs text-teal-600">${(parseFloat(totalAmount) / (selectedMembers.length + 1)).toFixed(2)} each</p>
                  )}
                  {selectedMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <span className="text-xs text-harbor-800 dark:text-white flex-1">{member.name}</span>
                      {splitMethod === 'custom' && (
                        <input value={member.customAmount} onChange={e => updateCustomAmount(member.id, e.target.value)} placeholder="$" className="input-field w-20 text-xs" type="number" />
                      )}
                      <button onClick={() => removeMember(member.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={createSplit} disabled={!title.trim() || !totalAmount || selectedMembers.length === 0 || creating} className="btn-teal w-full disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Split'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
