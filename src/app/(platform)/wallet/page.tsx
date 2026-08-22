'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  user_id: string;
  type: 'earned' | 'sent' | 'received' | 'spent';
  amount: number;
  description: string;
  category: string;
  from_user: string | null;
  to_user: string | null;
  created_at: string;
}

interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target: number;
  saved: number;
  icon: string;
  deadline: string | null;
}

interface SpendingCategory {
  category: string;
  total: number;
  icon: string;
}

type WalletTab = 'overview' | 'transactions' | 'savings' | 'send' | 'earn';

const EARN_METHODS = [
  { icon: '📝', label: 'Daily Health Check-in', reward: 5, href: '/health' },
  { icon: '📚', label: 'Complete a Course', reward: '10-50', href: '/learn' },
  { icon: '🗳️', label: 'Vote on Proposals', reward: 3, href: '/govern' },
  { icon: '💬', label: 'Help on Forum', reward: 2, href: '/forum' },
  { icon: '📹', label: 'Report for Community', reward: 10, href: '/record' },
  { icon: '🏠', label: 'Complete Chores', reward: 5, href: '/mihome/household' },
  { icon: '🎓', label: 'Coach Someone', reward: 25, href: '/finance/coaching' },
  { icon: '🛒', label: 'Sell on Market', reward: 'varies', href: '/market' },
];

export default function WalletPage() {
  const [tab, setTab] = useState<WalletTab>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Send form
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sending, setSending] = useState(false);

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('🎯');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    if (user) {
      const { data: tx } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (tx) setTransactions(tx);
      const { data: g } = await supabase.from('savings_goals').select('*').eq('user_id', user.id);
      if (g) setGoals(g);
    }
    setLoading(false);
  }

  async function sendMLY() {
    if (!user || !sendTo.trim() || !sendAmount) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from('transactions').insert({
      user_id: user.id, type: 'sent', amount: parseFloat(sendAmount),
      description: sendNote.trim() || `Sent to ${sendTo}`, category: 'transfer',
      to_user: sendTo.trim(),
    });
    setSendTo(''); setSendAmount(''); setSendNote('');
    setSending(false);
    toast.success(`$${sendAmount} MLY sent!`);
    loadData();
  }

  async function createGoal() {
    if (!user || !goalTitle.trim() || !goalTarget) return;
    const supabase = createClient();
    await supabase.from('savings_goals').insert({
      user_id: user.id, title: goalTitle.trim(), target: parseFloat(goalTarget),
      saved: 0, icon: goalIcon,
    });
    setGoalTitle(''); setGoalTarget(''); setShowGoalForm(false);
    toast.success('Savings goal created!');
    loadData();
  }

  async function addToGoal(goalId: string, amount: number) {
    const supabase = createClient();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    await supabase.from('savings_goals').update({ saved: goal.saved + amount }).eq('id', goalId);
    toast.success(`+$${amount} added to "${goal.title}"`);
    loadData();
  }

  // Computed stats
  const balance = user?.mly_balance || 0;
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthEarned = thisMonthTx.filter(t => t.type === 'earned' || t.type === 'received').reduce((s, t) => s + t.amount, 0);
  const monthSpent = thisMonthTx.filter(t => t.type === 'sent' || t.type === 'spent').reduce((s, t) => s + t.amount, 0);

  // Spending categories
  const categories: SpendingCategory[] = [];
  const catMap = new Map<string, number>();
  transactions.filter(t => t.type === 'spent' || t.type === 'sent').forEach(t => {
    catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
  });
  const CAT_ICONS: Record<string, string> = { transfer: '↔️', market: '🛒', food: '🍽️', transport: '🚗', health: '❤️', education: '📚', entertainment: '🎬', bills: '📄', other: '📦' };
  catMap.forEach((total, cat) => categories.push({ category: cat, total, icon: CAT_ICONS[cat] || '📦' }));
  categories.sort((a, b) => b.total - a.total);

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Wallet</h1>
        <p className="text-xs text-gray-500">Your $MLY — earned through participation, spent in community</p>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-harbor-800 to-harbor-950 text-white p-5 rounded-2xl">
        <p className="text-xs text-gray-300">Available Balance</p>
        <p className="text-3xl font-bold mt-1">${balance.toFixed(2)} <span className="text-sm font-normal text-mly-400">MLY</span></p>
        <div className="flex gap-4 mt-3 text-xs">
          <div>
            <p className="text-gray-400">This Month</p>
            <p className="text-green-400 font-medium">+${monthEarned.toFixed(0)} earned</p>
          </div>
          <div>
            <p className="text-gray-400">Spent</p>
            <p className="text-orange-400 font-medium">-${monthSpent.toFixed(0)} spent</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => setTab('send')} className="card py-2.5 text-center hover:shadow-md transition-shadow">
          <p className="text-lg">↑</p>
          <p className="text-[9px] text-gray-500">Send</p>
        </button>
        <Link href="/wallet/scan" className="card py-2.5 text-center hover:shadow-md transition-shadow">
          <p className="text-lg">📷</p>
          <p className="text-[9px] text-gray-500">Scan</p>
        </Link>
        <button onClick={() => setTab('earn')} className="card py-2.5 text-center hover:shadow-md transition-shadow">
          <p className="text-lg">💰</p>
          <p className="text-[9px] text-gray-500">Earn</p>
        </button>
        <button onClick={() => setTab('savings')} className="card py-2.5 text-center hover:shadow-md transition-shadow">
          <p className="text-lg">🎯</p>
          <p className="text-[9px] text-gray-500">Goals</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['overview', 'transactions', 'savings', 'send', 'earn'] as WalletTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          {/* Spending breakdown */}
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-3">Spending Breakdown</h3>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No spending recorded yet</p>
            ) : categories.slice(0, 5).map(cat => (
              <div key={cat.category} className="flex items-center gap-3 py-1.5">
                <span className="text-sm">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-harbor-800 dark:text-white capitalize">{cat.category}</span>
                    <span className="text-gray-500">${cat.total.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${categories.length > 0 ? (cat.total / categories[0].total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Recent Activity</h3>
              <button onClick={() => setTab('transactions')} className="text-[10px] text-teal-600">See all →</button>
            </div>
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm', tx.type === 'earned' || tx.type === 'received' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30')}>
                  {tx.type === 'earned' ? '⬇️' : tx.type === 'received' ? '⬇️' : '⬆️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-harbor-800 dark:text-white truncate">{tx.description}</p>
                  <p className="text-[10px] text-gray-400">{timeAgo(tx.created_at)}</p>
                </div>
                <p className={cn('text-sm font-bold', tx.type === 'earned' || tx.type === 'received' ? 'text-green-600' : 'text-orange-600')}>
                  {tx.type === 'earned' || tx.type === 'received' ? '+' : '-'}${tx.amount.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['all', 'earned', 'received', 'sent', 'spent'].map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={cn('px-2 py-1 rounded-full text-[10px] capitalize', filterType === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3, 4, 5].map(i => <div key={i} className="card skeleton h-14" />) :
            transactions.filter(t => filterType === 'all' || t.type === filterType).length === 0 ? (
              <div className="card text-center py-8"><p className="text-sm text-gray-500">No transactions found</p></div>
            ) : transactions.filter(t => filterType === 'all' || t.type === filterType).map(tx => (
              <div key={tx.id} className="card flex items-center gap-3 py-2.5">
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs', tx.type === 'earned' || tx.type === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                  {CAT_ICONS[tx.category] || '💰'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-harbor-800 dark:text-white">{tx.description}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{tx.category} · {new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <p className={cn('text-sm font-bold', tx.type === 'earned' || tx.type === 'received' ? 'text-green-600' : 'text-orange-600')}>
                  {tx.type === 'earned' || tx.type === 'received' ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
              </div>
            ))
          }
        </div>
      )}

      {/* Savings Goals */}
      {tab === 'savings' && (
        <div className="space-y-3">
          {!showGoalForm ? (
            <button onClick={() => setShowGoalForm(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ New Savings Goal</button>
          ) : (
            <div className="card space-y-2 border-2 border-mly-200 dark:border-mly-800">
              <div className="flex gap-2">
                <input value={goalIcon} onChange={e => setGoalIcon(e.target.value)} className="input-field w-12 text-center text-xl" maxLength={2} />
                <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="Goal name" className="input-field flex-1" />
              </div>
              <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Target amount ($MLY)" className="input-field" type="number" />
              <div className="flex gap-2">
                <button onClick={createGoal} disabled={!goalTitle.trim() || !goalTarget} className="btn-teal flex-1 text-xs disabled:opacity-50">Create Goal</button>
                <button onClick={() => setShowGoalForm(false)} className="px-3 py-2 text-xs bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm text-gray-500">No savings goals yet</p>
              <p className="text-xs text-gray-400 mt-1">Save for what matters — new phone, moving costs, emergency fund</p>
            </div>
          ) : goals.map(goal => {
            const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
            return (
              <div key={goal.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{goal.icon}</span>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{goal.title}</p>
                  </div>
                  <span className="text-xs text-mly-600 font-bold">{pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : 'bg-mly-500')} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">${goal.saved.toFixed(0)} / ${goal.target.toFixed(0)} MLY</span>
                  <div className="flex gap-1">
                    {[5, 10, 25].map(amt => (
                      <button key={amt} onClick={() => addToGoal(goal.id, amt)} className="text-[10px] px-2 py-1 bg-mly-100 text-mly-700 dark:bg-mly-900/30 dark:text-mly-400 rounded hover:bg-mly-200">+${amt}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send */}
      {tab === 'send' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Send $MLY</h3>
          <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="Recipient name or ID" className="input-field" />
          <input value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="Amount ($MLY)" className="input-field" type="number" />
          <input value={sendNote} onChange={e => setSendNote(e.target.value)} placeholder="Note (optional)" className="input-field" />
          {sendAmount && <p className="text-xs text-gray-500">New balance: <strong className="text-mly-600">${(balance - parseFloat(sendAmount || '0')).toFixed(2)} MLY</strong></p>}
          <button onClick={sendMLY} disabled={!sendTo.trim() || !sendAmount || sending || parseFloat(sendAmount || '0') > balance} className="btn-teal w-full disabled:opacity-50">
            {sending ? 'Sending...' : `Send $${sendAmount || '0'} MLY`}
          </button>
          <p className="text-[10px] text-gray-400 text-center">Instant, free, peer-to-peer. No banks involved.</p>
        </div>
      )}

      {/* Earn */}
      {tab === 'earn' && (
        <div className="space-y-2">
          <div className="card bg-mly-50 dark:bg-mly-900/10 border border-mly-200 dark:border-mly-800">
            <p className="text-xs text-mly-700 dark:text-mly-400 font-medium">$MLY is earned, not bought.</p>
            <p className="text-xs text-mly-600 dark:text-mly-300 mt-1">Participate in the community, help your neighbors, learn new skills — and get rewarded.</p>
          </div>
          {EARN_METHODS.map(method => (
            <Link key={method.label} href={method.href} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-xl w-8 text-center">{method.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white">{method.label}</p>
              </div>
              <span className="text-xs text-mly-600 font-bold">+{method.reward} MLY</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
