'use client';

import Link from 'next/link';
import {
  Wallet, Star, Gift, Bell, ArrowRight, Landmark, TrendingUp,
  MessageCircle, Users, Heart, Coins, Activity,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import type { Tables } from '@/types/database';

interface Props {
  profile: Tables<'profiles'> | null;
  wallet: Tables<'wallets'> | null;
  standing: Tables<'standing'> | null;
  rewards: Tables<'rewards'>[];
  notifications: Tables<'notifications'>[];
  recentTransactions: { amount: number; type: string; created_at: string }[];
  recentPosts: any[];
  activeProposalCount: number;
  treasury: Tables<'community_treasury'> | null;
}

export function HomeDashboard({
  profile, wallet, standing, rewards, notifications,
  recentTransactions, recentPosts, activeProposalCount, treasury,
}: Props) {
  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  // Build chart data — last 7 days of income
  const chartData = buildChartData(recentTransactions);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting + streak */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Hey, {profile?.display_name || 'Citizen'} 👋
          </h1>
          <p className="page-subtitle">Here&apos;s your community at a glance</p>
        </div>
        {standing && standing.overall > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20">
            <Star className="h-4 w-4 text-teal-500" aria-hidden="true" />
            <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{standing.overall.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Balance card with mini chart */}
      <Card className="bg-gradient-to-br from-harbor-800 to-harbor-900 text-white border-0 overflow-hidden">
        <CardContent className="py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-harbor-200 text-xs mb-0.5">Total Balance</p>
              <p className="text-3xl font-bold tracking-tight">
                {totalBalance.toFixed(0)} <span className="text-mly-400 text-base">$MLY</span>
              </p>
            </div>
            <Link href="/wallet" className="flex items-center gap-1 text-xs text-harbor-200 hover:text-white transition-colors">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Details
            </Link>
          </div>

          {/* Three pots */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/10 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-harbor-200">Spending</p>
              <p className="text-sm font-bold">{wallet?.spending_balance.toFixed(0) || 0}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-harbor-200">Savings</p>
              <p className="text-sm font-bold">{wallet?.savings_balance.toFixed(0) || 0}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-harbor-200">Community</p>
              <p className="text-sm font-bold">{wallet?.community_balance.toFixed(0) || 0}</p>
            </div>
          </div>

          {/* Mini earnings chart */}
          {chartData.length > 1 && (
            <div className="h-16 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C1AE" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00C1AE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#00C1AE"
                    strokeWidth={2}
                    fill="url(#earningsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/governance" className="card group text-center py-3">
          <Landmark className="h-5 w-5 text-purple-500 mx-auto mb-1 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{activeProposalCount}</p>
          <p className="text-[10px] text-gray-500">Active Votes</p>
        </Link>
        <Link href="/rewards" className="card group text-center py-3">
          <Gift className="h-5 w-5 text-mly-500 mx-auto mb-1 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{rewards.length}</p>
          <p className="text-[10px] text-gray-500">Unclaimed</p>
        </Link>
        <Link href="/connect" className="card group text-center py-3">
          <Users className="h-5 w-5 text-teal-500 mx-auto mb-1 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{treasury?.citizen_count || 0}</p>
          <p className="text-[10px] text-gray-500">Citizens</p>
        </Link>
      </div>

      {/* Standing overview - mini */}
      {standing && standing.overall > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Standing
              </CardTitle>
              <Link href="/standing" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'neighbor', label: 'Nbr', color: 'bg-blue-500' },
                { key: 'carer', label: 'Car', color: 'bg-pink-500' },
                { key: 'maker', label: 'Mkr', color: 'bg-orange-500' },
                { key: 'voice', label: 'Vce', color: 'bg-teal-500' },
              ].map(({ key, label, color }) => (
                <div key={key} className="text-center">
                  <div className="relative h-10 w-10 mx-auto mb-1">
                    <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                        fill="none"
                        stroke="currentColor"
                        className="text-gray-200 dark:text-harbor-800"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                        fill="none"
                        className={color.replace('bg-', 'text-')}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${(standing as any)[key]}, 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                      {(standing as any)[key].toFixed(0)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Activity
              </CardTitle>
              <Badge variant="default">{notifications.length} new</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5" aria-label="Recent notifications">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-teal-500 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-harbor-800 dark:text-white text-sm truncate">{n.title}</p>
                    {n.body && <p className="text-gray-500 text-xs truncate">{n.body}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true }).replace('about ', '')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Community activity feed */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" aria-hidden="true" />
                Community Pulse
              </CardTitle>
              <Link href="/forum" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                All posts <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3" aria-label="Recent community posts">
              {recentPosts.map((post) => (
                <li key={post.id} className="flex items-start gap-3">
                  <Avatar name={post.author?.display_name || 'U'} src={post.author?.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>@{post.author?.username}</span>
                      {post.space && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {post.space.icon} {post.space.name}
                        </Badge>
                      )}
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace('about ', '')}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rewards preview */}
      {rewards.length > 0 && (
        <Card className="border-mly-100 dark:border-mly-900/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-mly-500" aria-hidden="true" />
                Pending Rewards
              </CardTitle>
              <Link href="/rewards" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                Claim all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" aria-label="Pending rewards">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.description}</p>
                  </div>
                  <Badge variant="mly" className="shrink-0 ml-2">{r.amount} $MLY</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick actions grid */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/health">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                <Heart className="h-3.5 w-3.5 mr-2 text-pink-500" aria-hidden="true" />
                Daily check-in
              </Button>
            </Link>
            <Link href="/governance">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                <Landmark className="h-3.5 w-3.5 mr-2 text-purple-500" aria-hidden="true" />
                Vote on proposals
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                <MessageCircle className="h-3.5 w-3.5 mr-2 text-teal-500" aria-hidden="true" />
                Join discussion
              </Button>
            </Link>
            <Link href="/bounties">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                <TrendingUp className="h-3.5 w-3.5 mr-2 text-mly-500" aria-hidden="true" />
                Claim a bounty
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Build 7-day earnings chart from recent transactions */
function buildChartData(transactions: { amount: number; type: string; created_at: string }[]) {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'MMM d');
    days[day] = 0;
  }

  for (const tx of transactions) {
    const day = format(new Date(tx.created_at), 'MMM d');
    if (days[day] !== undefined) {
      days[day] += tx.amount;
    }
  }

  return Object.entries(days).map(([day, amount]) => ({ day, amount }));
}
