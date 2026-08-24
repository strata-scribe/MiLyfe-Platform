'use client';

import Link from 'next/link';
import { Wallet, Star, Gift, Bell, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/types/database';

interface Props {
  profile: Tables<'profiles'> | null;
  wallet: Tables<'wallets'> | null;
  standing: Tables<'standing'> | null;
  rewards: Tables<'rewards'>[];
  notifications: Tables<'notifications'>[];
}

export function HomeDashboard({ profile, wallet, standing, rewards, notifications }: Props) {
  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="page-title">
          Hey, {profile?.display_name || 'Citizen'} 👋
        </h1>
        <p className="page-subtitle">Here&apos;s your community at a glance</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link href="/wallet" className="card group flex flex-col items-center justify-center py-5">
          <Wallet className="h-6 w-6 text-mly-500 mb-1 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <p className="text-xl font-bold text-harbor-800 dark:text-white">
            {totalBalance.toFixed(0)} <span className="text-sm text-mly-500">$MLY</span>
          </p>
          <p className="text-xs text-gray-500">Total Balance</p>
        </Link>

        <Link href="/standing" className="card group flex flex-col items-center justify-center py-5">
          <Star className="h-6 w-6 text-teal-500 mb-1 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <p className="text-xl font-bold text-harbor-800 dark:text-white">
            {standing?.overall?.toFixed(0) || 0}
          </p>
          <p className="text-xs text-gray-500">Standing</p>
        </Link>

        <Link href="/rewards" className="card group flex flex-col items-center justify-center py-5 col-span-2 md:col-span-1">
          <Gift className="h-6 w-6 text-purple-500 mb-1 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <p className="text-xl font-bold text-harbor-800 dark:text-white">
            {rewards.length}
          </p>
          <p className="text-xs text-gray-500">Unclaimed Rewards</p>
        </Link>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Recent Activity
              </CardTitle>
              <Badge variant="default">{notifications.length} new</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3" aria-label="Recent notifications">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-teal-500 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-harbor-800 dark:text-white truncate">{n.title}</p>
                    {n.body && <p className="text-gray-500 text-xs truncate">{n.body}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/connect">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                Find neighbors
              </Button>
            </Link>
            <Link href="/governance">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                Vote on proposals
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                Join discussion
              </Button>
            </Link>
            <Link href="/health">
              <Button variant="outline" className="w-full justify-start text-xs h-auto py-3">
                Daily check-in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Rewards preview */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-mly-500" aria-hidden="true" />
                Pending Rewards
              </CardTitle>
              <Link href="/rewards" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" aria-label="Pending rewards">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.description}</p>
                  </div>
                  <Badge variant="mly">{r.amount} $MLY</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
