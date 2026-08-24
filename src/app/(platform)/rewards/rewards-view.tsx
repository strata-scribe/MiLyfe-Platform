'use client';

import { Gift, Trophy, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/types/database';

interface Props {
  userId: string;
  pendingRewards: Tables<'rewards'>[];
  claimedRewards: Tables<'rewards'>[];
  badges: any[];
}

export function RewardsView({ userId, pendingRewards, claimedRewards, badges }: Props) {
  async function claimReward(rewardId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('rewards')
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq('id', rewardId)
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to claim reward');
    } else {
      toast.success('Reward claimed! $MLY added to your wallet.');
      // Optimistic: page will refetch on next visit
    }
  }

  const totalPending = pendingRewards.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Rewards</h1>
        <p className="page-subtitle">Earn by contributing to your community</p>
      </div>

      {/* Summary */}
      {totalPending > 0 && (
        <Card className="border-mly-200 dark:border-mly-800 bg-mly-50/50 dark:bg-mly-900/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-mly-100 dark:bg-mly-900/30">
                <Sparkles className="h-5 w-5 text-mly-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-harbor-800 dark:text-white">
                  {totalPending.toFixed(0)} $MLY waiting
                </p>
                <p className="text-xs text-gray-500">{pendingRewards.length} rewards to claim</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-mly-500" aria-hidden="true" />
            Pending Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No pending rewards"
              description="Participate in the community to earn $MLY — vote, post, connect, check in."
              className="py-6"
            />
          ) : (
            <ul className="space-y-3" aria-label="Pending rewards">
              {pendingRewards.map((reward) => (
                <li key={reward.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-mly-50 dark:bg-mly-900/20">
                      <Clock className="h-4 w-4 text-mly-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{reward.title}</p>
                      <p className="text-xs text-gray-500">{reward.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="mly">{reward.amount} $MLY</Badge>
                    <Button size="sm" variant="mly" onClick={() => claimReward(reward.id)}>
                      Claim
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-teal-500" aria-hidden="true" />
            Badges Earned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No badges yet — keep building your standing!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((ub) => (
                <div key={ub.id} className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-harbor-900">
                  <span className="text-2xl mb-1" role="img" aria-label={ub.badge?.name}>{ub.badge?.icon}</span>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">{ub.badge?.name}</p>
                  <p className="text-[10px] text-gray-500">{ub.badge?.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claimed history */}
      {claimedRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" aria-label="Claimed rewards history">
              {claimedRewards.map((reward) => (
                <li key={reward.id} className="flex items-center justify-between text-sm py-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                    <span className="text-gray-600 dark:text-gray-400">{reward.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {reward.claimed_at && formatDistanceToNow(new Date(reward.claimed_at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
