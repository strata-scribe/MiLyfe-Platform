'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type GuildTab = 'dashboard' | 'tasks' | 'conflicts' | 'join';

interface GuildMember { id: string; user_id: string; role: string; block_area: string | null; status: string; daily_rate: number; tasks_completed: number; deescalations: number; joined_at: string; profiles?: { display_name: string }; }
interface Task { id: string; title: string; description: string; category: string; mly_reward: number; status: string; assigned_to: string | null; completed_at: string | null; created_at: string; }
interface Conflict { id: string; description: string; location: string | null; urgency: string; status: string; mediator_id: string | null; resolution: string | null; anonymous: boolean; created_at: string; reporter_id: string | null; }
interface Checkin { id: string; checked_in_at: string; location_lat: number | null; location_lng: number | null; }
interface Payout { id: string; amount: number; reason: string; paid_at: string; }

const urgencyColors: Record<string, string> = { low: 'bg-gray-100 text-gray-600', normal: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const roleConfig: Record<string, { label: string; icon: string; rate: number }> = {
  keeper: { label: 'Block Keeper', icon: '🛡️', rate: 30 },
  mediator: { label: 'Mediator', icon: '⚖️', rate: 25 },
  member: { label: 'Member', icon: '🤝', rate: 10 },
  youth: { label: 'Youth', icon: '🌱', rate: 15 },
  elder: { label: 'Elder', icon: '🧓', rate: 20 },
};

export default function GuildPage() {
  const [tab, setTab] = useState<GuildTab>('dashboard');
  const [membership, setMembership] = useState<GuildMember | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [allMembers, setAllMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);

  // Join form
  const [joinRole, setJoinRole] = useState('member');
  const [joinBlock, setJoinBlock] = useState('');
  const [joining, setJoining] = useState(false);

  // Conflict form
  const [cDesc, setCDesc] = useState('');
  const [cLoc, setCLoc] = useState('');
  const [cUrgency, setCUrgency] = useState('normal');
  const [cAnon, setCAnon] = useState(false);
  const [reportingConflict, setReportingConflict] = useState(false);
  const [showConflictForm, setShowConflictForm] = useState(false);

  // Resolution form
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Check membership
      const { data: mem } = await supabase.from('guild_members').select('*, profiles!guild_members_user_id_fkey(display_name)').eq('user_id', user.id).maybeSingle();
      if (mem) { setMembership(mem); setTab('dashboard'); } else { setTab('join'); }

      // All members
      const { data: members } = await supabase.from('guild_members').select('*, profiles!guild_members_user_id_fkey(display_name)').eq('status', 'active').order('daily_rate', { ascending: false });
      if (members) setAllMembers(members);

      // Tasks
      const { data: taskData } = await supabase.from('guild_tasks').select('*').order('created_at', { ascending: false }).limit(20);
      if (taskData) setTasks(taskData);

      // Conflicts
      const { data: conflictData } = await supabase.from('guild_conflicts').select('*').order('created_at', { ascending: false }).limit(20);
      if (conflictData) setConflicts(conflictData);

      // My checkins (last 7 days)
      if (mem) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: checks } = await supabase.from('guild_checkins').select('*').eq('member_id', mem.id).gte('checked_in_at', weekAgo).order('checked_in_at', { ascending: false });
        if (checks) {
          setCheckins(checks);
          const today = new Date().toDateString();
          setTodayCheckedIn(checks.some(c => new Date(c.checked_in_at).toDateString() === today));
        }

        // My payouts this month
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const { data: pays } = await supabase.from('guild_payouts').select('*').eq('member_id', mem.id).gte('paid_at', startOfMonth.toISOString());
        if (pays) setPayouts(pays);
      }

      setLoading(false);
    };
    load();
  }, [user, supabase, joining, checkingIn, resolving]);

  // GPS Check-in
  const handleCheckin = async () => {
    if (!membership || !user) return;
    setCheckingIn(true);

    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch {}

    await supabase.from('guild_checkins').insert({ member_id: membership.id, location_lat: lat, location_lng: lng });

    // Pay daily rate
    await supabase.from('guild_payouts').insert({ member_id: membership.id, user_id: user.id, amount: membership.daily_rate, reason: 'Daily presence check-in' });
    await supabase.from('mly_transactions').insert({ to_id: user.id, amount: membership.daily_rate, type: 'earn', description: `Guild daily: ${roleConfig[membership.role]?.label || 'Member'}` });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: membership.daily_rate });

    setTodayCheckedIn(true);
    setCheckingIn(false);
  };

  // Join guild
  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    const rate = roleConfig[joinRole]?.rate || 10;
    await supabase.from('guild_members').insert({ user_id: user.id, role: joinRole, block_area: joinBlock.trim() || null, daily_rate: rate });
    setJoining(false);
  };

  // Claim task
  const handleClaimTask = async (taskId: string) => {
    if (!membership) return;
    await supabase.from('guild_tasks').update({ assigned_to: membership.id, status: 'claimed' }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: membership.id, status: 'claimed' } : t));
  };

  // Complete task
  const handleCompleteTask = async (task: Task) => {
    if (!membership || !user) return;
    await supabase.from('guild_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', task.id);
    await supabase.from('guild_members').update({ tasks_completed: membership.tasks_completed + 1 }).eq('id', membership.id);
    await supabase.from('mly_transactions').insert({ to_id: user.id, amount: task.mly_reward, type: 'earn', description: `Guild task: ${task.title}` });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: task.mly_reward });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
  };

  // Report conflict
  const handleReportConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReportingConflict(true);
    await supabase.from('guild_conflicts').insert({ reporter_id: cAnon ? null : user.id, description: cDesc.trim(), location: cLoc.trim() || null, urgency: cUrgency, anonymous: cAnon });
    setCDesc(''); setCLoc(''); setShowConflictForm(false);
    setReportingConflict(false);
  };

  // Resolve conflict
  const handleResolve = async () => {
    if (!resolveId || !membership || !user) return;
    setResolving(true);
    await supabase.from('guild_conflicts').update({ status: 'resolved', mediator_id: membership.id, resolution: resolution.trim() }).eq('id', resolveId);
    await supabase.from('guild_members').update({ deescalations: membership.deescalations + 1 }).eq('id', membership.id);
    // Bonus for resolution
    await supabase.from('mly_transactions').insert({ to_id: user.id, amount: 20, type: 'earn', description: 'Conflict resolution bonus' });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: 20 });
    await supabase.from('guild_payouts').insert({ member_id: membership.id, user_id: user.id, amount: 20, reason: 'Conflict resolution' });
    setResolveId(null); setResolution('');
    setResolving(false);
  };

  const monthlyEarned = payouts.reduce((s, p) => s + p.amount, 0);
  const weekCheckins = checkins.length;

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-32" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiGuild</h1>
        <p className="text-xs text-gray-500">Peace economy. Protect your block. Earn real money.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'tasks', label: '📋 Tasks' },
          { key: 'conflicts', label: '⚡ Conflicts' },
          { key: 'join', label: membership ? '👥 Members' : '🤝 Join' },
        ] as { key: GuildTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && membership && (
        <div className="space-y-4">
          {/* Status Card */}
          <div className="card bg-gradient-to-br from-harbor-800 to-teal-600 text-white p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{roleConfig[membership.role]?.icon || '🤝'}</span>
              <div>
                <p className="text-sm font-bold">{roleConfig[membership.role]?.label || 'Member'}</p>
                <p className="text-xs text-harbor-200">{membership.block_area || 'No block assigned'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold">${monthlyEarned.toFixed(0)}</p>
                <p className="text-[10px] text-harbor-200">This month</p>
              </div>
              <div>
                <p className="text-xl font-bold">{membership.tasks_completed}</p>
                <p className="text-[10px] text-harbor-200">Tasks done</p>
              </div>
              <div>
                <p className="text-xl font-bold">{membership.deescalations}</p>
                <p className="text-[10px] text-harbor-200">De-escalations</p>
              </div>
            </div>
          </div>

          {/* GPS Check-in */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Daily Presence Check-in</p>
                <p className="text-xs text-gray-500">${membership.daily_rate} MLY/day · GPS verified</p>
              </div>
              {todayCheckedIn ? (
                <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-600 px-3 py-1.5 rounded-full font-medium">✓ Done today</span>
              ) : (
                <button onClick={handleCheckin} disabled={checkingIn} className="btn-teal text-xs !py-2 !px-4 disabled:opacity-50">
                  {checkingIn ? '📡...' : '📍 Check In'}
                </button>
              )}
            </div>

            {/* Week streak */}
            <div className="flex gap-1.5 mt-3">
              {['M','T','W','T','F','S','S'].map((day, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                const hasCheckin = checkins.some(c => new Date(c.checked_in_at).toDateString() === d.toDateString());
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                    <div className={cn('w-full h-6 rounded', hasCheckin ? 'bg-teal-500' : 'bg-gray-200 dark:bg-harbor-700')} />
                    <span className="text-[9px] text-gray-400">{day}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{weekCheckins}/7 days this week · ${weekCheckins * membership.daily_rate} earned</p>
          </div>

          {/* Recent Payouts */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Earnings</h3>
            {payouts.length === 0 ? <p className="text-xs text-gray-400">No payouts yet. Check in daily to start earning.</p> :
            payouts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                <div>
                  <p className="text-xs text-harbor-800 dark:text-gray-200">{p.reason}</p>
                  <p className="text-[10px] text-gray-400">{new Date(p.paid_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-bold text-teal-500">+${p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          {tasks.filter(t => t.status === 'open' || (t.assigned_to === membership?.id && t.status === 'claimed')).length === 0 ? (
            <div className="text-center py-12"><p className="text-4xl mb-2">📋</p><p className="text-gray-500">No open tasks right now. Check back soon.</p></div>
          ) : tasks.filter(t => t.status === 'open' || (t.assigned_to === membership?.id && t.status === 'claimed')).map(task => (
            <div key={task.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{task.title}</h3>
                  <p className="text-xs text-gray-500">{task.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-harbor-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded capitalize">{task.category}</span>
                    <span className="text-[10px] font-bold text-mly-600">+${task.mly_reward}</span>
                  </div>
                </div>
              </div>
              {task.status === 'open' && membership && (
                <button onClick={() => handleClaimTask(task.id)} className="btn-teal w-full text-xs !py-2">Claim Task</button>
              )}
              {task.status === 'claimed' && task.assigned_to === membership?.id && (
                <button onClick={() => handleCompleteTask(task)} className="btn-gold w-full text-xs !py-2">✓ Mark Complete (+${task.mly_reward})</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Conflicts */}
      {tab === 'conflicts' && (
        <div className="space-y-3">
          <button onClick={() => setShowConflictForm(!showConflictForm)} className="btn-primary w-full text-sm">
            {showConflictForm ? 'Cancel' : '⚡ Report Conflict'}
          </button>

          {showConflictForm && (
            <form onSubmit={handleReportConflict} className="card space-y-3 border-2 border-orange-200 dark:border-orange-800">
              <h3 className="text-sm font-medium text-harbor-800 dark:text-white">Report a Conflict</h3>
              <textarea value={cDesc} onChange={e => setCDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-20" placeholder="Describe the tension or situation..." required />
              <input type="text" value={cLoc} onChange={e => setCLoc(e.target.value)} className="input-field !py-2 text-sm" placeholder="Location (optional)" />
              <select value={cUrgency} onChange={e => setCUrgency(e.target.value)} className="input-field !py-2 text-sm">
                <option value="low">Low — simmering</option>
                <option value="normal">Normal — needs attention</option>
                <option value="high">High — escalating</option>
                <option value="critical">Critical — immediate</option>
              </select>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={cAnon} onChange={e => setCAnon(e.target.checked)} className="rounded accent-teal-500" />
                Report anonymously
              </label>
              <button type="submit" disabled={reportingConflict} className="btn-teal w-full text-sm disabled:opacity-50">{reportingConflict ? '...' : 'Submit Report'}</button>
            </form>
          )}

          {conflicts.filter(c => c.status !== 'resolved').length === 0 ? (
            <div className="text-center py-8"><p className="text-4xl mb-2">☮️</p><p className="text-gray-500">No active conflicts. Peace is holding.</p></div>
          ) : conflicts.filter(c => c.status !== 'resolved').map(conflict => (
            <div key={conflict.id} className="card space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', urgencyColors[conflict.urgency])}>{conflict.urgency}</span>
                <span className="text-[10px] text-gray-400">{new Date(conflict.created_at).toLocaleDateString()}</span>
                <span className="text-[10px] text-gray-400 capitalize">{conflict.status}</span>
              </div>
              <p className="text-sm text-harbor-800 dark:text-white">{conflict.description}</p>
              {conflict.location && <p className="text-xs text-gray-500">📍 {conflict.location}</p>}

              {/* Resolve button (for mediators/keepers) */}
              {membership && (membership.role === 'keeper' || membership.role === 'mediator') && conflict.status === 'open' && (
                <>
                  {resolveId === conflict.id ? (
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-harbor-800">
                      <textarea value={resolution} onChange={e => setResolution(e.target.value)} className="input-field !py-2 text-xs resize-none h-16" placeholder="How was this resolved?" />
                      <div className="flex gap-2">
                        <button onClick={handleResolve} disabled={resolving || !resolution.trim()} className="btn-teal flex-1 text-xs !py-2 disabled:opacity-50">{resolving ? '...' : '✓ Resolve (+$20)'}</button>
                        <button onClick={() => setResolveId(null)} className="btn-primary flex-1 text-xs !py-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setResolveId(conflict.id)} className="btn-teal w-full text-xs !py-2">⚖️ I Can Mediate This</button>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Resolved history */}
          {conflicts.filter(c => c.status === 'resolved').length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-xs text-gray-400 font-medium">Resolved</h3>
              {conflicts.filter(c => c.status === 'resolved').slice(0, 5).map(c => (
                <div key={c.id} className="card !py-2 flex items-center gap-2">
                  <span className="text-sm">☮️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{c.description.slice(0, 60)}</p>
                    {c.resolution && <p className="text-[10px] text-teal-500 truncate">Resolution: {c.resolution}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join / Members */}
      {tab === 'join' && (
        <div className="space-y-4">
          {!membership ? (
            <div className="card space-y-4">
              <h2 className="font-medium text-harbor-800 dark:text-white">Join the Guild</h2>
              <p className="text-xs text-gray-500">Earn $MLY by keeping your block safe, mediating conflicts, and mentoring youth.</p>

              <div className="space-y-2">
                {Object.entries(roleConfig).map(([key, config]) => (
                  <button key={key} onClick={() => setJoinRole(key)} className={cn('w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all', joinRole === key ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700')}>
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{config.label}</p>
                      <p className="text-xs text-mly-600 font-bold">${config.rate} MLY/day</p>
                    </div>
                  </button>
                ))}
              </div>

              <input type="text" value={joinBlock} onChange={e => setJoinBlock(e.target.value)} className="input-field !py-2 text-sm" placeholder="Your block/area (e.g., MLK & 5th)" />

              <button onClick={handleJoin} disabled={joining} className="btn-gold w-full disabled:opacity-50">
                {joining ? 'Joining...' : 'Join Guild'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500">Active Members ({allMembers.length})</h2>
              {allMembers.map(m => (
                <div key={m.id} className="card flex items-center gap-3 !py-3">
                  <span className="text-xl">{roleConfig[m.role]?.icon || '🤝'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{(m.profiles as any)?.display_name}</p>
                    <p className="text-xs text-gray-500">{roleConfig[m.role]?.label} · {m.block_area || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-mly-600">${m.daily_rate}/day</p>
                    <p className="text-[10px] text-gray-400">{m.tasks_completed} tasks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
