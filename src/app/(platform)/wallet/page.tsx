'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type WalletView = 'main' | 'send' | 'receive';

interface Transaction {
  id: string; from_id: string | null; to_id: string; amount: number;
  type: string; description: string; created_at: string;
}

interface DayData { date: string; earned: number; spent: number; balance: number; }

const COLORS = ['#00C1AE', '#FFC107', '#1e3a6e', '#ef4444', '#8b5cf6'];
const typeIcons: Record<string, string> = { earn: '💚', spend: '🛍️', transfer: '↔️', ubi: '💰' };

export default function WalletPage() {
  const [view, setView] = useState<WalletView>('main');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [spendingBreakdown, setSpendingBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [insights, setInsights] = useState({ weekEarned: 0, weekSpent: 0, topSource: '', streak: 0, projectedMonthly: 0 });
  const [loading, setLoading] = useState(true);

  // Send
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get balance
      const { data: profile } = await supabase.from('profiles').select('mly_balance').eq('id', user.id).single();
      if (profile) setBalance(profile.mly_balance);

      // Get all transactions (last 30 days for charts)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: txs } = await supabase
        .from('mly_transactions')
        .select('*')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (txs) {
        setTransactions(txs);

        // Build daily chart data
        const daily: Record<string, { earned: number; spent: number }> = {};
        let runningBalance = profile?.mly_balance || 0;

        // Initialize last 14 days
        for (let i = 13; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          daily[key] = { earned: 0, spent: 0 };
        }

        // Aggregate transactions by day
        txs.forEach(tx => {
          const key = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!daily[key]) daily[key] = { earned: 0, spent: 0 };
          if (tx.to_id === user.id && (tx.type === 'earn' || tx.type === 'ubi')) {
            daily[key].earned += tx.amount;
          } else if (tx.from_id === user.id) {
            daily[key].spent += tx.amount;
          }
        });

        // Build chart array with running balance
        let bal = runningBalance;
        const entries = Object.entries(daily);
        // Calculate backwards from current balance
        const totalEarned = entries.reduce((s, [, v]) => s + v.earned, 0);
        const totalSpent = entries.reduce((s, [, v]) => s + v.spent, 0);
        let startBal = bal - totalEarned + totalSpent;

        const chart: DayData[] = entries.map(([date, { earned, spent }]) => {
          startBal = startBal + earned - spent;
          return { date, earned, spent, balance: Math.max(0, startBal) };
        });
        setChartData(chart);

        // Spending breakdown by type
        const breakdown: Record<string, number> = {};
        txs.filter(t => t.from_id === user.id || t.type === 'spend').forEach(tx => {
          const cat = tx.description?.includes('Purchased') ? 'Shopping' :
                     tx.description?.includes('Transfer') || tx.description?.includes('Payment') ? 'Transfers' :
                     tx.description?.includes('Tip') ? 'Tips' :
                     tx.description?.includes('Ride') ? 'Rideshare' : 'Other';
          breakdown[cat] = (breakdown[cat] || 0) + tx.amount;
        });
        setSpendingBreakdown(Object.entries(breakdown).map(([name, value]) => ({ name, value })));

        // Insights
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weekTxs = txs.filter(t => new Date(t.created_at).getTime() > weekAgo);
        const weekEarned = weekTxs.filter(t => t.to_id === user.id && (t.type === 'earn' || t.type === 'ubi')).reduce((s, t) => s + t.amount, 0);
        const weekSpent = weekTxs.filter(t => t.from_id === user.id).reduce((s, t) => s + t.amount, 0);

        // Top earning source
        const sources: Record<string, number> = {};
        txs.filter(t => t.to_id === user.id).forEach(t => {
          const src = t.type === 'ubi' ? 'UBI' : t.type === 'earn' ? 'Activity' : 'Transfers';
          sources[src] = (sources[src] || 0) + t.amount;
        });
        const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Activity';

        setInsights({
          weekEarned,
          weekSpent,
          topSource,
          streak: 7, // placeholder — would need health_checkins query
          projectedMonthly: weekEarned * 4.3,
        });
      }

      setLoading(false);
    };
    load();
  }, [user, supabase, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSending(true);
    setSendResult(null);

    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, display_name')
      .or(`email.eq.${sendTo.trim()},display_name.ilike.${sendTo.trim()}`)
      .limit(1)
      .maybeSingle();

    if (!recipient) { setSendResult('error'); setSending(false); return; }

    const amount = parseFloat(sendAmount);
    if (amount <= 0 || amount > balance) { setSendResult('error'); setSending(false); return; }

    await supabase.from('mly_transactions').insert({
      from_id: user.id, to_id: recipient.id, amount, type: 'transfer',
      description: sendNote.trim() || `Transfer to ${recipient.display_name}`,
    });
    await supabase.rpc('increment_balance', { user_id: recipient.id, amount });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: -amount });

    setBalance(prev => prev - amount);
    setSendResult('success');
    setSendTo(''); setSendAmount(''); setSendNote('');
    setSending(false);
  };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-32" />)}</div>;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-harbor-800 via-harbor-700 to-teal-600 text-white p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />

        <p className="text-xs text-harbor-200 relative">$MLY Balance</p>
        <p className="text-4xl font-bold mt-1 relative">${balance.toFixed(0)}</p>
        <p className="text-xs text-harbor-300 mt-0.5 relative">1 MLY = $1 USD · Free exchange</p>

        {/* Mini sparkline */}
        {chartData.length > 0 && (
          <div className="mt-4 h-12 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice(-7)}>
                <Area type="monotone" dataKey="balance" stroke="#5eead4" fill="#5eead4" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 relative">
          <button onClick={() => setView('send')} className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">Send</button>
          <button onClick={() => setView('receive')} className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">Receive</button>
          <Link href="/wallet/scan" className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">Scan</Link>
          <Link href="/wallet/exchange" className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">Exchange</Link>
        </div>
      </div>

      {/* Send/Receive Modals */}
      {view === 'send' && (
        <form onSubmit={handleSend} className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-harbor-800 dark:text-white">Send $MLY</h2>
            <button type="button" onClick={() => { setView('main'); setSendResult(null); }} className="text-xs text-gray-400">✕</button>
          </div>
          {sendResult === 'success' && <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 text-sm">✓ Sent!</div>}
          {sendResult === 'error' && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-sm">User not found or insufficient balance.</div>}
          <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} className="input-field !py-2 text-sm" placeholder="Email or display name" required />
          <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} className="input-field !py-2 text-sm text-xl font-bold" placeholder="0" min="1" max={balance} required />
          <input type="text" value={sendNote} onChange={e => setSendNote(e.target.value)} className="input-field !py-2 text-sm" placeholder="Note (optional)" />
          <button type="submit" disabled={sending} className="btn-teal w-full disabled:opacity-50">{sending ? '...' : `Send $${sendAmount || '0'}`}</button>
        </form>
      )}

      {view === 'receive' && (
        <div className="card text-center space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-harbor-800 dark:text-white">Receive $MLY</h2>
            <button onClick={() => setView('main')} className="text-xs text-gray-400">✕</button>
          </div>
          <div className="bg-white p-3 rounded-xl inline-block mx-auto">
            <QRCodeSVG value={`milyfe:pay:${user?.id}:${user?.display_name}`} size={160} level="M" />
          </div>
          <p className="text-xs text-gray-500">Scan this to send you $MLY</p>
        </div>
      )}

      {/* Insights Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500">This Week</p>
          <p className="text-xl font-bold text-teal-500">+${insights.weekEarned.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400">earned</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">This Week</p>
          <p className="text-xl font-bold text-red-400">-${insights.weekSpent.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400">spent</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Top Source</p>
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{insights.topSource}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Projected/mo</p>
          <p className="text-lg font-bold text-mly-600">${insights.projectedMonthly.toFixed(0)}</p>
        </div>
      </div>

      {/* 14-Day Earnings Chart */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-500 mb-3">14-Day Activity</h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C1AE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C1AE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="earned" name="Earned" stroke="#00C1AE" fill="url(#earnGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="spent" name="Spent" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Breakdown */}
      {spendingBreakdown.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Where Your $MLY Goes</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={spendingBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} strokeWidth={0}>
                    {spendingBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {spendingBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{item.name}</span>
                  <span className="text-xs font-medium text-harbor-800 dark:text-white">${item.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">Recent</h2>
          <Link href="/profile/transactions" className="text-xs text-teal-500">View all →</Link>
        </div>
        {transactions.slice(-10).reverse().map(tx => {
          const incoming = tx.to_id === user?.id && tx.from_id !== user?.id;
          return (
            <div key={tx.id} className="card flex items-center gap-3 !py-3">
              <span className="text-lg">{typeIcons[tx.type] || '💸'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white truncate">{tx.description || tx.type}</p>
                <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
              <span className={cn('text-sm font-bold', incoming || tx.type === 'earn' || tx.type === 'ubi' ? 'text-teal-500' : 'text-red-400')}>
                {incoming || tx.type === 'earn' || tx.type === 'ubi' ? '+' : '-'}${tx.amount.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* UBI */}
      <div className="card bg-mly-50 dark:bg-mly-900/20 border-mly-200 dark:border-mly-800 flex items-center gap-3">
        <span className="text-2xl">💰</span>
        <div>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Next UBI: +$10 MLY</p>
          <p className="text-xs text-gray-500">Stay active to receive daily.</p>
        </div>
      </div>
    </div>
  );
}
