'use client';

import { useState, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TransactionDetail } from './transaction-detail';

interface Transaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  type: string;
  pot: string;
  description: string;
  created_at: string;
}

interface TransactionListProps {
  initialTransactions: Transaction[];
  userId: string;
}

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ubi', label: 'UBI' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'reward', label: 'Rewards' },
  { value: 'spend', label: 'Spend' },
];

export function TransactionList({ initialTransactions, userId }: TransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialTransactions.length >= 20);
  const [filter, setFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const lastTx = transactions[transactions.length - 1];
    const cursor = lastTx?.created_at;

    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (filter !== 'all') params.set('type', filter);

    const res = await fetch(`/api/wallet/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(prev => [...prev, ...data.transactions]);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }, [transactions, loading, hasMore, filter]);

  async function handleFilter(type: string) {
    setFilter(type);
    setLoading(true);

    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);

    const res = await fetch(`/api/wallet/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border">
      {/* Header + Filter */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Transactions</h2>
          <span className="text-xs text-muted-foreground">{transactions.length} shown</span>
        </div>
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="divide-y">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {filter !== 'all' ? `No ${filter} transactions` : 'No transactions yet'}
          </p>
        ) : (
          transactions.map((tx) => {
            const isIncoming = tx.to_user_id === userId;
            return (
              <button
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-1.5 ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isIncoming
                      ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      : <ArrowUpRight className="h-4 w-4 text-red-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>
                  {isIncoming ? '+' : '-'}{tx.amount} $MLY
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="border-t px-4 py-3 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load older transactions'}
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedTx && (
        <TransactionDetail
          transaction={selectedTx}
          userId={userId}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
