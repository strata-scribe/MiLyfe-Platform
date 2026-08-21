'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type GuildTab = 'dashboard' | 'tasks' | 'conflicts' | 'join';

interface GuildTask {
  id: string;
  type: string;
  title: string;
  description: string;
  mly_reward: number;
  status: string;
  claimed_by: string | null;
  created_at: string;
}

interface GuildConflict {
  id: string;
  description: string;
  location: string;
  urgency: string;
  anonymous: boolean;
  status: string;
  mediator_id: string | null;
  reported_by: string | null;
  created_at: string;
}

interface GuildMember {
  id: string;
  user_id: string;
  role: string;
  block_area: string;
  status: string;
  created_at: string;
}

export default function GuildPage() {
  const [tab, setTab] = useState<GuildTab>('dashboard');
  const [tasks, setTasks] = useState<GuildTask[]>([]);
  const [conflicts, setConflicts] = useState<GuildConflict[]>([]);
  const [membership, setMembership] = useState<GuildMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalKeepers: 0, tasksCompleted: 0, conflictsResolved: 0 });

  // Join form
  const [joinRole, setJoinRole] = useState('member');
  const [joinBlock, setJoinBlock] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Conflict form
  const [conflictDesc, setConflictDesc] = useState('');
  const [conflictLocation, setConflictLocation] = useState('');
  const [conflictUrgency, setConflictUrgency] = useState('medium');
  const [conflictAnonymous, setConflictAnonymous] = useState(false);
  const [submittingConflict, setSubmittingConflict] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Check membership
      const { data: member } = await supabase
        .from('guild_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (member) setMembership(member);

      // Stats
      const { count: keeperCount } = await supabase
        .from('guild_members')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'keeper');

      const { count: tasksCompletedCount } = await supabase
        .from('guild_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: conflictsResolvedCount } = await supabase
        .from('guild_conflicts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      setStats({
        totalKeepers: keeperCount || 0,
        tasksCompleted: tasksCompletedCount || 0,
        conflictsResolved: conflictsResolvedCount || 0,
      });

      // Tasks
      const { data: taskData } = await supabase
        .from('guild_tasks')
        .select('*')
        .in('status', ['open', 'claimed'])
        .order('created_at', { ascending: false });
      if (taskData) setTasks(taskData);

      // Conflicts
      const { data: conflictData } = await supabase
        .from('guild_conflicts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (conflictData) setConflicts(conflictData);

      setLoading(false);
    };
    load();
  }, [user]);

  const claimTask = async (taskId: string) => {
    if (!user) return;
    await supabase
      .from('guild_tasks')
      .update({ claimed_by: user.id, status: 'claimed' })
      .eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed_by: user.id, status: 'claimed' } : t));
  };

  const completeTask = async (task: GuildTask) => {
    if (!user) return;
    await supabase
      .from('guild_tasks')
      .update({ status: 'completed' })
      .eq('id', task.id);

    // Award MLY
    await supabase.from('mly_transactions').insert({
      from_id: null,
      to_id: user.id,
      amount: task.mly_reward,
      type: 'earn',
      description: `Guild task: ${task.title}`,
    });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: task.mly_reward });

    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setJoining(true);
    const { data } = await supabase.from('guild_members').insert({
      user_id: user.id,
      role: joinRole,
      block_area: joinBlock.trim(),
      status: 'active',
    }).select().single();
    if (data) {
      setMembership(data);
      setJoinSuccess(true);
    }
    setJoining(false);
  };

  const handleConflictReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingConflict(true);
    const { data } = await supabase.from('guild_conflicts').insert({
      description: conflictDesc.trim(),
      location: conflictLocation.trim(),
      urgency: conflictUrgency,
      anonymous: conflictAnonymous,
      reported_by: conflictAnonymous ? null : user.id,
      status: 'open',
    }).select().single();
    if (data) setConflicts(prev => [data, ...prev]);
    setConflictDesc('');
    setConflictLocation('');
    setConflictUrgency('medium');
    setConflictAnonymous(false);
    setSubmittingConflict(false);
  };

  const taskTypeIcons: Record<string, string> = {
    patrol: '🚶',
    checkin: '👋',
    cleanup: '🧹',
    mediation: '🤝',
    mentoring: '📚',
    event: '🎉',
  };

  const urgencyColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiGuild</h1>
        <p className="text-xs text-gray-500">Peace Economy. Protect your block. Earn together.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'tasks', label: '✅ Tasks' },
          { key: 'conflicts', label: '⚖️ Conflicts' },
          { key: 'join', label: '🤝 Join' },
        ] as { key: GuildTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-teal-500">{stats.totalKeepers}</p>
              <p className="text-[10px] text-gray-500">Block Keepers</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-harbor-800 dark:text-white">{stats.tasksCompleted}</p>
              <p className="text-[10px] text-gray-500">Tasks Done</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-gold-500">{stats.conflictsResolved}</p>
              <p className="text-[10px] text-gray-500">Resolved</p>
            </div>
          </div>

          {/* Membership status */}
          {membership ? (
            <div className="card bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{membership.role === 'keeper' ? '🛡️' : membership.role === 'youth' ? '🌱' : '👤'}</span>
                <div>
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">
                    {membership.role === 'keeper' ? 'Block Keeper' : membership.role === 'youth' ? 'Youth Member' : 'Guild Member'}
                  </p>
                  <p className="text-xs text-gray-500">Area: {membership.block_area}</p>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    Earning {membership.role === 'keeper' ? '30' : '10'} MLY/day
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-dashed border-2 border-gray-200 dark:border-harbor-700 text-center py-6">
              <p className="text-sm text-gray-500">You haven&apos;t joined a guild yet</p>
              <button onClick={() => setTab('join')} className="btn-teal mt-3 text-sm">Join Now</button>
            </div>
          )}

          {/* Daily rate info */}
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Daily Rates</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">🛡️ Block Keeper</span>
                <span className="text-sm font-bold text-teal-500">$30 MLY/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">👤 Member</span>
                <span className="text-sm font-bold text-harbor-800 dark:text-white">$10 MLY/day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No open tasks right now. Check back soon!</p>
            </div>
          ) : tasks.map(task => (
            <div key={task.id} className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{taskTypeIcons[task.type] || '📋'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{task.title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-harbor-800 text-gray-500">{task.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-bold text-teal-500">+{task.mly_reward} MLY</span>
                    <span className="text-[10px] text-gray-400">{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-harbor-800">
                {task.status === 'open' && (
                  <button onClick={() => claimTask(task.id)} className="btn-teal w-full text-sm">
                    Claim Task
                  </button>
                )}
                {task.status === 'claimed' && task.claimed_by === user?.id && (
                  <button onClick={() => completeTask(task)} className="btn-gold w-full text-sm">
                    Mark Complete (+{task.mly_reward} MLY)
                  </button>
                )}
                {task.status === 'claimed' && task.claimed_by !== user?.id && (
                  <p className="text-xs text-center text-gray-400">Claimed by another keeper</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflicts */}
      {tab === 'conflicts' && (
        <div className="space-y-4">
          {/* Report form */}
          <form onSubmit={handleConflictReport} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Report a Conflict</p>
            <textarea
              value={conflictDesc}
              onChange={e => setConflictDesc(e.target.value)}
              className="input-field text-sm min-h-[80px]"
              placeholder="Describe the situation..."
              required
            />
            <input
              type="text"
              value={conflictLocation}
              onChange={e => setConflictLocation(e.target.value)}
              className="input-field text-sm"
              placeholder="Location (block, intersection, address)"
              required
            />
            <div className="flex gap-3 items-center">
              <select
                value={conflictUrgency}
                onChange={e => setConflictUrgency(e.target.value)}
                className="input-field text-sm flex-1"
              >
                <option value="low">Low urgency</option>
                <option value="medium">Medium urgency</option>
                <option value="high">High urgency</option>
              </select>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conflictAnonymous}
                  onChange={e => setConflictAnonymous(e.target.checked)}
                  className="rounded"
                />
                Anonymous
              </label>
            </div>
            <button type="submit" disabled={submittingConflict} className="btn-primary w-full text-sm disabled:opacity-50">
              {submittingConflict ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>

          {/* Conflict list */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">Recent Conflicts</p>
            {conflicts.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-xs">No conflicts reported.</p>
            ) : conflicts.map(c => (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-harbor-800 dark:text-white">{c.description}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {c.location}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', urgencyColors[c.urgency] || urgencyColors.medium)}>
                    {c.urgency}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-harbor-800">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full', c.status === 'resolved' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-100 text-gray-600 dark:bg-harbor-800 dark:text-gray-300')}>
                    {c.status}
                  </span>
                  {c.mediator_id && <span className="text-[10px] text-gray-400">Mediator assigned</span>}
                  <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join */}
      {tab === 'join' && (
        <div className="space-y-4">
          {membership ? (
            <div className="card bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-center py-6">
              <span className="text-3xl">✅</span>
              <p className="text-sm font-bold text-harbor-800 dark:text-white mt-2">You&apos;re already a guild {membership.role}!</p>
              <p className="text-xs text-gray-500 mt-1">Area: {membership.block_area}</p>
            </div>
          ) : (
            <>
              {/* Info card */}
              <div className="card bg-gradient-to-br from-harbor-800 to-teal-700 text-white">
                <p className="text-lg font-bold">Join the Peace Guild</p>
                <p className="text-xs text-harbor-200 mt-1">Protect your community. Build peace. Get paid.</p>
                <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                  <p className="text-sm">🛡️ Block Keeper — <span className="font-bold text-teal-300">$30 MLY/day</span></p>
                  <p className="text-sm">👤 Member — <span className="font-bold text-teal-300">$10 MLY/day</span></p>
                  <p className="text-sm">🌱 Youth — <span className="font-bold text-teal-300">$10 MLY/day</span></p>
                </div>
              </div>

              {joinSuccess ? (
                <div className="card text-center py-6">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-bold text-harbor-800 dark:text-white mt-2">Welcome to the Guild!</p>
                  <p className="text-xs text-gray-500 mt-1">You&apos;re now earning MLY daily.</p>
                </div>
              ) : (
                <form onSubmit={handleJoin} className="card space-y-3">
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">Enrollment</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Your Role</label>
                    <select
                      value={joinRole}
                      onChange={e => setJoinRole(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="member">Member ($10 MLY/day)</option>
                      <option value="keeper">Block Keeper ($30 MLY/day)</option>
                      <option value="youth">Youth ($10 MLY/day)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Your Block / Area</label>
                    <input
                      type="text"
                      value={joinBlock}
                      onChange={e => setJoinBlock(e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g. 45th & Moncrief, Northside, etc."
                      required
                    />
                  </div>
                  <button type="submit" disabled={joining} className="btn-teal w-full disabled:opacity-50">
                    {joining ? 'Enrolling...' : 'Join Guild'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
