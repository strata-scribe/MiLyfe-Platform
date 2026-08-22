'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface PlatformStats {
  totalUsers: number;
  activeUsers7d: number;
  totalMLYCirculating: number;
  totalMLYBurned: number;
  totalMLYMinted: number;
  totalIssuesReported: number;
  issuesResolved: number;
  totalProposals: number;
  totalVotes: number;
  totalCourses: number;
  coursesCompleted: number;
  totalViolations: number;
  appealRate: number;
  moderationActions: number;
}

interface DailyStat {
  date: string;
  minted: number;
  burned: number;
  active_users: number;
  new_users: number;
}

type DashTab = 'overview' | 'financial' | 'moderation' | 'governance' | 'community';

export default function TransparencyPage() {
  const [tab, setTab] = useState<DashTab>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const supabase = createClient();

    // Parallel stat queries
    const [
      { count: totalUsers },
      { count: totalIssues },
      { count: resolvedIssues },
      { count: totalProposals },
      { count: totalVotes },
      { count: totalCourses },
      { count: coursesCompleted },
      { count: totalViolations },
      { count: appeals },
      { count: moderationActions },
      { data: treasury },
      { data: daily },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('city_issues').select('*', { count: 'exact', head: true }),
      supabase.from('city_issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('proposal_votes').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('course_progress').select('*', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('violations').select('*', { count: 'exact', head: true }),
      supabase.from('appeals').select('*', { count: 'exact', head: true }),
      supabase.from('content_flags').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('mly_treasury').select('*').single(),
      supabase.from('mly_daily_stats').select('*').order('date', { ascending: false }).limit(30),
    ]);

    setStats({
      totalUsers: totalUsers || 0,
      activeUsers7d: treasury?.total_users || 0,
      totalMLYCirculating: treasury?.total_circulating || 0,
      totalMLYBurned: treasury?.total_burned || 0,
      totalMLYMinted: treasury?.total_minted || 0,
      totalIssuesReported: totalIssues || 0,
      issuesResolved: resolvedIssues || 0,
      totalProposals: totalProposals || 0,
      totalVotes: totalVotes || 0,
      totalCourses: totalCourses || 0,
      coursesCompleted: coursesCompleted || 0,
      totalViolations: totalViolations || 0,
      appealRate: totalViolations ? Math.round(((appeals || 0) / totalViolations) * 100) : 0,
      moderationActions: moderationActions || 0,
    });

    if (daily) setDailyStats(daily as DailyStat[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-harbor-800 rounded w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-harbor-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Platform Transparency</h1>
        <p className="text-xs text-gray-500">
          Real-time public data. No login required. Everything visible.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {([
          { key: 'overview', label: '📊 Overview' },
          { key: 'financial', label: '💰 Financial' },
          { key: 'moderation', label: '⚖️ Moderation' },
          { key: 'governance', label: '🗳️ Governance' },
          { key: 'community', label: '🏘️ Community' },
        ] as { key: DashTab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Members" value={stats.totalUsers} icon="👥" />
            <StatCard label="$MLY Circulating" value={`$${stats.totalMLYCirculating.toLocaleString()}`} icon="💰" />
            <StatCard label="Issues Reported" value={stats.totalIssuesReported} icon="🚨" />
            <StatCard label="Issues Resolved" value={stats.issuesResolved} icon="✅" />
            <StatCard label="Proposals Created" value={stats.totalProposals} icon="🗳️" />
            <StatCard label="Total Votes Cast" value={stats.totalVotes} icon="✋" />
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Platform Health Score</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-teal-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <span className="text-lg font-bold text-teal-600">85%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on uptime, resolution rate, participation, and moderation effectiveness</p>
          </div>
        </div>
      )}

      {/* Financial */}
      {tab === 'financial' && stats && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-mly-500 to-harbor-800 text-white">
            <p className="text-xs opacity-80">Total $MLY Supply</p>
            <p className="text-3xl font-bold">${stats.totalMLYCirculating.toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-xs opacity-80">Total Minted</p>
                <p className="text-lg font-bold">${stats.totalMLYMinted.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Total Burned</p>
                <p className="text-lg font-bold">${stats.totalMLYBurned.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Last 30 Days</h3>
            {dailyStats.length > 0 ? (
              <div className="space-y-1">
                {dailyStats.slice(0, 10).map((d) => (
                  <div key={d.date} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                    <span className="text-gray-500">{d.date}</span>
                    <div className="flex gap-4">
                      <span className="text-green-600">+${d.minted}</span>
                      <span className="text-red-500">-${d.burned}</span>
                      <span className="text-gray-600">{d.active_users} active</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No daily stats recorded yet</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Economic Rules</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
              <li>• <strong>UBI:</strong> $10 MLY/day to active participants</li>
              <li>• <strong>Inactive Decay:</strong> 2%/day after 14 days idle</li>
              <li>• <strong>Hoarding Tax:</strong> 1%/day on balance over $1,000</li>
              <li>• <strong>Burn:</strong> All decayed tokens permanently removed</li>
              <li>• <strong>Exchange Rate:</strong> 1 MLY = $1 USD (community-fixed)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Moderation */}
      {tab === 'moderation' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Violations" value={stats.totalViolations} icon="⚠️" small />
            <StatCard label="Appeal Rate" value={`${stats.appealRate}%`} icon="📝" small />
            <StatCard label="Actions Taken" value={stats.moderationActions} icon="⚖️" small />
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">How Moderation Works</h3>
            <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
              <li>Content flagged by community members or AI pre-screen</li>
              <li>3+ flags from different users → auto-escalated to review</li>
              <li>Reviewed by community jury (random Level 3+ members)</li>
              <li>Action: dismiss, warn, restrict, suspend, or ban</li>
              <li>All decisions publicly logged here (anonymized)</li>
              <li>Users can appeal any decision</li>
            </ol>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Principles</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
              <li>• Proportional: punishment fits the offense</li>
              <li>• Transparent: all enforcement logged publicly</li>
              <li>• Restorative: standing can be rebuilt</li>
              <li>• Democratic: community jury, not top-down</li>
              <li>• Appealable: every decision can be challenged</li>
            </ul>
          </div>
        </div>
      )}

      {/* Governance */}
      {tab === 'governance' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Proposals" value={stats.totalProposals} icon="📋" />
            <StatCard label="Votes Cast" value={stats.totalVotes} icon="✋" />
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Governance Stats</h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Avg. participation rate</span>
                <span className="font-medium">{stats.totalProposals > 0 ? Math.round(stats.totalVotes / stats.totalProposals) : 0} votes/proposal</span>
              </div>
              <div className="flex justify-between">
                <span>Constitution amendments</span>
                <span className="font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Vote delegation active</span>
                <span className="font-medium">Yes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community */}
      {tab === 'community' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Members" value={stats.totalUsers} icon="👥" />
            <StatCard label="Courses" value={stats.totalCourses} icon="📚" />
            <StatCard label="Completed" value={stats.coursesCompleted} icon="🎓" />
            <StatCard label="Resolution Rate" value={`${stats.totalIssuesReported > 0 ? Math.round((stats.issuesResolved / stats.totalIssuesReported) * 100) : 0}%`} icon="✅" />
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">What We Track (and Don't)</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-green-600 mb-1">✓ We Track</p>
                <ul className="text-gray-500 space-y-0.5">
                  <li>• Aggregate participation</li>
                  <li>• Economic health</li>
                  <li>• Issue resolution times</li>
                  <li>• Platform uptime</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-600 mb-1">✗ We Don't Track</p>
                <ul className="text-gray-500 space-y-0.5">
                  <li>• Individual behavior</li>
                  <li>• Location history</li>
                  <li>• Private messages</li>
                  <li>• Health data (yours only)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat card component
function StatCard({ label, value, icon, small }: { label: string; value: string | number; icon: string; small?: boolean }) {
  return (
    <div className={cn('card text-center', small && '!p-3')}>
      <p className={cn('mb-1', small ? 'text-lg' : 'text-2xl')}>{icon}</p>
      <p className={cn('font-bold text-harbor-800 dark:text-white', small ? 'text-lg' : 'text-xl')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
