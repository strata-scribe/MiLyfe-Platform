'use client';

import Link from 'next/link';
import { Wallet, GraduationCap, Store, Landmark, Gift, Shield, TrendingUp, Users } from 'lucide-react';

interface Props {
  profile: any;
  wallet: any;
  standing: any;
  rewards: any[];
  enrollments: any[];
  openQuests: any[];
  activeProposals: any[];
  surplus: any[];
  treasury: any;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Night owl';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Night owl';
}

export function HomeDashboard({
  profile, wallet, standing, rewards, enrollments,
  openQuests, activeProposals, surplus, treasury,
}: Props) {
  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  const greeting = getGreeting();
  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Here&apos;s what&apos;s happening in your community.</p>
      </div>

      {/* Glass-morphism stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/wallet"
          className="group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/10 bg-gradient-to-br from-teal-50/80 to-teal-100/40 dark:from-teal-900/30 dark:to-teal-800/10 border border-teal-200/50 dark:border-teal-700/30 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Wallet className="h-5 w-5 mx-auto mb-1.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
          <p className="text-xl font-bold tabular-nums text-harbor-800 dark:text-white">{totalBalance.toFixed(0)}</p>
          <p className="text-[11px] text-teal-700/70 dark:text-teal-400/70 font-medium uppercase tracking-wide">$MLY</p>
        </Link>

        <Link
          href="/standing"
          className="group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/10 bg-gradient-to-br from-purple-50/80 to-purple-100/40 dark:from-purple-900/30 dark:to-purple-800/10 border border-purple-200/50 dark:border-purple-700/30 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Shield className="h-5 w-5 mx-auto mb-1.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          <p className="text-xl font-bold tabular-nums text-harbor-800 dark:text-white">{standing?.overall?.toFixed(1) || '0'}</p>
          <p className="text-[11px] text-purple-700/70 dark:text-purple-400/70 font-medium uppercase tracking-wide">Standing</p>
        </Link>

        <Link
          href="/governance"
          className="group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-harbor-500/10 bg-gradient-to-br from-harbor-50/80 to-harbor-100/40 dark:from-harbor-900/30 dark:to-harbor-800/10 border border-harbor-200/50 dark:border-harbor-700/30 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-harbor-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Landmark className="h-5 w-5 mx-auto mb-1.5 text-harbor-600 dark:text-harbor-400" aria-hidden="true" />
          <p className="text-xl font-bold tabular-nums text-harbor-800 dark:text-white">{activeProposals.length}</p>
          <p className="text-[11px] text-harbor-700/70 dark:text-harbor-400/70 font-medium uppercase tracking-wide">Active Votes</p>
        </Link>
      </div>

      {/* Bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unclaimed rewards - spans full width when present */}
        {rewards.length > 0 && (
          <div className="md:col-span-2 rounded-xl border-2 border-green-200 dark:border-green-800/50 bg-gradient-to-r from-green-50/80 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 p-5 backdrop-blur-sm">
            <h2 className="font-semibold flex items-center gap-2 mb-3 text-green-800 dark:text-green-300">
              <Gift className="h-4 w-4" aria-hidden="true" /> Unclaimed Rewards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rewards.map((r) => (
                <Link key={r.id} href="/rewards" className="flex items-center justify-between rounded-lg bg-white/80 dark:bg-harbor-900/50 px-4 py-2.5 hover:bg-white dark:hover:bg-harbor-900 transition-colors border border-green-100 dark:border-green-900/30">
                  <span className="text-sm text-harbor-800 dark:text-white">{r.title}</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">+{r.amount} $MLY</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Learning progress */}
        {enrollments.length > 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-harbor-800 dark:text-white">
              <GraduationCap className="h-4 w-4 text-indigo-500" aria-hidden="true" /> Your Learning
            </h2>
            <div className="space-y-3">
              {enrollments.map((e: any) => (
                <Link
                  key={e.id}
                  href={`/learn/${e.learn_paths?.slug || ''}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-harbor-900/50 transition-colors"
                >
                  <span className="text-xl">{e.learn_paths?.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-harbor-800 dark:text-white">{e.learn_paths?.title}</p>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-harbor-800 overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700"
                        style={{ width: `${e.progress_percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">{e.progress_percent}%</span>
                </Link>
              ))}
            </div>
            <Link href="/learn" className="block mt-3 text-xs text-teal-600 dark:text-teal-400 hover:underline text-center font-medium">
              View all paths →
            </Link>
          </div>
        )}

        {/* Open quests */}
        {openQuests.length > 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-harbor-800 dark:text-white">
              <Store className="h-4 w-4 text-orange-500" aria-hidden="true" /> Open Quests
            </h2>
            <div className="space-y-2">
              {openQuests.map((q) => (
                <Link key={q.id} href="/street" className="flex items-center justify-between rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-harbor-900/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{q.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{q.category} · {q.difficulty}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">+{q.reward_mly}</span>
                </Link>
              ))}
            </div>
            <Link href="/street" className="block mt-3 text-xs text-teal-600 dark:text-teal-400 hover:underline text-center font-medium">
              See all quests →
            </Link>
          </div>
        )}

        {/* Active proposals */}
        {activeProposals.length > 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-harbor-800 dark:text-white">
              <Landmark className="h-4 w-4 text-blue-500" aria-hidden="true" /> Vote Now
            </h2>
            <div className="space-y-2">
              {activeProposals.map((p) => (
                <Link key={p.id} href={`/governance/${p.id}`} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-harbor-900/50 transition-colors">
                  <p className="text-sm font-medium truncate flex-1 text-harbor-800 dark:text-white">{p.title}</p>
                  <div className="flex items-center gap-2 text-xs shrink-0 ml-2">
                    <span className="text-green-600 dark:text-green-400 font-medium">{p.votes_for}↑</span>
                    <span className="text-red-500 dark:text-red-400 font-medium">{p.votes_against}↓</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/governance" className="block mt-3 text-xs text-teal-600 dark:text-teal-400 hover:underline text-center font-medium">
              All proposals →
            </Link>
          </div>
        )}

        {/* Free surplus */}
        {surplus.length > 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-harbor-800 dark:text-white">
              🎁 Free Stuff Nearby
            </h2>
            <div className="space-y-2">
              {surplus.map((s) => (
                <Link key={s.id} href="/street" className="flex items-center justify-between rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-harbor-900/50 transition-colors">
                  <p className="text-sm text-harbor-800 dark:text-white">{s.title}</p>
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {getTimeLeft(s.available_until)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Community pulse - glass card */}
      {treasury && (
        <div className="relative overflow-hidden rounded-xl p-5 text-center bg-gradient-to-r from-harbor-50/80 via-teal-50/30 to-mly-50/50 dark:from-harbor-900/40 dark:via-teal-900/20 dark:to-mly-900/20 border border-gray-100 dark:border-harbor-800 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,193,174,0.05)_1px,transparent_0)] bg-[size:24px_24px]" aria-hidden="true" />
          <div className="relative flex items-center justify-center gap-6 flex-wrap">
            <div>
              <Users className="h-4 w-4 mx-auto mb-1 text-harbor-500 dark:text-harbor-400" aria-hidden="true" />
              <p className="text-lg font-bold tabular-nums text-harbor-800 dark:text-white">{(treasury.citizen_count || 0).toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Citizens</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-harbor-700" aria-hidden="true" />
            <div>
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-mly-500" aria-hidden="true" />
              <p className="text-lg font-bold tabular-nums text-harbor-800 dark:text-white">${((treasury.balance || 0) / 1000000).toFixed(1)}M</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Treasury</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {enrollments.length === 0 && openQuests.length === 0 && activeProposals.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-harbor-700 p-10 text-center">
          <p className="text-4xl mb-4">🌱</p>
          <p className="font-bold text-lg text-harbor-800 dark:text-white">Welcome to MiLyfe</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            Start by exploring a learning path, checking out community quests, or just talking to Mi.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/learn" className="rounded-lg bg-harbor-800 dark:bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-harbor-500/20 hover:shadow-harbor-500/30 transition-shadow">
              Start Learning
            </Link>
            <Link href="/street" className="rounded-lg border border-gray-200 dark:border-harbor-700 px-5 py-2.5 text-sm font-medium text-harbor-800 dark:text-white hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors">
              Browse Quests
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / 60000)}min`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}
