'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowDownLeft, PiggyBank, Heart, Wallet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { AnimatedBalance, UBICelebration } from '@/components/wallet/animated-balance';
import { SendFlow } from '@/components/wallet/send-flow';
import { JarManager } from '@/components/wallet/jar-manager';
import { TransactionDetail } from '@/components/wallet/transaction-detail';
import { useRealtimeWallet } from '@/lib/hooks/use-realtime-wallet';
import { claimReward } from '@/lib/actions/wallet';

interface Props {
  userId: string;
  wallet: any;
  transactions: any[];
  treasury: any;
}

export function WalletView({ userId, wallet, transactions, treasury }: Props) {
  const router = useRouter();
  const [showSend, setShowSend] = useState(false);
  const [showJars, setShowJars] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showUBI, setShowUBI] = useState(false);

  // Real-time balance updates
  const { balance, lastTransaction } = useRealtimeWallet(userId, {
    spending: wallet?.spending_balance || 0,
    savings: wallet?.savings_balance || 0,
    community: wallet?.community_balance || 0,
  });

  const totalBalance = balance.spending + balance.savings + balance.community;

  // Detect UBI arrival from real-time
  if (lastTransaction?.type === 'ubi' && !showUBI) {
    // Would trigger celebration — for now, check on page load if last_ubi_at is recent
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pocket</h1>
        <p className="text-muted-foreground">Your $MLY — earn, save, give</p>
      </div>

      {/* UBI Celebration */}
      {showUBI && (
        <UBICelebration amount={100} onDismiss={() => setShowUBI(false)} />
      )}

      {/* Balance Card */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
        <div className="text-center mb-4">
          <p className="text-slate-300 text-sm mb-1">Total Balance</p>
          <AnimatedBalance value={totalBalance} label="" color="#fff" size="lg" />
          <p className="text-xs text-slate-400 mt-1">$MLY</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <Wallet className="h-4 w-4 mx-auto text-teal-400 mb-1" />
            <AnimatedBalance value={balance.spending} label="Spending" color="#2dd4bf" size="sm" />
          </div>
          <div className="text-center">
            <PiggyBank className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
            <AnimatedBalance value={balance.savings} label="Savings" color="#facc15" size="sm" />
          </div>
          <div className="text-center">
            <Heart className="h-4 w-4 mx-auto text-pink-400 mb-1" />
            <AnimatedBalance value={balance.community} label="Community" color="#f472b6" size="sm" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowSend(true)}
          className="rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
        >
          <ArrowUpRight className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-sm font-medium">Send</p>
        </button>
        <button
          onClick={() => setShowJars(true)}
          className="rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
        >
          <PiggyBank className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-sm font-medium">Move Pots</p>
        </button>
      </div>

      {/* Send Flow Modal */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSend(false)}>
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <SendFlow
              balance={balance}
              onSuccess={() => { setShowSend(false); router.refresh(); toast.success('Sent!'); }}
              onCancel={() => setShowSend(false)}
            />
          </div>
        </div>
      )}

      {/* Jar Manager */}
      {showJars && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowJars(false)}>
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Manage Pots</h2>
              <button onClick={() => setShowJars(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <JarManager balance={balance} onSuccess={() => { setShowJars(false); router.refresh(); }} />
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Transaction History</h2>
        </div>
        <div className="divide-y">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet. Send your first $MLY!</p>
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
                    <div className={`rounded-lg p-1.5 ${isIncoming ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
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
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <TransactionDetail
          transaction={selectedTx}
          userId={userId}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {/* Treasury */}
      {treasury && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Community Treasury</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{treasury.balance?.toFixed(0) || 0}</p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <div>
              <p className="text-lg font-bold">{treasury.total_distributed?.toFixed(0) || 0}</p>
              <p className="text-xs text-muted-foreground">Distributed</p>
            </div>
            <div>
              <p className="text-lg font-bold">{treasury.citizen_count || 0}</p>
              <p className="text-xs text-muted-foreground">Citizens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
