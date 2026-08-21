'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type TxFilter = 'all' | 'earn' | 'spend' | 'transfer' | 'ubi';

interface Transaction {
  id: string;
  from_id: string | null;
  to_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  earn: '💚',
  spend: '🛍️',
  transfer: '↔️',
  ubi: '💰',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      let query = supabase
        .from('mly_transactions')
        .select('*')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data } = await query;

      if (data) {
        setTransactions(data);

        // Calculate totals
        let earned = 0;
        let spent = 0;
        data.forEach((tx) => {
          if (tx.to_id === user.id && (tx.type === 'earn' || tx.type === 'ubi')) {
            earned += tx.amount;
          }
          if (tx.from_id === user.id && tx.type === 'spend') {
            spent += tx.amount;
          }
        });
        setTotalEarned(earned);
        setTotalSpent(spent);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, [user, filter, supabase]);

  const isIncoming = (tx: Transaction): boolean => {
    return tx.to_id === user?.id && tx.from_id !== user?.id;
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-teal-500 text-sm">← Back</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">$MLY History</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-xl font-bold text-teal-500">+{totalEarned.toFixed(0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-xl font-bold text-red-400">-{totalSpent.toFixed(0)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {(['all', 'earn', 'spend', 'ubi', 'transfer'] as TxFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize',
              filter === f
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-gray-500">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const incoming = isIncoming(tx);
            return (
              <div key={tx.id} className="card flex items-center gap-3">
                <span className="text-xl">{typeIcons[tx.type] || '💸'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-harbor-800 dark:text-white truncate">
                    {tx.description || tx.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {' · '}
                    <span className="capitalize">{tx.type}</span>
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  incoming || tx.type === 'earn' || tx.type === 'ubi'
                    ? 'text-teal-500'
                    : 'text-red-400'
                )}>
                  {incoming || tx.type === 'earn' || tx.type === 'ubi' ? '+' : '-'}
                  {tx.amount.toFixed(0)} MLY
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
