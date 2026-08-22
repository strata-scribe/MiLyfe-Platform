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
  category: string;
  split_type: 'equal' | 'custom' | 'percentage';
  members: { user_id: string; name: string; amount: number; paid: boolean }[];
  status: 'active' | 'settled';
  created_at: string;
}

type SplitTab = 'active' | 'settled' | 'create';

const CATEGORIES = ['Rent', 'Utilities', 'Groceries', 'Dining', 'Trip', 'Event', 'Subscription', 'Other'];

export default function BillSplittingPage() {
  const [tab, setTab] = useState<SplitTab>('active');
  const [splits, setSplits] = useState<BillSplit[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [memberNames, setMemberNames] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadSplits(); }, []);

  async function loadSplits() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('finance_splits').select('*').order('created_at', { ascending: false });
    if (data) setSplits(data);
    setLoading(false);
  }

  async function createSplit() {
    if (!user || !title.trim() || !amount) return;
    setCreating(true);
    const supabase = createClient();
    const names = memberNames.split(',').map(n => n.trim()).filter(Boolean);
    const total = parseFloat(amount);
    const perPerson = Math.round((total / (names.length + 1)) * 100) / 100;
    const members = [
      { user_id: user.id, name: user.display_name, amount: perPerson, paid: true },
      ...names.map(n => ({ user_id: '', name: n, amount: perPerson, paid: false })),
    ];
    await supabase.from('finance_splits').insert({
      creator_id: user.id, title: title.trim(), total_amount: total,
      category, split_type: 'equal', members, status: 'active',
    });
    setTitle(''); setAmount(''); setMemberNames(''); setCreating(false);
    toast.success('Bill split created!');
    setTab('active'); loadSplits();
  }

  async function markPaid(splitId: string, memberIndex: number) {
    const supabase = createClient();
    const split = splits.find(s => s.id === splitId);
    if (!split) return;
    const updated = [...split.members];
    updated[memberIndex].paid = true;
    const allPaid = updated.every(m => m.paid);
    await supabase.from('finance_splits').update({ members: updated, status: allPaid ? 'settled' : 'active' }).eq('id', splitId);
    toast.success('Marked as paid');
    loadSplits();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Bill Splitting</h1>
        <p className="text-xs text-gray-500">Split expenses fairly, track who owes what</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['active', 'settled', 'create'] as SplitTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'create' ? '+ New Split' : t}</button>
        ))}
      </div>

      {tab === 'active' && (
        <div className="space-y-3">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-28" />) :
            splits.filter(s => s.status === 'active').length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✂️</p>
                <p className="text-sm text-gray-500">No active splits</p>
              </div>
            ) : splits.filter(s => s.status === 'active').map(split => (
              <div key={split.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{split.title}</p>
                    <p className="text-xs text-gray-500">{split.category} · ${split.total_amount} total</p>
                  </div>
                  <p className="text-sm font-bold text-mly-600">${split.total_amount} MLY</p>
                </div>
                <div className="space-y-1.5">
                  {split.members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', m.paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {m.paid ? '✓' : '·'}
                        </span>
                        <span className="text-xs text-harbor-800 dark:text-white">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">${m.amount}</span>
                        {!m.paid && (
                          <button onClick={() => markPaid(split.id, i)} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">Paid</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(split.members.filter(m => m.paid).length / split.members.length) * 100}%` }} />
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'settled' && (
        <div className="space-y-2">
          {splits.filter(s => s.status === 'settled').length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No settled splits yet</p></div>
          ) : splits.filter(s => s.status === 'settled').map(split => (
            <div key={split.id} className="card flex items-center gap-3 opacity-75">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <p className="text-sm text-harbor-800 dark:text-white">{split.title}</p>
                <p className="text-xs text-gray-500">${split.total_amount} · {split.members.length} people</p>
              </div>
              <p className="text-xs text-green-600">Settled</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'create' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Bill Split</h3>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's the expense?" className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Total ($MLY)" className="input-field" type="number" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input value={memberNames} onChange={e => setMemberNames(e.target.value)} placeholder="People to split with (comma separated names)" className="input-field" />
          {amount && memberNames && (
            <p className="text-xs text-gray-500">Each person pays: <strong className="text-mly-600">${(parseFloat(amount || '0') / (memberNames.split(',').filter(Boolean).length + 1)).toFixed(2)} MLY</strong></p>
          )}
          <button onClick={createSplit} disabled={!title.trim() || !amount || !memberNames.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Split'}
          </button>
        </div>
      )}
    </div>
  );
}
