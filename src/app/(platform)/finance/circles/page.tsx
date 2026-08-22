'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface SavingsCircle {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  contribution_amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  max_members: number;
  current_members: number;
  total_pool: number;
  current_round: number;
  status: 'forming' | 'active' | 'completed';
  next_payout_date: string | null;
  created_at: string;
}

type CircleTab = 'browse' | 'my' | 'create';

export default function SavingsCirclesPage() {
  const [tab, setTab] = useState<CircleTab>('browse');
  const [circles, setCircles] = useState<SavingsCircle[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<SavingsCircle['frequency']>('monthly');
  const [maxMembers, setMaxMembers] = useState('10');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadCircles(); }, []);

  async function loadCircles() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('finance_circles').select('*').order('created_at', { ascending: false });
    if (data) setCircles(data);
    setLoading(false);
  }

  async function createCircle() {
    if (!user || !name.trim() || !amount) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('finance_circles').insert({
      creator_id: user.id, name: name.trim(), description: desc.trim(),
      contribution_amount: parseFloat(amount), frequency, max_members: parseInt(maxMembers),
      current_members: 1, total_pool: 0, current_round: 0, status: 'forming',
    });
    setName(''); setDesc(''); setAmount(''); setCreating(false);
    toast.success('Savings circle created!');
    setTab('browse'); loadCircles();
  }

  async function joinCircle(circleId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('finance_circle_members').insert({ circle_id: circleId, user_id: user.id, position: 0 });
    const circle = circles.find(c => c.id === circleId);
    if (circle) {
      await supabase.from('finance_circles').update({ current_members: circle.current_members + 1 }).eq('id', circleId);
    }
    toast.success('Joined circle!');
    loadCircles();
  }

  const FREQ_LABELS: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly' };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Savings Circles</h1>
        <p className="text-xs text-gray-500">Tandas — everyone contributes, everyone gets paid out in rotation</p>
      </div>

      {/* How it works */}
      <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
        <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mb-1">How it works:</p>
        <p className="text-xs text-teal-600 dark:text-teal-300 leading-relaxed">
          10 people each put in $100/month. Each month, one person gets $1000. After 10 months, everyone has received a payout. Zero interest. Zero fees. Community trust.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['browse', 'my', 'create'] as CircleTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'my' ? 'My Circles' : t === 'create' ? '+ Create' : t}</button>
        ))}
      </div>

      {/* Browse */}
      {tab === 'browse' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            circles.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🫂</p>
                <p className="text-sm text-gray-500">No circles yet — start one!</p>
              </div>
            ) : circles.map(circle => (
              <div key={circle.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{circle.name}</p>
                    <p className="text-xs text-gray-500">{circle.description}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize',
                    circle.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    circle.status === 'forming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-600'
                  )}>{circle.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>${circle.contribution_amount} MLY / {circle.frequency}</span>
                  <span>·</span>
                  <span>{circle.current_members}/{circle.max_members} members</span>
                  <span>·</span>
                  <span>Pool: ${circle.total_pool} MLY</span>
                </div>
                {/* Progress */}
                <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(circle.current_members / circle.max_members) * 100}%` }} />
                </div>
                {circle.status === 'forming' && user && (
                  <button onClick={() => joinCircle(circle.id)} className="btn-teal text-xs w-full">Join Circle</button>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* My Circles */}
      {tab === 'my' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">🫂</p>
          <p className="text-sm text-gray-500">{user ? 'Your circles will appear here' : 'Sign in to see your circles'}</p>
        </div>
      )}

      {/* Create */}
      {tab === 'create' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Start a Savings Circle</h3>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Circle name" className="input-field" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description — what's this circle for?" className="input-field resize-none" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contribution ($MLY)" className="input-field" type="number" />
            <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="input-field">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <input value={maxMembers} onChange={e => setMaxMembers(e.target.value)} placeholder="Max members" className="input-field" type="number" />
          <button onClick={createCircle} disabled={!name.trim() || !amount || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Circle'}
          </button>
        </div>
      )}
    </div>
  );
}
