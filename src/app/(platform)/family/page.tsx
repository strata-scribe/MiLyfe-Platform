'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────
type FamilyRole = 'parent' | 'co_parent' | 'guardian' | 'child' | 'elder' | 'extended';
type EventCategory = 'school' | 'medical' | 'custody' | 'work' | 'bill' | 'general';

interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface FamilyMember {
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  profile?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    mly_balance: number;
  };
}

interface FamilyEvent {
  id: string;
  family_id: string;
  title: string;
  date: string;
  category: EventCategory;
  assigned_to: string | null;
  recurring: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────
const EVENT_COLORS: Record<EventCategory, { bg: string; text: string; dot: string }> = {
  school: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  medical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  custody: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  work: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  bill: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  general: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
};

const ROLE_LABELS: Record<FamilyRole, string> = {
  parent: 'Parent',
  co_parent: 'Co-Parent',
  guardian: 'Guardian',
  child: 'Child',
  elder: 'Elder',
  extended: 'Extended',
};

const ROLE_ICONS: Record<FamilyRole, string> = {
  parent: '👤',
  co_parent: '👤',
  guardian: '🛡',
  child: '🧒',
  elder: '👴',
  extended: '👥',
};

const tabs = ['Home', 'Calendar', 'Budget', 'Manage'] as const;
type Tab = typeof tabs[number];

// ─── Main Component ────────────────────────────────────────────────
export default function MiFamilyPage() {
  const { user } = useAppStore();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchFamily = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Check if user is in a family
      const memberRes = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', user.id)
        .single();

      if (!memberRes.data) {
        setFamily(null);
        setLoading(false);
        return;
      }

      const familyId = memberRes.data.family_id;

      // Fetch family, members, events in parallel
      const [familyRes, membersRes, eventsRes] = await Promise.all([
        supabase.from('families').select('*').eq('id', familyId).single(),
        supabase.from('family_members').select('*, profile:profiles(id, display_name, avatar_url, mly_balance)').eq('family_id', familyId),
        supabase.from('family_events').select('*').eq('family_id', familyId).gte('date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]).order('date', { ascending: true }),
      ]);

      if (familyRes.data) setFamily(familyRes.data);
      if (membersRes.data) setMembers(membersRes.data as any);
      if (eventsRes.data) setEvents(eventsRes.data);

      // Fetch recent transactions for all family members
      if (membersRes.data) {
        const memberIds = membersRes.data.map((m: any) => m.user_id);
        const txRes = await supabase
          .from('transactions')
          .select('*')
          .in('user_id', memberIds)
          .order('created_at', { ascending: false })
          .limit(20);
        if (txRes.data) setTransactions(txRes.data);
      }
    } catch (err) {
      console.error('MiFamily fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchFamily(); }, [fetchFamily]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center animate-slide-up">
          <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-bold mb-2">MiFamily</h2>
          <p className="text-gray-500">Sign in to access your family hub.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No family — show create/join prompt
  if (!family) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <NoFamilyView onCreated={fetchFamily} userId={user.id} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <header className="animate-slide-up">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {family.name}
        </h1>
        <p className="text-gray-500 mt-1">Your family operating system</p>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 animate-slide-up">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'Home' && (
          <HomeView family={family} members={members} events={events} />
        )}
        {activeTab === 'Calendar' && (
          <CalendarView events={events} members={members} familyId={family.id} onRefresh={fetchFamily} />
        )}
        {activeTab === 'Budget' && (
          <BudgetView members={members} transactions={transactions} userId={user.id} />
        )}
        {activeTab === 'Manage' && (
          <ManageView family={family} members={members} userId={user.id} onRefresh={fetchFamily} />
        )}
      </div>
    </div>
  );
}

// ─── No Family View ──────────────────────────────────────────────
function NoFamilyView({ onCreated, userId }: { onCreated: () => void; userId: string }) {
  const supabase = createClient();
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setCreating(true);
    try {
      const { data } = await supabase
        .from('families')
        .insert({ name: familyName.trim(), created_by: userId })
        .select()
        .single();
      if (data) {
        await supabase
          .from('family_members')
          .insert({ family_id: data.id, user_id: userId, role: 'parent' });
        onCreated();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-slide-up">
      <div className="card p-8 max-w-md w-full text-center space-y-6">
        <div className="text-6xl">👨‍👩‍👧‍👦</div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome to MiFamily</h2>
          <p className="text-gray-500">
            Create a family circle to share calendars, budgets, and stay connected with your loved ones.
          </p>
        </div>

        {mode === 'choice' && (
          <div className="space-y-3">
            <button onClick={() => setMode('create')} className="btn-primary w-full">
              Create a Family
            </button>
            <button onClick={() => setMode('join')} className="btn-teal w-full">
              Join an Existing Family
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <input
              className="input-field w-full"
              placeholder="Family name (e.g. The Johnsons)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
            <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating...' : 'Create Family'}
            </button>
            <button onClick={() => setMode('choice')} className="text-sm text-gray-500">Back</button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <input
              className="input-field w-full"
              placeholder="Family invite code or email"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button className="btn-teal w-full">Request to Join</button>
            <button onClick={() => setMode('choice')} className="text-sm text-gray-500">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home View ───────────────────────────────────────────────────
function HomeView({
  family,
  members,
  events,
}: {
  family: Family;
  members: FamilyMember[];
  events: FamilyEvent[];
}) {
  const today = new Date().toISOString().split('T')[0];
  const thisWeekEvents = events.filter((e) => {
    const eventDate = new Date(e.date);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return eventDate <= weekFromNow;
  });

  // Elder check-in logic (>24hrs since last event/interaction)
  const elders = members.filter((m) => m.role === 'elder');
  const totalBalance = members.reduce((sum, m) => sum + (m.profile?.mly_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Family Circle */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Family Circle</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {members.map((member) => (
            <div key={member.user_id} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {member.profile?.display_name?.charAt(0).toUpperCase() || ROLE_ICONS[member.role]}
              </div>
              <p className="text-xs font-medium text-center max-w-[80px] truncate">
                {member.profile?.display_name || 'Member'}
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {ROLE_LABELS[member.role]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{members.length}</p>
          <p className="text-xs text-gray-500 mt-1">Members</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{thisWeekEvents.length}</p>
          <p className="text-xs text-gray-500 mt-1">This Week</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">${totalBalance.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">Family Pool</p>
        </div>
      </div>

      {/* Elder Check-In */}
      {elders.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Elder Check-In</h3>
          {elders.map((elder) => {
            // Simplified: check if they have a recent event assigned
            const lastActivity = events.find((e) => e.assigned_to === elder.user_id);
            const isOk = lastActivity && (new Date().getTime() - new Date(lastActivity.date).getTime()) < 86400000;
            return (
              <div key={elder.user_id} className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                isOk ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              )}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">👴</span>
                  <span className="font-medium">{elder.profile?.display_name || 'Elder'}</span>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  isOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                )}>
                  {isOk ? '✓ All OK' : '⚠ Check on them'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Events */}
      {thisWeekEvents.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">This Week</h3>
          <div className="space-y-2">
            {thisWeekEvents.slice(0, 5).map((event) => {
              const colors = EVENT_COLORS[event.category] || EVENT_COLORS.general;
              return (
                <div key={event.id} className={cn('flex items-center gap-3 p-3 rounded-lg', colors.bg)}>
                  <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', colors.text)}>{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {event.category === 'custody' && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">Custody</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────
function CalendarView({
  events,
  members,
  familyId,
  onRefresh,
}: {
  events: FamilyEvent[];
  members: FamilyMember[];
  familyId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<EventCategory>('general');
  const [assignedTo, setAssignedTo] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekEnd = weekFromNow.toISOString().split('T')[0];

  const todayEvents = events.filter((e) => e.date === today);
  const thisWeekEvents = events.filter((e) => e.date > today && e.date <= weekEnd);
  const laterEvents = events.filter((e) => e.date > weekEnd);

  const handleAddEvent = async () => {
    if (!title.trim() || !date) return;
    await supabase.from('family_events').insert({
      family_id: familyId,
      title: title.trim(),
      date,
      category,
      assigned_to: assignedTo || null,
      recurring: false,
    });
    setTitle('');
    setDate('');
    setShowForm(false);
    onRefresh();
  };

  const renderGroup = (label: string, groupEvents: FamilyEvent[]) => {
    if (groupEvents.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</h4>
        {groupEvents.map((event) => {
          const colors = EVENT_COLORS[event.category] || EVENT_COLORS.general;
          const assignee = members.find((m) => m.user_id === event.assigned_to);
          return (
            <div key={event.id} className={cn('flex items-center gap-3 p-3 rounded-xl', colors.bg)}>
              <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', colors.dot)} />
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', colors.text)}>{event.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {assignee && (
                    <span className="text-xs text-gray-400">· {assignee.profile?.display_name}</span>
                  )}
                  {event.category === 'custody' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-200 text-purple-700">whose day</span>
                  )}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
                {event.category}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Family Calendar</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-teal text-sm">+ Add Event</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-3 border-2 border-purple-200 animate-slide-up">
          <input
            className="input-field w-full"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
              {Object.keys(EVENT_COLORS).map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <select className="input-field" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Assign to (optional)</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.profile?.display_name || 'Member'}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAddEvent} className="btn-primary text-sm">Add Event</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
          <p className="text-gray-500 mb-4">Add family events to keep everyone in sync</p>
          <button onClick={() => setShowForm(true)} className="btn-teal">Add First Event</button>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup('Today', todayEvents)}
          {renderGroup('This Week', thisWeekEvents)}
          {renderGroup('Later', laterEvents)}
        </div>
      )}
    </div>
  );
}

// ─── Budget View ─────────────────────────────────────────────────
function BudgetView({
  members,
  transactions,
  userId,
}: {
  members: FamilyMember[];
  transactions: Transaction[];
  userId: string;
}) {
  const totalPool = members.reduce((sum, m) => sum + (m.profile?.mly_balance || 0), 0);
  const childMembers = members.filter((m) => m.role === 'child');

  // Group transactions by type for category breakdown
  const categories = new Map<string, number>();
  transactions.forEach((tx) => {
    const cat = tx.type || 'Other';
    categories.set(cat, (categories.get(cat) || 0) + Math.abs(tx.amount));
  });

  return (
    <div className="space-y-6">
      {/* Family Pool */}
      <div className="card p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-none">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Combined Family Pool</p>
          <p className="text-4xl font-bold text-amber-600">${totalPool.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">{members.length} members contributing</p>
        </div>
      </div>

      {/* Member Balances */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Member Balances</h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                  {member.profile?.display_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.profile?.display_name || 'Member'}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">${(member.profile?.mly_balance || 0).toFixed(2)}</p>
                {member.user_id !== userId && (
                  <button className="text-[10px] text-teal-600 hover:text-teal-700 font-medium">
                    Send MLY →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Categories */}
      {categories.size > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Spending by Category</h3>
          <div className="space-y-2">
            {Array.from(categories.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([cat, amount]) => {
                const pct = (amount / Array.from(categories.values()).reduce((a, b) => a + b, 0)) * 100;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{cat}</span>
                      <span className="font-medium">${amount.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Weekly Allowance for Children */}
      {childMembers.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekly Allowance</h3>
          {childMembers.map((child) => (
            <div key={child.user_id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <span>🧒</span>
                <span className="text-sm font-medium">{child.profile?.display_name}</span>
              </div>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Pending Setup</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.slice(0, 10).map((tx) => {
              const member = members.find((m) => m.user_id === tx.user_id);
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500">{member?.profile?.display_name} · {new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={cn('text-sm font-semibold', tx.amount > 0 ? 'text-green-600' : 'text-red-500')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manage View ─────────────────────────────────────────────────
function ManageView({
  family,
  members,
  userId,
  onRefresh,
}: {
  family: Family;
  members: FamilyMember[];
  userId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FamilyRole>('extended');
  const [showInvite, setShowInvite] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const isCreator = family.created_by === userId;
  const currentMember = members.find((m) => m.user_id === userId);
  const isAdmin = currentMember?.role === 'parent' || currentMember?.role === 'guardian';

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    // In production this would send an invite — for now we show success
    setInviteEmail('');
    setShowInvite(false);
    alert('Invite sent to ' + inviteEmail);
  };

  const handleChangeRole = async (memberId: string, newRole: FamilyRole) => {
    await supabase
      .from('family_members')
      .update({ role: newRole })
      .eq('family_id', family.id)
      .eq('user_id', memberId);
    onRefresh();
  };

  const handleLeave = async () => {
    await supabase
      .from('family_members')
      .delete()
      .eq('family_id', family.id)
      .eq('user_id', userId);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Family Info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Family Details</h3>
        <p className="text-lg font-bold">{family.name}</p>
        <p className="text-xs text-gray-500">Created {new Date(family.created_at).toLocaleDateString()}</p>
      </div>

      {/* Members */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Members ({members.length})
          </h3>
          {isAdmin && (
            <button onClick={() => setShowInvite(!showInvite)} className="btn-teal text-xs">
              + Invite
            </button>
          )}
        </div>

        {showInvite && (
          <div className="mb-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 space-y-3 animate-slide-up">
            <input
              className="input-field w-full"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as FamilyRole)}>
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={handleInvite} className="btn-primary text-xs">Send Invite</button>
              <button onClick={() => setShowInvite(false)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                  {member.profile?.display_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {member.profile?.display_name || 'Member'}
                    {member.user_id === userId && <span className="text-gray-400 ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</p>
                </div>
              </div>
              {isAdmin && member.user_id !== userId && (
                <select
                  className="text-xs input-field py-1 px-2"
                  value={member.role}
                  onChange={(e) => handleChangeRole(member.user_id, e.target.value as FamilyRole)}
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Family */}
      {!isCreator && (
        <div className="card p-5 border-red-200 dark:border-red-800">
          {!showLeave ? (
            <button onClick={() => setShowLeave(true)} className="text-red-500 text-sm font-medium hover:text-red-600">
              Leave Family
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600">Are you sure you want to leave {family.name}?</p>
              <div className="flex gap-2">
                <button onClick={handleLeave} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                  Yes, Leave
                </button>
                <button onClick={() => setShowLeave(false)} className="text-sm text-gray-500">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
