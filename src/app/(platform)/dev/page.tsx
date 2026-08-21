'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────
type GoalCategory = 'health' | 'career' | 'financial' | 'social' | 'education' | 'personal';
type GoalStatus = 'active' | 'completed' | 'paused';
type HabitFrequency = 'daily' | '3x' | '4x' | '5x' | 'weekly';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  target_date: string;
  status: GoalStatus;
  progress: number;
  milestones?: string[];
  created_at: string;
}

interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: HabitFrequency;
  current_streak: number;
  best_streak: number;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: number;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<GoalCategory, string> = {
  health: 'border-l-green-500 bg-green-500/5',
  career: 'border-l-blue-500 bg-blue-500/5',
  financial: 'border-l-yellow-500 bg-yellow-500/5',
  social: 'border-l-pink-500 bg-pink-500/5',
  education: 'border-l-purple-500 bg-purple-500/5',
  personal: 'border-l-teal-500 bg-teal-500/5',
};

const CATEGORY_BAR_COLORS: Record<GoalCategory, string> = {
  health: 'bg-green-500',
  career: 'bg-blue-500',
  financial: 'bg-yellow-500',
  social: 'bg-pink-500',
  education: 'bg-purple-500',
  personal: 'bg-teal-500',
};

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];

const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do.",
  "Small daily improvements over time lead to stunning results.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Believe you can and you're halfway there.",
  "Your future is created by what you do today.",
  "It does not matter how slowly you go as long as you do not stop.",
  "The secret of getting ahead is getting started.",
];

const tabs = ['Today', 'Goals', 'Habits', 'Journal'] as const;
type Tab = typeof tabs[number];

// ─── Main Component ────────────────────────────────────────────────
export default function MiDevPage() {
  const { user } = useAppStore();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('Today');
  const [loading, setLoading] = useState(true);

  // Data
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [familyEvents, setFamilyEvents] = useState<any[]>([]);

  // Celebration
  const [celebrating, setCelebrating] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [goalsRes, habitsRes, journalRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (goalsRes.data) setGoals(goalsRes.data);
      if (habitsRes.data) {
        setHabits(habitsRes.data);
        // Fetch logs for all habits (last 30 days)
        const habitIds = habitsRes.data.map((h: Habit) => h.id);
        if (habitIds.length > 0) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const logsRes = await supabase
            .from('habit_logs')
            .select('*')
            .in('habit_id', habitIds)
            .gte('completed_at', thirtyDaysAgo.toISOString().split('T')[0]);
          if (logsRes.data) setHabitLogs(logsRes.data);
        }
      }
      if (journalRes.data) setJournalEntries(journalRes.data);

      // Fetch family events if user is in a family
      const memberRes = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .single();
      if (memberRes.data) {
        const eventsRes = await supabase
          .from('family_events')
          .select('*')
          .eq('family_id', memberRes.data.family_id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5);
        if (eventsRes.data) setFamilyEvents(eventsRes.data);
      }
    } catch (err) {
      console.error('MiDev fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center animate-slide-up">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-bold mb-2">Welcome to MiDev</h2>
          <p className="text-gray-500">Sign in to start your personal development journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <header className="animate-slide-up">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          MiDev
        </h1>
        <p className="text-gray-500 mt-1">Personal growth, one day at a time</p>
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
                ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Celebration Overlay */}
      {celebrating && <CelebrationOverlay onDone={() => setCelebrating(false)} />}

      {/* Tab Content */}
      <div className="animate-slide-up">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === 'Today' && (
              <TodayView
                goals={goals}
                habits={habits}
                habitLogs={habitLogs}
                familyEvents={familyEvents}
                onCompleteHabit={(habitId) => handleCompleteHabit(habitId)}
              />
            )}
            {activeTab === 'Goals' && (
              <GoalsView
                goals={goals}
                onAdd={handleAddGoal}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
                onComplete={(id) => handleCompleteGoal(id)}
              />
            )}
            {activeTab === 'Habits' && (
              <HabitsView
                habits={habits}
                habitLogs={habitLogs}
                onAdd={handleAddHabit}
                onComplete={handleCompleteHabit}
                onDelete={handleDeleteHabit}
              />
            )}
            {activeTab === 'Journal' && (
              <JournalView
                entries={journalEntries}
                onAdd={handleAddJournal}
                onDelete={handleDeleteJournal}
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  // ─── Handlers ──────────────────────────────────────────────────
  async function handleAddGoal(goal: Partial<Goal>) {
    const { data } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: user!.id, status: 'active', progress: 0 })
      .select()
      .single();
    if (data) setGoals((prev) => [data, ...prev]);
  }

  async function handleUpdateGoal(id: string, updates: Partial<Goal>) {
    const { data } = await supabase.from('goals').update(updates).eq('id', id).select().single();
    if (data) setGoals((prev) => prev.map((g) => (g.id === id ? data : g)));
    if (updates.status === 'completed') setCelebrating(true);
  }

  async function handleDeleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleCompleteGoal(id: string) {
    await handleUpdateGoal(id, { status: 'completed', progress: 100 });
  }

  async function handleAddHabit(habit: Partial<Habit>) {
    const { data } = await supabase
      .from('habits')
      .insert({ ...habit, user_id: user!.id, current_streak: 0, best_streak: 0 })
      .select()
      .single();
    if (data) setHabits((prev) => [data, ...prev]);
  }

  async function handleCompleteHabit(habitId: string) {
    const today = new Date().toISOString().split('T')[0];
    // Check if already completed today
    const existing = habitLogs.find(
      (l) => l.habit_id === habitId && l.completed_at === today
    );
    if (existing) return;

    const { data, error } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId, completed_at: today })
      .select()
      .single();

    if (error) return; // unique constraint or other error
    if (data) {
      setHabitLogs((prev) => [...prev, data]);

      // Calculate new streak
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        const newStreak = habit.current_streak + 1;
        const bestStreak = Math.max(newStreak, habit.best_streak);
        await supabase
          .from('habits')
          .update({ current_streak: newStreak, best_streak: bestStreak })
          .eq('id', habitId);
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId ? { ...h, current_streak: newStreak, best_streak: bestStreak } : h
          )
        );

        // MLY bonuses
        if (newStreak === 7 || newStreak === 30) {
          const bonus = newStreak === 7 ? 5 : 15;
          await supabase
            .from('profiles')
            .update({ mly_balance: (user!.mly_balance || 0) + bonus })
            .eq('id', user!.id);
        }
      }
    }
  }

  async function handleDeleteHabit(id: string) {
    await supabase.from('habits').delete().eq('id', id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  async function handleAddJournal(content: string, mood: number) {
    const { data } = await supabase
      .from('journal_entries')
      .insert({ user_id: user!.id, content, mood })
      .select()
      .single();
    if (data) setJournalEntries((prev) => [data, ...prev]);
  }

  async function handleDeleteJournal(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id);
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  }
}

// ─── Today View ──────────────────────────────────────────────────
function TodayView({
  goals,
  habits,
  habitLogs,
  familyEvents,
  onCompleteHabit,
}: {
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  familyEvents: any[];
  onCompleteHabit: (id: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

  const todayHabits = habits; // All habits potentially due today
  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    .slice(0, 3);

  const completedToday = (habitId: string) =>
    habitLogs.some((l) => l.habit_id === habitId && l.completed_at === today);

  return (
    <div className="space-y-6">
      {/* Motivational Quote */}
      <div className="card p-6 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-none">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed">"{quote}"</p>
            <p className="text-sm text-gray-500 mt-2">— Mi AI Daily Prompt</p>
          </div>
        </div>
      </div>

      {/* Habits Due Today */}
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          Today's Habits
        </h3>
        {todayHabits.length === 0 ? (
          <div className="card p-6 text-center text-gray-500">
            <p>No habits yet. Add some in the Habits tab!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {todayHabits.map((habit) => {
              const done = completedToday(habit.id);
              return (
                <div
                  key={habit.id}
                  className={cn(
                    'card p-4 flex items-center justify-between transition-all duration-300',
                    done && 'bg-green-50 dark:bg-green-900/20 border-green-200'
                  )}
                >
                  <div>
                    <p className={cn('font-medium', done && 'line-through text-gray-400')}>{habit.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      🔥 {habit.current_streak} day streak
                    </p>
                  </div>
                  <button
                    onClick={() => !done && onCompleteHabit(habit.id)}
                    disabled={done}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      done
                        ? 'bg-green-500 text-white scale-110'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-teal-100 hover:scale-105'
                    )}
                  >
                    {done ? '✓' : '○'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Active Goals
          </h3>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className={cn('card p-4 border-l-4', CATEGORY_COLORS[goal.category])}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-xs text-gray-500">
                      Due {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-teal-600">{goal.progress}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', CATEGORY_BAR_COLORS[goal.category])}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Family Events */}
      {familyEvents.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Upcoming Family Events
          </h3>
          <div className="space-y-2">
            {familyEvents.map((event) => (
              <div key={event.id} className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm">
                  📅
                </div>
                <div>
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Goals View ──────────────────────────────────────────────────
function GoalsView({
  goals,
  onAdd,
  onUpdate,
  onDelete,
  onComplete,
}: {
  goals: Goal[];
  onAdd: (g: Partial<Goal>) => void;
  onUpdate: (id: string, u: Partial<Goal>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [targetDate, setTargetDate] = useState('');
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all');
  const [editingMilestones, setEditingMilestones] = useState<string | null>(null);
  const [milestoneInput, setMilestoneInput] = useState('');

  const filtered = goals.filter((g) => filter === 'all' || g.status === filter);

  const handleSubmit = () => {
    if (!title.trim() || !targetDate) return;
    onAdd({ title: title.trim(), category, target_date: targetDate });
    setTitle('');
    setTargetDate('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['all', 'active', 'completed', 'paused'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === s ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-teal text-sm">
          + New Goal
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 space-y-4 border-2 border-teal-200 dark:border-teal-800 animate-slide-up">
          <input
            className="input-field w-full"
            placeholder="What's your goal?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
            >
              {Object.keys(CATEGORY_COLORS).map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <input
              type="date"
              className="input-field"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary text-sm">Create Goal</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-gray-500 mb-4">Set a goal to start your journey</p>
          <button onClick={() => setShowForm(true)} className="btn-teal">Create Your First Goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((goal) => (
            <div
              key={goal.id}
              className={cn('card p-5 border-l-4 transition-all duration-300 hover:shadow-md', CATEGORY_COLORS[goal.category])}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase',
                      goal.status === 'active' && 'bg-green-100 text-green-700',
                      goal.status === 'completed' && 'bg-blue-100 text-blue-700',
                      goal.status === 'paused' && 'bg-yellow-100 text-yellow-700',
                    )}>
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {goal.category} · Due {new Date(goal.target_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {goal.status === 'active' && (
                    <>
                      <button
                        onClick={() => onUpdate(goal.id, { status: 'paused' })}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-xs"
                        title="Pause"
                      >⏸</button>
                      <button
                        onClick={() => onComplete(goal.id)}
                        className="p-1.5 rounded-lg hover:bg-green-100 text-xs"
                        title="Complete"
                      >✅</button>
                    </>
                  )}
                  {goal.status === 'paused' && (
                    <button
                      onClick={() => onUpdate(goal.id, { status: 'active' })}
                      className="p-1.5 rounded-lg hover:bg-green-100 text-xs"
                      title="Resume"
                    >▶️</button>
                  )}
                  <button
                    onClick={() => onDelete(goal.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-xs"
                    title="Delete"
                  >🗑</button>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold">{goal.progress}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700 ease-out', CATEGORY_BAR_COLORS[goal.category])}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                {goal.status === 'active' && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={goal.progress}
                    onChange={(e) => onUpdate(goal.id, { progress: parseInt(e.target.value) })}
                    className="w-full mt-2 accent-teal-500"
                  />
                )}
              </div>

              {/* Milestones */}
              <div className="mt-3">
                <button
                  onClick={() => setEditingMilestones(editingMilestones === goal.id ? null : goal.id)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  {editingMilestones === goal.id ? 'Hide' : 'Show'} Milestones ({goal.milestones?.length || 0})
                </button>
                {editingMilestones === goal.id && (
                  <div className="mt-2 space-y-1.5">
                    {(goal.milestones || []).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        {m}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        className="input-field flex-1 text-sm"
                        placeholder="Add milestone..."
                        value={milestoneInput}
                        onChange={(e) => setMilestoneInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && milestoneInput.trim()) {
                            onUpdate(goal.id, { milestones: [...(goal.milestones || []), milestoneInput.trim()] } as any);
                            setMilestoneInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Habits View ─────────────────────────────────────────────────
function HabitsView({
  habits,
  habitLogs,
  onAdd,
  onComplete,
  onDelete,
}: {
  habits: Habit[];
  habitLogs: HabitLog[];
  onAdd: (h: Partial<Habit>) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), frequency });
    setTitle('');
    setShowForm(false);
  };

  // Generate 30-day grid
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const last30 = getLast30Days();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Your Habits</h3>
          <p className="text-xs text-gray-500">{habits.length} habit{habits.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-teal text-sm">+ Add Habit</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-3 border-2 border-teal-200 animate-slide-up">
          <input
            className="input-field w-full"
            placeholder="Habit name (e.g. Meditate 10 min)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select className="input-field" value={frequency} onChange={(e) => setFrequency(e.target.value as HabitFrequency)}>
            <option value="daily">Daily</option>
            <option value="3x">3x per week</option>
            <option value="4x">4x per week</option>
            <option value="5x">5x per week</option>
            <option value="weekly">Weekly</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary text-sm">Add Habit</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="text-lg font-semibold mb-2">Build better habits</h3>
          <p className="text-gray-500 mb-4">Track daily habits and build streaks</p>
          <button onClick={() => setShowForm(true)} className="btn-teal">Add Your First Habit</button>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const completedToday = habitLogs.some(
              (l) => l.habit_id === habit.id && l.completed_at === today
            );
            const logsForHabit = habitLogs.filter((l) => l.habit_id === habit.id);
            const completedDates = new Set(logsForHabit.map((l) => l.completed_at));

            return (
              <div key={habit.id} className="card p-5 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => !completedToday && onComplete(habit.id)}
                      disabled={completedToday}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300',
                        completedToday
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-teal-100 hover:scale-110'
                      )}
                    >
                      {completedToday ? '✓' : '○'}
                    </button>
                    <div>
                      <p className="font-medium">{habit.title}</p>
                      <p className="text-xs text-gray-500">{habit.frequency} · Best: {habit.best_streak} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-500">🔥 {habit.current_streak}</p>
                      <p className="text-[10px] text-gray-500">streak</p>
                    </div>
                    <button onClick={() => onDelete(habit.id)} className="text-gray-400 hover:text-red-500 text-sm">×</button>
                  </div>
                </div>

                {/* 30-day Heatmap */}
                <div className="grid grid-cols-15 gap-1 mt-2">
                  {last30.map((day) => (
                    <div
                      key={day}
                      title={day}
                      className={cn(
                        'w-3.5 h-3.5 rounded-sm transition-colors',
                        completedDates.has(day)
                          ? 'bg-green-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      )}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Last 30 days</p>

                {/* Streak bonus indicator */}
                {habit.current_streak >= 5 && habit.current_streak < 7 && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                    🎁 {7 - habit.current_streak} more day{7 - habit.current_streak > 1 ? 's' : ''} for +$5 MLY bonus!
                  </div>
                )}
                {habit.current_streak >= 25 && habit.current_streak < 30 && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                    🏆 {30 - habit.current_streak} more day{30 - habit.current_streak > 1 ? 's' : ''} for +$15 MLY bonus!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Journal View ────────────────────────────────────────────────
function JournalView({
  entries,
  onAdd,
  onDelete,
}: {
  entries: JournalEntry[];
  onAdd: (content: string, mood: number) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAdd(content.trim(), mood);
    setContent('');
    setMood(3);
    setShowForm(false);
  };

  // Monthly mood trend (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const moodByDay = new Map<string, number[]>();
  entries.forEach((e) => {
    const day = e.created_at.split('T')[0];
    if (!moodByDay.has(day)) moodByDay.set(day, []);
    moodByDay.get(day)!.push(e.mood);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Journal</h3>
          <p className="text-xs text-gray-500">{entries.length} entries</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-teal text-sm">+ Write</button>
      </div>

      {/* Mood Trend */}
      {entries.length > 0 && (
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">30-Day Mood Trend</p>
          <div className="flex items-end gap-0.5 h-8">
            {last30Days.map((day) => {
              const moods = moodByDay.get(day);
              const avg = moods ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
              const moodColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400'];
              return (
                <div
                  key={day}
                  className={cn(
                    'flex-1 rounded-sm transition-all min-w-[4px]',
                    avg > 0 ? moodColors[Math.round(avg)] : 'bg-gray-100 dark:bg-gray-800'
                  )}
                  style={{ height: avg > 0 ? `${(avg / 5) * 100}%` : '15%' }}
                  title={`${day}: ${avg > 0 ? MOOD_EMOJIS[Math.round(avg) - 1] : 'No entry'}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Write Form */}
      {showForm && (
        <div className="card p-5 space-y-4 border-2 border-teal-200 animate-slide-up">
          <textarea
            className="input-field w-full min-h-[120px] resize-y"
            placeholder="How was your day? What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
            <p className="text-sm text-gray-500 mb-2">How are you feeling?</p>
            <div className="flex gap-3">
              {MOOD_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setMood(i + 1)}
                  className={cn(
                    'w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all',
                    mood === i + 1
                      ? 'bg-teal-100 scale-125 shadow-md'
                      : 'hover:scale-110 opacity-50 hover:opacity-100'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary text-sm">Save Entry</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">Start journaling</h3>
          <p className="text-gray-500 mb-4">Reflect on your day and track your mood</p>
          <button onClick={() => setShowForm(true)} className="btn-teal">Write First Entry</button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="card p-4 cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{MOOD_EMOJIS[entry.mood - 1]}</span>
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {expanded !== entry.id && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1 mt-0.5">
                        {entry.content}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmDelete === entry.id) {
                      onDelete(entry.id);
                      setConfirmDelete(null);
                    } else {
                      setConfirmDelete(entry.id);
                      setTimeout(() => setConfirmDelete(null), 3000);
                    }
                  }}
                  className={cn(
                    'text-xs px-2 py-1 rounded transition-colors',
                    confirmDelete === entry.id
                      ? 'bg-red-100 text-red-600'
                      : 'text-gray-400 hover:text-red-500'
                  )}
                >
                  {confirmDelete === entry.id ? 'Confirm?' : '🗑'}
                </button>
              </div>
              {expanded === entry.id && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Celebration Overlay ─────────────────────────────────────────
function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-slide-up">
      <div className="text-center">
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-2">Goal Complete!</h2>
        <p className="text-white/80">You're making amazing progress!</p>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-2.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
