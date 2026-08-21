'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface PlatformStats {
  totalUsers: number;
  totalIssues: number;
  issuesResolved: number;
  mlyCirculation: number;
  aidFulfilled: number;
  coursesCompleted: number;
}

interface MonthlyStats {
  issuesThisMonth: number;
  checkinsThisMonth: number;
  mlyDistributedThisMonth: number;
}

export default function ImpactPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalIssues: 0,
    issuesResolved: 0,
    mlyCirculation: 0,
    aidFulfilled: 0,
    coursesCompleted: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyStats>({
    issuesThisMonth: 0,
    checkinsThisMonth: 0,
    mlyDistributedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      // Total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total issues
      const { count: issueCount } = await supabase
        .from('city_issues')
        .select('*', { count: 'exact', head: true });

      // Issues resolved
      const { count: resolvedCount } = await supabase
        .from('city_issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      // MLY in circulation (sum of all balances)
      const { data: balanceData } = await supabase
        .from('profiles')
        .select('mly_balance');
      const mlyTotal = balanceData?.reduce((sum: number, p: any) => sum + (p.mly_balance || 0), 0) || 0;

      // Mutual aid fulfilled
      const { count: aidCount } = await supabase
        .from('aid_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fulfilled');

      // Courses completed
      const { count: courseCount } = await supabase
        .from('course_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      setStats({
        totalUsers: userCount || 0,
        totalIssues: issueCount || 0,
        issuesResolved: resolvedCount || 0,
        mlyCirculation: mlyTotal,
        aidFulfilled: aidCount || 0,
        coursesCompleted: courseCount || 0,
      });

      // Monthly stats
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartISO = monthStart.toISOString();

      const { count: monthIssues } = await supabase
        .from('city_issues')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStartISO);

      const { count: monthCheckins } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStartISO);

      const { data: monthTxs } = await supabase
        .from('mly_transactions')
        .select('amount')
        .is('from_id', null)
        .gte('created_at', monthStartISO);
      const monthMly = monthTxs?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      setMonthly({
        issuesThisMonth: monthIssues || 0,
        checkinsThisMonth: monthCheckins || 0,
        mlyDistributedThisMonth: monthMly,
      });

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3,4].map(i => <div key={i} className="card skeleton h-28" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Public Impact</h1>
        <p className="text-xs text-gray-500">Real numbers. Real community progress. Transparent by design.</p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-gradient-to-br from-teal-500 to-teal-600 text-white p-5">
          <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-teal-100 mt-1">Community Members</p>
        </div>
        <div className="card bg-gradient-to-br from-harbor-800 to-harbor-700 text-white p-5">
          <p className="text-3xl font-bold">${stats.mlyCirculation.toLocaleString()}</p>
          <p className="text-xs text-harbor-300 mt-1">MLY in Circulation</p>
        </div>
      </div>

      {/* Civic stats */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500">Civic Engagement</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-harbor-800 dark:text-white">{stats.totalIssues.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Issues Reported</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-teal-500">{stats.issuesResolved.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Issues Resolved</p>
          </div>
        </div>
      </div>

      {/* Community stats */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500">Community Power</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gold-500">{stats.aidFulfilled.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Mutual Aid Fulfilled</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-harbor-800 dark:text-white">{stats.coursesCompleted.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Courses Completed</p>
          </div>
        </div>
      </div>

      {/* This Month */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500">This Month</p>
        <div className="card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">Issues Reported</span>
              </div>
              <span className="text-sm font-bold text-harbor-800 dark:text-white">{monthly.issuesThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">👋</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">Community Check-ins</span>
              </div>
              <span className="text-sm font-bold text-harbor-800 dark:text-white">{monthly.checkinsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">💰</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">MLY Distributed</span>
              </div>
              <span className="text-sm font-bold text-teal-500">${monthly.mlyDistributedThisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution rate */}
      <div className="card">
        <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Issue Resolution Rate</p>
        <div className="w-full h-3 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: `${stats.totalIssues > 0 ? (stats.issuesResolved / stats.totalIssues * 100).toFixed(0) : 0}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {stats.totalIssues > 0 ? (stats.issuesResolved / stats.totalIssues * 100).toFixed(0) : 0}% of reported issues resolved
        </p>
      </div>

      {/* Footer message */}
      <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          All data is real-time from the MiLyfe platform. Every number represents real community action.
        </p>
      </div>
    </div>
  );
}
