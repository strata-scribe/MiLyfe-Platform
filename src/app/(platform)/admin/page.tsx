'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type AdminTab = 'issues' | 'users' | 'stats';

interface AdminIssue {
  id: string;
  title: string;
  category: string;
  status: string;
  upvotes: number;
  address: string | null;
  created_at: string;
  profiles?: { display_name: string; email: string };
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  mly_balance: number;
  city: string;
  role: string;
  safety_mode: boolean;
  health_streak: number;
  trust_score: number;
  created_at: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('issues');
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIssues: 0,
    openIssues: 0,
    totalMly: 0,
    activeToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Check admin access
  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setAuthorized(true);
      } else {
        // For now, allow the first user or anyone to view (dev mode)
        // In production, check role === 'admin'
        setAuthorized(true);
      }
    };

    checkAdmin();
  }, [user, supabase]);

  // Load admin data
  useEffect(() => {
    if (!authorized) return;

    const loadData = async () => {
      // Stats
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: issueCount } = await supabase
        .from('city_issues')
        .select('*', { count: 'exact', head: true });

      const { count: openCount } = await supabase
        .from('city_issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const today = new Date().toISOString().split('T')[0];
      const { count: activeCount } = await supabase
        .from('health_checkins')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`);

      setStats({
        totalUsers: userCount ?? 0,
        totalIssues: issueCount ?? 0,
        openIssues: openCount ?? 0,
        totalMly: 0,
        activeToday: activeCount ?? 0,
      });

      // Issues
      const { data: issueData } = await supabase
        .from('city_issues')
        .select('*, profiles!city_issues_reporter_id_fkey(display_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (issueData) setIssues(issueData);

      // Users
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (userData) setUsers(userData);

      setLoading(false);
    };

    loadData();
  }, [authorized, supabase]);

  const updateIssueStatus = async (issueId: string, newStatus: string) => {
    await supabase
      .from('city_issues')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', issueId);

    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
    );
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  if (!authorized) {
    return (
      <div className="text-center py-16 animate-slide-up">
        <p className="text-4xl mb-3">🔒</p>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Admin Access Required</h1>
        <p className="text-gray-500 mt-2">You need admin privileges to view this page.</p>
        <button onClick={() => router.push('/home')} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-harbor-800 dark:text-white">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-teal-500">{stats.activeToday}</p>
          <p className="text-xs text-gray-500">Active Today</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-500">{stats.openIssues}</p>
          <p className="text-xs text-gray-500">Open Issues</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-harbor-600 dark:text-harbor-300">{stats.totalIssues}</p>
          <p className="text-xs text-gray-500">Total Issues</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {(['issues', 'users', 'stats'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Issues Management */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="card skeleton h-20" />)
          ) : issues.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No issues yet.</p>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-harbor-800 dark:text-white truncate">{issue.title}</h3>
                    <p className="text-xs text-gray-500">
                      {(issue.profiles as any)?.display_name ?? 'Unknown'} · {issue.category} · {issue.upvotes} upvotes
                    </p>
                    {issue.address && (
                      <p className="text-xs text-gray-400 mt-0.5">📍 {issue.address}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={issue.status}
                    onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg border font-medium',
                      issue.status === 'open' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                      issue.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-green-50 border-green-200 text-green-700'
                    )}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <span className="text-[10px] text-gray-400">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="card skeleton h-16" />)
          ) : (
            users.map((u) => (
              <div key={u.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-sm font-bold text-harbor-600">
                  {u.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{u.display_name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email} · {u.city}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-mly-600">{u.mly_balance.toFixed(0)} MLY</span>
                    <span className="text-xs text-gray-400">Trust: {u.trust_score}</span>
                    {u.safety_mode && <span className="text-xs text-red-500">🛡️ Safety</span>}
                  </div>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => updateUserRole(u.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-900"
                >
                  <option value="citizen">Citizen</option>
                  <option value="business">Business</option>
                  <option value="advocate">Advocate</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {/* Platform Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Platform Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Users</span>
                <span className="text-sm font-bold text-harbor-800 dark:text-white">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Active today</span>
                <span className="text-sm font-bold text-teal-500">{stats.activeToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Issues (open/total)</span>
                <span className="text-sm font-bold text-harbor-800 dark:text-white">{stats.openIssues}/{stats.totalIssues}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Resolution rate</span>
                <span className="text-sm font-bold text-teal-500">
                  {stats.totalIssues > 0
                    ? `${Math.round(((stats.totalIssues - stats.openIssues) / stats.totalIssues) * 100)}%`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  fetch('/api/ubi', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_UBI_SECRET || 'milyfe-ubi-secret-2026'}` },
                  }).then((r) => r.json()).then((d) => {
                    alert(`UBI distributed to ${d.distributed} users!`);
                  });
                }}
                className="btn-gold w-full text-sm"
              >
                💰 Trigger UBI Distribution Now
              </button>
              <button
                onClick={() => router.push('/city')}
                className="btn-primary w-full text-sm"
              >
                📋 View Public Issue Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
