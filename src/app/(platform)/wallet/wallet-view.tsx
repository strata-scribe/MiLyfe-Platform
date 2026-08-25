'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiggyBank, Heart, Wallet, Send } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedBalance, UBICelebration } from '@/components/wallet/animated-balance';
import { SendFlow } from '@/components/wallet/send-flow';
import { JarManager } from '@/components/wallet/jar-manager';
import { TransactionList } from '@/components/wallet/transaction-list';
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
          <Send className="h-5 w-5 mx-auto mb-1 text-primary" />
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

      {/* Transaction History (paginated + filterable) */}
      <TransactionList initialTransactions={transactions} userId={userId} />

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
