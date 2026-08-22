'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface SystemStats { users: number; activeToday: number; totalMLY: number; pendingFlags: number; openTickets: number; activeBroadcasts: number; }
interface Flag { id: string; content_type: string; content_id: string; reason: string; status: string; created_at: string; reporter?: { display_name: string }; }
interface FlagWithReporter extends Flag { profiles?: { display_name: string }; }

type AdminTab = 'overview' | 'moderation' | 'users' | 'flags' | 'system';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [flags, setFlags] = useState<FlagWithReporter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: users },
      { count: pendingFlags },
      { count: openTickets },
      { count: activeBroadcasts },
      { data: flagData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('content_flags').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('broadcasts').select('*', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
      supabase.from('content_flags').select('*, profiles!content_flags_reporter_id_fkey(display_name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
    ]);

    setStats({
      users: users || 0,
      activeToday: 0,
      totalMLY: 0,
      pendingFlags: pendingFlags || 0,
      openTickets: openTickets || 0,
      activeBroadcasts: activeBroadcasts || 0,
    });
    if (flagData) setFlags(flagData as any);
    setLoading(false);
  }

  async function resolveFlag(flagId: string, action: 'resolved' | 'dismissed') {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('content_flags').update({ status: action, reviewed_by: user.id, action_taken: action }).eq('id', flagId);
    setFlags(prev => prev.filter(f => f.id !== flagId));
    setStats(prev => prev ? { ...prev, pendingFlags: prev.pendingFlags - 1 } : prev);
  }

  if (user?.role !== 'admin' && user?.role !== 'advocate') {
    return <div className="text-center py-12"><p className="text-sm text-gray-500">🔒 Admin access required.</p></div>;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div><h1 className="text-xl font-bold text-harbor-800 dark:text-white">⚙️ Admin Dashboard</h1><p className="text-xs text-gray-500">Platform management and moderation</p></div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {(['overview', 'moderation', 'users', 'flags', 'system'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-2 rounded-full text-xs font-medium capitalize whitespace-nowrap', tab === t ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center"><p className="text-2xl font-bold text-harbor-800 dark:text-white">{stats.users}</p><p className="text-xs text-gray-500">Total Users</p></div>
            <div className="card text-center"><p className="text-2xl font-bold text-red-500">{stats.pendingFlags}</p><p className="text-xs text-gray-500">Pending Flags</p></div>
            <div className="card text-center"><p className="text-2xl font-bold text-amber-500">{stats.openTickets}</p><p className="text-xs text-gray-500">Open Tickets</p></div>
            <div className="card text-center"><p className="text-2xl font-bold text-blue-500">{stats.activeBroadcasts}</p><p className="text-xs text-gray-500">Active Alerts</p></div>
          </div>
          <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTab('moderation')} className="py-2 px-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-xs text-red-700 dark:text-red-400 font-medium text-left">🚨 Review Flags ({stats.pendingFlags})</button>
              <button onClick={() => setTab('system')} className="py-2 px-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-700 dark:text-blue-400 font-medium text-left">⚙️ Feature Flags</button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation queue */}
      {(tab === 'moderation' || tab === 'flags') && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Moderation Queue ({flags.length})</h3>
          {flags.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">✅ No pending flags. Queue is clear.</p></div> :
          flags.map(flag => (
            <div key={flag.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex gap-2 text-xs mb-1">
                    <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded capitalize">{flag.reason}</span>
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{flag.content_type}</span>
                  </div>
                  <p className="text-xs text-gray-500">Reported by {(flag.profiles as any)?.display_name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(flag.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => resolveFlag(flag.id, 'resolved')} className="flex-1 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg">Remove Content</button>
                <button onClick={() => resolveFlag(flag.id, 'dismissed')} className="flex-1 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="card text-center py-8"><p className="text-sm text-gray-500">User management interface — search, view profiles, apply restrictions.</p><p className="text-xs text-gray-400 mt-1">Use the accountability system for enforcement actions.</p></div>
      )}

      {/* System / Feature Flags */}
      {tab === 'system' && (
        <div className="card"><h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Feature Flags</h3><p className="text-xs text-gray-500">Manage via Supabase dashboard → feature_flags table.<br/>6 flags currently configured (federation, AI function calling, digital twin, video calls, car sharing, citizen repair).</p></div>
      )}
    </div>
  );
}
