'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TreasuryData {
  total_circulating: number;
  total_minted: number;
  total_burned: number;
  total_users: number;
  velocity_7d: number;
}

interface DailyStat {
  date: string;
  minted: number;
  burned: number;
  transferred: number;
  earned: number;
  spent: number;
  active_users: number;
  new_users: number;
}

export default function TokenomicsPage() {
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: t } = await supabase.from('mly_treasury').select('*').single();
    if (t) setTreasury(t as TreasuryData);

    const { data: stats } = await supabase.from('mly_daily_stats').select('*').order('date', { ascending: false }).limit(30);
    if (stats) setDailyStats(stats as DailyStat[]);
    setLoading(false);
  }

  const avgDaily = dailyStats.length > 0
    ? dailyStats.reduce((sum, d) => sum + d.minted, 0) / dailyStats.length
    : 0;
  const avgBurn = dailyStats.length > 0
    ? dailyStats.reduce((sum, d) => sum + d.burned, 0) / dailyStats.length
    : 0;
  const netInflation = avgDaily - avgBurn;
  const avgPerUser = treasury && treasury.total_users > 0
    ? treasury.total_circulating / treasury.total_users
    : 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-harbor-800 rounded w-48" />
        <div className="h-40 bg-gray-200 dark:bg-harbor-800 rounded-xl" />
        <div className="h-32 bg-gray-200 dark:bg-harbor-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">$MLY Tokenomics</h1>
        <p className="text-xs text-gray-500">
          Real-time economics of the MiLyfe community currency. 100% transparent.
        </p>
      </div>

      {/* Supply overview */}
      <div className="card bg-gradient-to-br from-harbor-800 to-harbor-900 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs opacity-70">Circulating Supply</p>
            <p className="text-2xl font-bold">${(treasury?.total_circulating || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Total Users</p>
            <p className="text-2xl font-bold">{(treasury?.total_users || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Total Minted (All-time)</p>
            <p className="text-lg font-bold text-green-300">${(treasury?.total_minted || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Total Burned (All-time)</p>
            <p className="text-lg font-bold text-red-300">${(treasury?.total_burned || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500">Avg. Balance/User</p>
          <p className="text-xl font-bold text-harbor-800 dark:text-white">${avgPerUser.toFixed(0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">7-Day Velocity</p>
          <p className="text-xl font-bold text-harbor-800 dark:text-white">{(treasury?.velocity_7d || 0).toFixed(2)}x</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Daily Net Inflation</p>
          <p className={`text-xl font-bold ${netInflation > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {netInflation > 0 ? '+' : ''}{netInflation.toFixed(0)}/day
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Burn Rate</p>
          <p className="text-xl font-bold text-red-500">${avgBurn.toFixed(0)}/day</p>
        </div>
      </div>

      {/* Economic rules */}
      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Economic Mechanics</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <span className="text-xl">📈</span>
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-400">Minting (Inflow)</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">UBI ($10/day/active user) + Rewards (tasks, content, courses, recordings)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <span className="text-xl">📉</span>
            <div>
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Burning (Outflow)</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Inactive decay (2%/day after 14d) + Hoarding tax (1%/day over $1,000) + Violation fines</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <span className="text-xl">🔄</span>
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Circulation</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">P2P transfers, shop purchases, business payments, tips, guild payouts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily history */}
      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Daily Flow (Last 30 Days)</h3>
        {dailyStats.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No daily data recorded yet. Stats populate after the first UBI distribution.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 dark:border-harbor-800">
                  <th className="text-left py-1.5 font-medium">Date</th>
                  <th className="text-right py-1.5 font-medium">Minted</th>
                  <th className="text-right py-1.5 font-medium">Burned</th>
                  <th className="text-right py-1.5 font-medium">Net</th>
                  <th className="text-right py-1.5 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.slice(0, 14).map((d) => (
                  <tr key={d.date} className="border-b border-gray-50 dark:border-harbor-800/50">
                    <td className="py-1.5 text-gray-600 dark:text-gray-300">{d.date}</td>
                    <td className="py-1.5 text-right text-green-600">+${d.minted}</td>
                    <td className="py-1.5 text-right text-red-500">-${d.burned}</td>
                    <td className={`py-1.5 text-right font-medium ${d.minted - d.burned > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {d.minted - d.burned > 0 ? '+' : ''}{d.minted - d.burned}
                    </td>
                    <td className="py-1.5 text-right text-gray-500">{d.active_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projections */}
      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Projections</h3>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex justify-between">
            <span>At current rate, supply in 30 days:</span>
            <span className="font-medium">${((treasury?.total_circulating || 0) + (netInflation * 30)).toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>If 100 users join (additional UBI):</span>
            <span className="font-medium">+$1,000/day minting</span>
          </div>
          <div className="flex justify-between">
            <span>Break-even users (mint = burn):</span>
            <span className="font-medium">{avgBurn > 0 ? Math.ceil(avgBurn / 10) : '∞'} active users</span>
          </div>
        </div>
      </div>

      {/* How to earn/spend */}
      <div className="card bg-mly-50 dark:bg-mly-900/10 border-mly-200 dark:border-mly-800">
        <h3 className="text-sm font-bold text-mly-700 dark:text-mly-400 mb-2">💡 Remember</h3>
        <p className="text-xs text-mly-600 dark:text-mly-300">
          $MLY is designed to flow, not to be saved. The healthiest economy is one where everyone 
          earns, spends, and circulates. Your participation IS the value.
        </p>
      </div>
    </div>
  );
}
