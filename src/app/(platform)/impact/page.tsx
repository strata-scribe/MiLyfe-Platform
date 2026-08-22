'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { format, subDays, startOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Stats {
  totalUsers: number;
  issuesReported: number;
  issuesResolved: number;
  mlyCirculation: number;
  aidFulfilled: number;
  coursesCompleted: number;
}

interface DailyActivity {
  date: string;
  issues: number;
  checkins: number;
  transactions: number;
}

interface CategoryBreakdown {
  name: string;
  value: number;
}

interface NeighborhoodActivity {
  name: string;
  count: number;
}

interface WeeklyGrowth {
  week: string;
  users: number;
}

const CHART_COLORS = ['#14b8a6', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

const statIcons: Record<string, string> = {
  totalUsers: '👥',
  issuesReported: '📋',
  issuesResolved: '✅',
  mlyCirculation: '💰',
  aidFulfilled: '🤝',
  coursesCompleted: '🎓',
};

export default function ImpactPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    issuesReported: 0,
    issuesResolved: 0,
    mlyCirculation: 0,
    aidFulfilled: 0,
    coursesCompleted: 0,
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodActivity[]>([]);
  const [weeklyGrowth, setWeeklyGrowth] = useState<WeeklyGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    setLoading(true);

    // Total users
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Issues
    const { count: issuesTotal } = await supabase
      .from('city_issues')
      .select('*', { count: 'exact', head: true });

    const { count: issuesResolved } = await supabase
      .from('city_issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    // MLY circulation
    const { data: mlyData } = await supabase
      .from('mly_transactions')
      .select('amount');

    const mlyTotal = mlyData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Aid fulfilled
    const { count: aidCount } = await supabase
      .from('aid_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'fulfilled');

    // Courses completed
    const { count: coursesCount } = await supabase
      .from('course_progress')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    setStats({
      totalUsers: userCount || 0,
      issuesReported: issuesTotal || 0,
      issuesResolved: issuesResolved || 0,
      mlyCirculation: mlyTotal,
      aidFulfilled: aidCount || 0,
      coursesCompleted: coursesCount || 0,
    });

    // Daily activity (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    const { data: recentIssues } = await supabase
      .from('city_issues')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo);

    const { data: recentCheckins } = await supabase
      .from('health_checkins')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo);

    const { data: recentTransactions } = await supabase
      .from('mly_transactions')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo);

    // Aggregate by day
    const dayMap: Record<string, DailyActivity> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d');
      dayMap[d] = { date: d, issues: 0, checkins: 0, transactions: 0 };
    }

    recentIssues?.forEach((item) => {
      const d = format(new Date(item.created_at), 'MMM d');
      if (dayMap[d]) dayMap[d].issues++;
    });

    recentCheckins?.forEach((item) => {
      const d = format(new Date(item.created_at), 'MMM d');
      if (dayMap[d]) dayMap[d].checkins++;
    });

    recentTransactions?.forEach((item) => {
      const d = format(new Date(item.created_at), 'MMM d');
      if (dayMap[d]) dayMap[d].transactions++;
    });

    setDailyActivity(Object.values(dayMap));

    // Category breakdown
    const { data: categories } = await supabase
      .from('city_issues')
      .select('category');

    const catMap: Record<string, number> = {};
    categories?.forEach((item) => {
      const cat = item.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    setCategoryBreakdown(
      Object.entries(catMap)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .sort((a, b) => b.value - a.value)
    );

    // Top neighborhoods
    const { data: neighborhoodData } = await supabase
      .from('city_issues')
      .select('neighborhood');

    const neighMap: Record<string, number> = {};
    neighborhoodData?.forEach((item) => {
      const n = item.neighborhood || 'Unknown';
      neighMap[n] = (neighMap[n] || 0) + 1;
    });

    setNeighborhoods(
      Object.entries(neighMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    );

    // Weekly growth (user signups)
    const { data: profileDates } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (profileDates && profileDates.length > 0) {
      const weeks = eachWeekOfInterval({
        start: subWeeks(new Date(), 11),
        end: new Date(),
      });

      const weeklyData = weeks.map((weekStart) => {
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const count = profileDates.filter((p) => {
          const d = new Date(p.created_at);
          return d >= weekStart && d < weekEnd;
        }).length;

        return {
          week: format(weekStart, 'MMM d'),
          users: count,
        };
      });

      setWeeklyGrowth(weeklyData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const resolutionRate = stats.issuesReported > 0
    ? Math.round((stats.issuesResolved / stats.issuesReported) * 100)
    : 0;

  const resolutionColor = resolutionRate >= 70 ? 'bg-green-500' : resolutionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  const resolutionTextColor = resolutionRate >= 70 ? 'text-green-600' : resolutionRate >= 40 ? 'text-yellow-600' : 'text-red-600';

  const statCards = [
    { key: 'totalUsers', label: 'Total Users', value: stats.totalUsers },
    { key: 'issuesReported', label: 'Issues Reported', value: stats.issuesReported },
    { key: 'issuesResolved', label: 'Issues Resolved', value: stats.issuesResolved },
    { key: 'mlyCirculation', label: '$MLY in Circulation', value: stats.mlyCirculation, prefix: '$' },
    { key: 'aidFulfilled', label: 'Aid Fulfilled', value: stats.aidFulfilled },
    { key: 'coursesCompleted', label: 'Courses Completed', value: stats.coursesCompleted },
  ];

  if (loading) {
    return (
      <div className="space-y-5 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Impact Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Loading community data...</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card skeleton h-24" />)}
        </div>
        <div className="card skeleton h-48" />
        <div className="card skeleton h-56" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Impact Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Public community stats. Real numbers, real impact.
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map((stat) => (
          <div key={stat.key} className="card text-center space-y-1 hover:shadow-md transition-shadow">
            <span className="text-2xl">{statIcons[stat.key]}</span>
            <p className="text-xl sm:text-2xl font-bold text-harbor-800 dark:text-white">
              {stat.prefix || ''}{stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Resolution Rate */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Issue Resolution Rate</h3>
          <span className={cn('text-lg font-bold', resolutionTextColor)}>{resolutionRate}%</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', resolutionColor)}
            style={{ width: `${resolutionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {stats.issuesResolved} of {stats.issuesReported} issues resolved
        </p>
      </div>

      {/* This Month Activity Chart */}
      <div className="card space-y-3">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Activity (Last 30 Days)</h3>
        {dailyActivity.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={6}
                />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="issues" stroke="#14b8a6" fill="url(#colorIssues)" strokeWidth={2} name="Issues" />
                <Area type="monotone" dataKey="checkins" stroke="#f59e0b" fill="url(#colorCheckins)" strokeWidth={2} name="Check-ins" />
                <Area type="monotone" dataKey="transactions" stroke="#3b82f6" fill="url(#colorTransactions)" strokeWidth={2} name="Transactions" />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400 text-sm">No activity data available.</p>
        )}
      </div>

      {/* Community Health */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Category Pie Chart */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Issue Categories</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400 text-xs">No data yet.</p>
          )}
        </div>

        {/* Top Neighborhoods */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Top Neighborhoods</h3>
          {neighborhoods.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={neighborhoods} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 6, 6, 0]} name="Activity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400 text-xs">No data yet.</p>
          )}
        </div>
      </div>

      {/* Growth Chart */}
      <div className="card space-y-3">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">User Growth (12 Weeks)</h3>
        {weeklyGrowth.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#colorGrowth)" strokeWidth={2} name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400 text-sm">No growth data yet.</p>
        )}
      </div>

      {/* Footer note */}
      <div className="text-center pb-4">
        <p className="text-xs text-gray-400">
          Data refreshes in real time. All stats are publicly accessible.
        </p>
      </div>
    </div>
  );
}
