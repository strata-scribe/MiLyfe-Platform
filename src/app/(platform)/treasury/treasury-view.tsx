'use client';

import { TrendingUp, TrendingDown, Users, Wallet, ArrowUpRight, ArrowDownLeft, Zap, Gift } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  treasury: any;
  transactions: any[];
  weeklyStats: any[];
}

const TYPE_LABELS: Record<string, string> = {
  ubi: 'UBI Distribution',
  treasury_fee: 'Marketplace Fee',
  quest_reward: 'Quest Reward',
  proposal_fund: 'Proposal Funding',
  transfer: 'Transfer',
};

const TYPE_ICONS: Record<string, typeof Wallet> = {
  ubi: Gift,
  treasury_fee: ArrowUpRight,
  quest_reward: Zap,
  proposal_fund: ArrowDownLeft,
};

export function TreasuryView({ treasury, transactions, weeklyStats }: Props) {
  const totalUbiThisMonth = weeklyStats.reduce((sum, t) => sum + (t.amount || 0), 0);
  const ubiDistributions = weeklyStats.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Community Treasury</h1>
        <p className="page-subtitle">
          Full transparency. Every $MLY in, every $MLY out.
        </p>
      </div>

      {/* Treasury stats — glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-mly-50/80 to-mly-100/40 dark:from-mly-900/30 dark:to-mly-800/10 border border-mly-200/50 dark:border-mly-700/30 backdrop-blur-sm">
          <Wallet className="h-5 w-5 text-mly-600 dark:text-mly-400 mb-2" aria-hidden="true" />
          <p className="text-2xl font-bold tabular-nums text-harbor-800 dark:text-white">
            ${((treasury?.balance || 0) / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-mly-700/70 dark:text-mly-400/70 font-medium uppercase tracking-wide mt-1">Current Balance</p>
        </div>

        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-teal-50/80 to-teal-100/40 dark:from-teal-900/30 dark:to-teal-800/10 border border-teal-200/50 dark:border-teal-700/30 backdrop-blur-sm">
          <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400 mb-2" aria-hidden="true" />
          <p className="text-2xl font-bold tabular-nums text-harbor-800 dark:text-white">
            ${((treasury?.total_distributed || 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-teal-700/70 dark:text-teal-400/70 font-medium uppercase tracking-wide mt-1">Total Distributed</p>
        </div>

        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-harbor-50/80 to-harbor-100/40 dark:from-harbor-900/30 dark:to-harbor-800/10 border border-harbor-200/50 dark:border-harbor-700/30 backdrop-blur-sm">
          <Users className="h-5 w-5 text-harbor-600 dark:text-harbor-400 mb-2" aria-hidden="true" />
          <p className="text-2xl font-bold tabular-nums text-harbor-800 dark:text-white">
            {(treasury?.citizen_count || 0).toLocaleString()}
          </p>
          <p className="text-xs text-harbor-700/70 dark:text-harbor-400/70 font-medium uppercase tracking-wide mt-1">Citizens</p>
        </div>
      </div>

      {/* How treasury grows */}
      <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-6">
        <h2 className="font-semibold text-harbor-800 dark:text-white mb-3">How the Treasury Grows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-harbor-800 dark:text-white">Marketplace Fees</p>
              <p className="text-gray-500 dark:text-gray-400">Small fees on marketplace transactions flow back to the treasury.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-harbor-800 dark:text-white">Decay Recapture</p>
              <p className="text-gray-500 dark:text-gray-400">Standing decay doesn&apos;t destroy $MLY — unused currency returns to the pool.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ArrowDownLeft className="h-4 w-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-harbor-800 dark:text-white">UBI Distributions</p>
              <p className="text-gray-500 dark:text-gray-400">100 $MLY per citizen per week goes out of the treasury.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ArrowDownLeft className="h-4 w-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-harbor-800 dark:text-white">Quest Rewards</p>
              <p className="text-gray-500 dark:text-gray-400">Verification quests and community quests are funded by the treasury.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 30-day summary */}
      <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-6">
        <h2 className="font-semibold text-harbor-800 dark:text-white mb-3">Last 30 Days</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold tabular-nums text-harbor-800 dark:text-white">{totalUbiThisMonth.toLocaleString()}</p>
            <p className="text-xs text-gray-500">$MLY distributed via UBI</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-harbor-800 dark:text-white">{ubiDistributions.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Individual UBI payments</p>
          </div>
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-harbor-800">
          <h2 className="font-semibold text-harbor-800 dark:text-white">Transaction Ledger</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Every treasury movement is public</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No treasury transactions yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-harbor-800 max-h-[500px] overflow-y-auto">
            {transactions.map((tx) => {
              const Icon = TYPE_ICONS[tx.type] || Wallet;
              const isOutflow = tx.type === 'ubi' || tx.type === 'quest_reward' || tx.type === 'proposal_fund';
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`rounded-lg p-2 ${isOutflow ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                    <Icon className={`h-3.5 w-3.5 ${isOutflow ? 'text-red-500' : 'text-green-500'}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                      {TYPE_LABELS[tx.type] || tx.type}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {tx.description || (tx.type === 'ubi' ? 'Weekly UBI distribution' : '')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${isOutflow ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {isOutflow ? '-' : '+'}{tx.amount} $MLY
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }).replace('about ', '')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <Link href="/transparency" className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium">
          ← How these algorithms work
        </Link>
      </div>
    </div>
  );
}
