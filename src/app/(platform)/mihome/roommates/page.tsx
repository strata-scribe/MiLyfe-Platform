'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Roommate {
  id: string;
  home_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: 'owner' | 'tenant' | 'guest';
  move_in_date: string;
  rent_share: number;
}

interface Expense {
  id: string;
  home_id: string;
  paid_by: string;
  description: string;
  amount: number;
  category: string;
  split_type: 'equal' | 'custom' | 'percentage';
  splits: { user_id: string; amount: number; paid: boolean }[];
  created_at: string;
  payer_name?: string;
}

interface HouseRule {
  id: string;
  home_id: string;
  rule: string;
  category: string;
  created_by: string;
  votes_for: number;
  votes_against: number;
}

type RoommateTab = 'overview' | 'expenses' | 'rules' | 'schedule';

export default function RoommatesPage() {
  const [tab, setTab] = useState<RoommateTab>('overview');
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Utilities');

  // Rule form
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleText, setRuleText] = useState('');
  const [ruleCategory, setRuleCategory] = useState('General');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: r } = await supabase.from('mihome_roommates').select('*');
    if (r) setRoommates(r);
    const { data: e } = await supabase.from('mihome_expenses').select('*').order('created_at', { ascending: false }).limit(20);
    if (e) setExpenses(e);
    const { data: ru } = await supabase.from('mihome_rules').select('*').order('votes_for', { ascending: false });
    if (ru) setRules(ru);
    setLoading(false);
  }

  async function addExpense() {
    if (!user || !expDesc.trim() || !expAmount) return;
    const supabase = createClient();
    const amount = parseFloat(expAmount);
    const splitAmount = roommates.length > 0 ? amount / roommates.length : amount;
    const splits = roommates.map(r => ({ user_id: r.user_id, amount: splitAmount, paid: r.user_id === user.id }));
    await supabase.from('mihome_expenses').insert({
      home_id: null, paid_by: user.id, description: expDesc.trim(),
      amount, category: expCategory, split_type: 'equal', splits,
      payer_name: user.display_name,
    });
    setExpDesc(''); setExpAmount(''); setShowAddExpense(false); loadData();
  }

  async function addRule() {
    if (!user || !ruleText.trim()) return;
    const supabase = createClient();
    await supabase.from('mihome_rules').insert({
      home_id: null, rule: ruleText.trim(), category: ruleCategory,
      created_by: user.id, votes_for: 1, votes_against: 0,
    });
    setRuleText(''); setShowAddRule(false); loadData();
  }

  async function voteRule(ruleId: string, direction: 'for' | 'against') {
    const supabase = createClient();
    const field = direction === 'for' ? 'votes_for' : 'votes_against';
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    await supabase.from('mihome_rules').update({ [field]: rule[field === 'votes_for' ? 'votes_for' : 'votes_against'] + 1 }).eq('id', ruleId);
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: (r as any)[field] + 1 } : r));
  }

  const totalOwed = expenses.reduce((sum, e) => {
    const myShare = e.splits?.find(s => s.user_id === user?.id && !s.paid);
    return sum + (myShare?.amount || 0);
  }, 0);

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Roommates</h1>
        <p className="text-xs text-gray-500">{roommates.length} household member{roommates.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Balance Summary */}
      {totalOwed > 0 && (
        <div className="card bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-orange-700 dark:text-orange-400">You owe</p>
          <p className="text-lg font-bold text-orange-700 dark:text-orange-400">${totalOwed.toFixed(2)} MLY</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['overview', 'expenses', 'rules', 'schedule'] as RoommateTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-16" />) :
            roommates.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">👥</p>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">No roommates yet</p>
                <p className="text-xs text-gray-500 mt-1">Invite your household members to coordinate together</p>
                <button className="btn-teal text-xs mt-4">Invite Roommate</button>
              </div>
            ) : roommates.map(rm => (
              <div key={rm.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <span className="text-sm">{rm.display_name?.charAt(0) || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{rm.display_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{rm.role} · Since {new Date(rm.move_in_date).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-mly-600 font-bold">${rm.rent_share}/mo</p>
              </div>
            ))
          }
        </div>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          {!showAddExpense ? (
            <button onClick={() => setShowAddExpense(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ Add Expense</button>
          ) : (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="What's the expense?" className="input-field" />
              <div className="flex gap-2">
                <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount ($MLY)" className="input-field flex-1" type="number" />
                <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="input-field w-auto">
                  {['Utilities', 'Groceries', 'Rent', 'Cleaning', 'Internet', 'Fun', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-500">Split equally among {roommates.length || 1} members</p>
              <div className="flex gap-2">
                <button onClick={addExpense} disabled={!expDesc.trim() || !expAmount} className="btn-teal flex-1 disabled:opacity-50">Add</button>
                <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {expenses.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-gray-500">No expenses recorded yet</p>
            </div>
          ) : expenses.map(exp => (
            <div key={exp.id} className="card flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{exp.description}</p>
                <p className="text-xs text-gray-500">{exp.payer_name || 'Unknown'} paid · {exp.category} · {new Date(exp.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-harbor-800 dark:text-white">${exp.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rules */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {!showAddRule ? (
            <button onClick={() => setShowAddRule(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ Propose Rule</button>
          ) : (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <input value={ruleText} onChange={e => setRuleText(e.target.value)} placeholder="Propose a house rule..." className="input-field" />
              <select value={ruleCategory} onChange={e => setRuleCategory(e.target.value)} className="input-field">
                {['General', 'Quiet Hours', 'Guests', 'Kitchen', 'Bathroom', 'Shared Spaces', 'Pets'].map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={addRule} disabled={!ruleText.trim()} className="btn-teal flex-1 disabled:opacity-50">Propose</button>
                <button onClick={() => setShowAddRule(false)} className="px-4 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {rules.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-gray-500">No house rules yet. Propose the first one!</p>
            </div>
          ) : rules.map(rule => (
            <div key={rule.id} className="card">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 uppercase">{rule.category}</span>
                  <p className="text-sm text-harbor-800 dark:text-white mt-0.5">{rule.rule}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => voteRule(rule.id, 'for')} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">👍 {rule.votes_for}</button>
                <button onClick={() => voteRule(rule.id, 'against')} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700">👎 {rule.votes_against}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          <div className="card text-center py-8">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Shared Calendar</p>
            <p className="text-xs text-gray-500 mt-1">Coordinate quiet hours, guests, and shared space usage</p>
          </div>
          {['Quiet Hours', 'Shared Laundry', 'Kitchen Cleanup', 'Trash Duty'].map((item, i) => (
            <div key={item} className="card flex items-center gap-3">
              <span className="text-xl">{['🤫', '👕', '🍳', '🗑️'][i]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{item}</p>
                <p className="text-xs text-gray-500">Schedule not set</p>
              </div>
              <button className="text-xs text-teal-600">Set up →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
