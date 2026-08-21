'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type WalletView = 'main' | 'send' | 'receive' | 'history';

interface Transaction {
  id: string;
  from_id: string | null;
  to_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const [view, setView] = useState<WalletView>('main');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [weekSpending, setWeekSpending] = useState(0);

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('mly_balance')
        .eq('id', user.id)
        .single();
      if (profile) setBalance(profile.mly_balance);

      // Get recent transactions
      const { data: txs } = await supabase
        .from('mly_transactions')
        .select('*')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txs) {
        setTransactions(txs);
        // Calculate week totals
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weekTxs = txs.filter(t => new Date(t.created_at).getTime() > weekAgo);
        setWeekEarnings(weekTxs.filter(t => t.to_id === user.id && (t.type === 'earn' || t.type === 'ubi')).reduce((s, t) => s + t.amount, 0));
        setWeekSpending(weekTxs.filter(t => t.from_id === user.id).reduce((s, t) => s + t.amount, 0));
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

    // Find recipient by email or display name
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, display_name')
      .or(`email.eq.${sendTo.trim()},display_name.ilike.${sendTo.trim()}`)
      .limit(1)
      .maybeSingle();

    if (!recipient) {
      setSendResult('error');
      setSending(false);
      return;
    }

    const amount = parseFloat(sendAmount);
    if (amount <= 0 || amount > balance) {
      setSendResult('error');
      setSending(false);
      return;
    }

    // Create transaction
    await supabase.from('mly_transactions').insert({
      from_id: user.id,
      to_id: recipient.id,
      amount,
      type: 'transfer',
      description: sendNote.trim() || `Transfer to ${recipient.display_name}`,
    });

    // Update balances
    await supabase.rpc('increment_balance', { user_id: recipient.id, amount });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: -amount });

    setBalance(prev => prev - amount);
    setSendResult('success');
    setSendTo(''); setSendAmount(''); setSendNote('');
    setSending(false);
  };

  const typeIcons: Record<string, string> = { earn: '💚', spend: '🛍️', transfer: '↔️', ubi: '💰' };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-harbor-800 via-harbor-700 to-teal-600 text-white p-6 rounded-2xl">
        <p className="text-xs text-harbor-200">$MLY Balance</p>
        <p className="text-4xl font-bold mt-1">${balance.toFixed(0)}</p>
        <p className="text-xs text-harbor-300 mt-0.5">1 MLY = $1 USD</p>

        {/* Week Summary */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs text-harbor-300">Earned this week</p>
            <p className="text-sm font-bold text-teal-300">+${weekEarnings.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-harbor-300">Spent this week</p>
            <p className="text-sm font-bold text-red-300">-${weekSpending.toFixed(0)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-5">
          <button onClick={() => setView('send')} className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">
            Send
          </button>
          <button onClick={() => setView('receive')} className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">
            Receive
          </button>
          <Link href="/wallet/exchange" className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">
            Exchange
          </Link>
        </div>
      </div>

      {/* Send View */}
      {view === 'send' && (
        <form onSubmit={handleSend} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-harbor-800 dark:text-white">Send $MLY</h2>
            <button type="button" onClick={() => setView('main')} className="text-xs text-gray-400">✕ Close</button>
          </div>

          {sendResult === 'success' && <p className="text-sm text-teal-500 font-medium">✓ Sent successfully!</p>}
          {sendResult === 'error' && <p className="text-sm text-red-500 font-medium">User not found or insufficient balance.</p>}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Recipient (email or name)</label>
            <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} className="input-field !py-2 text-sm" placeholder="who@email.com or display name" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount ($MLY)</label>
            <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} className="input-field !py-2 text-sm text-2xl font-bold" placeholder="0" min="1" max={balance} required />
            <p className="text-xs text-gray-400 mt-0.5">Available: ${balance.toFixed(0)}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
            <input type="text" value={sendNote} onChange={e => setSendNote(e.target.value)} className="input-field !py-2 text-sm" placeholder="What's it for?" />
          </div>
          <button type="submit" disabled={sending} className="btn-teal w-full disabled:opacity-50">
            {sending ? 'Sending...' : `Send $${sendAmount || '0'} MLY`}
          </button>
        </form>
      )}

      {/* Receive View */}
      {view === 'receive' && (
        <div className="card text-center space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-harbor-800 dark:text-white">Receive $MLY</h2>
            <button onClick={() => setView('main')} className="text-xs text-gray-400">✕ Close</button>
          </div>
          <p className="text-xs text-gray-500">Show this QR code to send you $MLY</p>
          <div className="bg-white p-4 rounded-xl inline-block mx-auto">
            <QRCodeSVG
              value={`milyfe:pay:${user?.id}:${user?.display_name}`}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="bg-gray-50 dark:bg-harbor-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Your MiLyfe ID</p>
            <p className="text-xs font-mono text-harbor-800 dark:text-gray-200 break-all">{user?.id}</p>
          </div>
          <p className="text-xs text-gray-400">Or share your email: {user?.email}</p>
        </div>
      )}

      {/* Transaction History */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">Recent Transactions</h2>
          <Link href="/profile/transactions" className="text-xs text-teal-500">View all →</Link>
        </div>
        {transactions.slice(0, 8).map(tx => {
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

      {/* UBI Info */}
      <div className="card bg-mly-50 dark:bg-mly-900/20 border-mly-200 dark:border-mly-800 flex items-center gap-3">
        <span className="text-2xl">💰</span>
        <div>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Next UBI: +$10 MLY</p>
          <p className="text-xs text-gray-500">Stay active to receive daily. Check in or report an issue.</p>
        </div>
      </div>
    </div>
  );
}
