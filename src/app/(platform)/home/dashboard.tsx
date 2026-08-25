'use client';

import Link from 'next/link';
import { Wallet, GraduationCap, Store, Landmark, Gift, Shield } from 'lucide-react';

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

export function HomeDashboard({
  profile, wallet, standing, rewards, enrollments,
  openQuests, activeProposals, surplus, treasury,
}: Props) {
  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Hey, {profile?.display_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-muted-foreground">Here's what's happening in your community.</p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/wallet" className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
          <Wallet className="h-5 w-5 mx-auto mb-1 text-teal-500" />
          <p className="text-lg font-bold">{totalBalance.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">$MLY</p>
        </Link>
        <Link href="/standing" className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
          <Shield className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-lg font-bold">{standing?.overall?.toFixed(1) || '0'}</p>
          <p className="text-xs text-muted-foreground">Standing</p>
        </Link>
        <Link href="/governance" className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
          <Landmark className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold">{activeProposals.length}</p>
          <p className="text-xs text-muted-foreground">Active Votes</p>
        </Link>
      </div>

      {/* Unclaimed rewards */}
      {rewards.length > 0 && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50/50 p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-green-600" /> Unclaimed Rewards
          </h2>
          <div className="space-y-2">
            {rewards.map((r) => (
              <Link key={r.id} href="/rewards" className="flex items-center justify-between rounded-md bg-white/80 px-3 py-2 hover:bg-white transition-colors">
                <span className="text-sm">{r.title}</span>
                <span className="text-sm font-bold text-green-600">+{r.amount} $MLY</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Learning progress */}
      {enrollments.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-indigo-500" /> Your Learning
          </h2>
          <div className="space-y-2">
            {enrollments.map((e: any) => (
              <Link
                key={e.id}
                href={`/learn/${e.learn_paths?.slug || ''}`}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
              >
                <span className="text-xl">{e.learn_paths?.icon || '📚'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.learn_paths?.title}</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${e.progress_percent}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{e.progress_percent}%</span>
              </Link>
            ))}
          </div>
          <Link href="/learn" className="block mt-2 text-xs text-primary hover:underline text-center">
            View all paths →
          </Link>
        </div>
      )}

      {/* Open quests */}
      {openQuests.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Store className="h-4 w-4 text-orange-500" /> Open Quests
          </h2>
          <div className="space-y-2">
            {openQuests.map((q) => (
              <Link key={q.id} href="/street" className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{q.category} · {q.difficulty}</p>
                </div>
                <span className="text-sm font-bold text-green-600">+{q.reward_mly}</span>
              </Link>
            ))}
          </div>
          <Link href="/street" className="block mt-2 text-xs text-primary hover:underline text-center">
            See all quests →
          </Link>
        </div>
      )}

      {/* Active proposals */}
      {activeProposals.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Landmark className="h-4 w-4 text-blue-500" /> Vote Now
          </h2>
          <div className="space-y-2">
            {activeProposals.map((p) => (
              <Link key={p.id} href={`/governance/${p.id}`} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium truncate flex-1">{p.title}</p>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-green-600">{p.votes_for}↑</span>
                  <span className="text-red-600">{p.votes_against}↓</span>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/governance" className="block mt-2 text-xs text-primary hover:underline text-center">
            All proposals →
          </Link>
        </div>
      )}

      {/* Free surplus */}
      {surplus.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            🎁 Free Stuff Nearby
          </h2>
          <div className="space-y-2">
            {surplus.map((s) => (
              <Link key={s.id} href="/street" className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors">
                <p className="text-sm">{s.title}</p>
                <span className="text-xs text-orange-600">
                  {getTimeLeft(s.available_until)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Community pulse */}
      {treasury && (
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">Community Pulse</p>
          <p className="text-sm mt-1">
            <span className="font-bold">{treasury.citizen_count || 0}</span> members ·{' '}
            <span className="font-bold">{treasury.balance?.toFixed(0) || 0}</span> $MLY in treasury
          </p>
        </div>
      )}

      {/* Empty state for new users */}
      {enrollments.length === 0 && openQuests.length === 0 && activeProposals.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-medium">Welcome to MiLyfe</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Start by exploring a learning path, checking out community quests, or just talking to Mi.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Link href="/learn" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Start Learning
            </Link>
            <Link href="/street" className="rounded-md border px-4 py-2 text-sm font-medium">
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
