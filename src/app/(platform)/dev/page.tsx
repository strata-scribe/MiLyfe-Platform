'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type DevTab = 'goals' | 'habits' | 'journal' | 'planner';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string;
  target_date: string | null;
  progress: number;
  created_at: string;
}

interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: string;
  streak: number;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  logged_at: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: number | null;
  created_at: string;
}

export default function DevPage() {
  const [tab, setTab] = useState<DevTab>('goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyEvents, setFamilyEvents] = useState<any[]>([]);

  // Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('personal');
  const [goalDate, setGoalDate] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  // Habit form
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFrequency, setHabitFrequency] = useState('daily');
  const [addingHabit, setAddingHabit] = useState(false);

  // Journal form
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState<number>(3);
  const [addingJournal, setAddingJournal] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Goals
      const { data: goalData } = await supabase
        .from('dev_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (goalData) setGoals(goalData);

      // Habits
      const { data: habitData } = await supabase
        .from('dev_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (habitData) setHabits(habitData);

      // Habit logs (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logData } = await supabase
        .from('dev_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', thirtyDaysAgo);
      if (logData) setHabitLogs(logData);

      // Journal
      const { data: journalData } = await supabase
        .from('dev_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (journalData) setJournal(journalData);

      // Family events for planner
      const { data: membership } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (membership) {
        const today = new Date().toISOString().split('T')[0];
        const { data: evts } = await supabase
          .from('family_events')
          .select('*')
          .eq('family_id', membership.family_id)
          .eq('date', today);
        if (evts) setFamilyEvents(evts);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  // Goal handlers
  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddingGoal(true);
    const { data } = await supabase.from('dev_goals').insert({
      user_id: user.id,
      title: goalTitle.trim(),
      category: goalCategory,
      target_date: goalDate || null,
      progress: 0,
    }).select().single();
    if (data) setGoals(prev => [data, ...prev]);
    setGoalTitle('');
    setGoalDate('');
    setAddingGoal(false);
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    await supabase.from('dev_goals').update({ progress }).eq('id', goalId);
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress } : g));
  };

  const deleteGoal = async (goalId: string) => {
    await supabase.from('dev_goals').delete().eq('id', goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // Habit handlers
  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddingHabit(true);
    const { data } = await supabase.from('dev_habits').insert({
      user_id: user.id,
      title: habitTitle.trim(),
      frequency: habitFrequency,
      streak: 0,
    }).select().single();
    if (data) setHabits(prev => [data, ...prev]);
    setHabitTitle('');
    setAddingHabit(false);
  };

  const logHabit = async (habit: Habit) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Check if already logged today
    const alreadyLogged = habitLogs.some(l => l.habit_id === habit.id && l.logged_at.startsWith(today));
    if (alreadyLogged) return;

    const { data } = await supabase.from('dev_habit_logs').insert({
      habit_id: habit.id,
      user_id: user.id,
      logged_at: new Date().toISOString(),
    }).select().single();
    if (data) setHabitLogs(prev => [...prev, data]);

    // Update streak
    const newStreak = habit.streak + 1;
    await supabase.from('dev_habits').update({ streak: newStreak }).eq('id', habit.id);
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: newStreak } : h));

    // Award MLY for streaks
    if (newStreak === 7) {
      await supabase.from('mly_transactions').insert({
        from_id: null, to_id: user.id, amount: 5, type: 'earn',
        description: '7-day habit streak bonus!',
      });
      await supabase.rpc('increment_balance', { user_id: user.id, amount: 5 });
    } else if (newStreak === 30) {
      await supabase.from('mly_transactions').insert({
        from_id: null, to_id: user.id, amount: 15, type: 'earn',
        description: '30-day habit streak bonus!',
      });
      await supabase.rpc('increment_balance', { user_id: user.id, amount: 15 });
    }
  };

  // Journal handlers
  const addJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddingJournal(true);
    const { data } = await supabase.from('dev_journal').insert({
      user_id: user.id,
      content: journalContent.trim(),
      mood: journalMood,
    }).select().single();
    if (data) setJournal(prev => [data, ...prev]);
    setJournalContent('');
    setJournalMood(3);
    setAddingJournal(false);
  };

  const deleteJournalEntry = async (id: string) => {
    await supabase.from('dev_journal').delete().eq('id', id);
    setJournal(prev => prev.filter(j => j.id !== id));
  };

  // Helpers
  const today = new Date().toISOString().split('T')[0];
  const isLoggedToday = (habitId: string) => habitLogs.some(l => l.habit_id === habitId && l.logged_at.startsWith(today));

  const categoryIcons: Record<string, string> = {
    health: '💪', career: '💼', financial: '💰', social: '🤝', education: '📚', personal: '🌱',
  };

  const moodEmojis = ['😞', '😕', '😐', '🙂', '😄'];

  // Heatmap for last 30 days
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getHeatmapColor = (date: string) => {
    const count = habitLogs.filter(l => l.logged_at.startsWith(date)).length;
    if (count === 0) return 'bg-gray-100 dark:bg-harbor-800';
    if (count === 1) return 'bg-teal-200 dark:bg-teal-900';
    if (count === 2) return 'bg-teal-400 dark:bg-teal-700';
    return 'bg-teal-600 dark:bg-teal-500';
  };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiDev</h1>
        <p className="text-xs text-gray-500">Personal development. Goals, habits, journal, and planning.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'goals', label: '🎯 Goals' },
          { key: 'habits', label: '🔄 Habits' },
          { key: 'journal', label: '📝 Journal' },
          { key: 'planner', label: '📋 Planner' },
        ] as { key: DevTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Goals */}
      {tab === 'goals' && (
        <div className="space-y-4">
          <form onSubmit={addGoal} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">New Goal</p>
            <input
              type="text"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              className="input-field text-sm"
              placeholder="What do you want to achieve?"
              required
            />
            <div className="flex gap-2">
              <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} className="input-field text-sm flex-1">
                <option value="health">Health</option>
                <option value="career">Career</option>
                <option value="financial">Financial</option>
                <option value="social">Social</option>
                <option value="education">Education</option>
                <option value="personal">Personal</option>
              </select>
              <input
                type="date"
                value={goalDate}
                onChange={e => setGoalDate(e.target.value)}
                className="input-field text-sm flex-1"
                placeholder="Target date"
              />
            </div>
            <button type="submit" disabled={addingGoal} className="btn-teal w-full text-sm disabled:opacity-50">
              {addingGoal ? 'Adding...' : 'Add Goal'}
            </button>
          </form>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No goals yet. Set one above!</p>
            ) : goals.map(goal => (
              <div key={goal.id} className="card">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{categoryIcons[goal.category] || '🎯'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-harbor-800 dark:text-white">{goal.title}</p>
                      <button onClick={() => deleteGoal(goal.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-harbor-800 text-gray-500 capitalize">{goal.category}</span>
                      {goal.target_date && <span className="text-[10px] text-gray-400">Due: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400">Progress</span>
                        <span className="text-[10px] font-bold text-teal-500">{goal.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={e => updateGoalProgress(goal.id, parseInt(e.target.value))}
                        className="w-full mt-1 accent-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits */}
      {tab === 'habits' && (
        <div className="space-y-4">
          {/* Heatmap */}
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Last 30 Days</p>
            <div className="grid grid-cols-10 gap-1">
              {getLast30Days().map(date => (
                <div
                  key={date}
                  className={cn('w-full aspect-square rounded-sm', getHeatmapColor(date))}
                  title={date}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-400">Less</span>
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-harbor-800" />
              <div className="w-3 h-3 rounded-sm bg-teal-200 dark:bg-teal-900" />
              <div className="w-3 h-3 rounded-sm bg-teal-400 dark:bg-teal-700" />
              <div className="w-3 h-3 rounded-sm bg-teal-600 dark:bg-teal-500" />
              <span className="text-[10px] text-gray-400">More</span>
            </div>
          </div>

          <form onSubmit={addHabit} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">New Habit</p>
            <input
              type="text"
              value={habitTitle}
              onChange={e => setHabitTitle(e.target.value)}
              className="input-field text-sm"
              placeholder="e.g. Read 20 minutes, Drink water, Exercise"
              required
            />
            <select value={habitFrequency} onChange={e => setHabitFrequency(e.target.value)} className="input-field text-sm">
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
            <button type="submit" disabled={addingHabit} className="btn-teal w-full text-sm disabled:opacity-50">
              {addingHabit ? 'Adding...' : 'Add Habit'}
            </button>
          </form>

          <div className="space-y-2">
            {habits.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No habits tracked yet.</p>
            ) : habits.map(habit => {
              const logged = isLoggedToday(habit.id);
              return (
                <div key={habit.id} className="card flex items-center gap-3 !py-3">
                  <button
                    onClick={() => logHabit(habit)}
                    disabled={logged}
                    className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all', logged ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-200 dark:border-harbor-700 hover:border-teal-500')}
                  >
                    {logged ? '✓' : ''}
                  </button>
                  <div className="flex-1">
                    <p className={cn('text-sm', logged ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{habit.title}</p>
                    <p className="text-[10px] text-gray-400">{habit.frequency} • {habit.streak} day streak</p>
                  </div>
                  {habit.streak >= 7 && <span className="text-sm">🔥</span>}
                </div>
              );
            })}
          </div>

          {/* Streak rewards info */}
          <div className="card bg-mly-50 dark:bg-mly-900/20 border-mly-200 dark:border-mly-800">
            <p className="text-xs font-bold text-harbor-800 dark:text-white">Streak Rewards</p>
            <p className="text-[10px] text-gray-500 mt-1">7-day streak: +5 MLY • 30-day streak: +15 MLY</p>
          </div>
        </div>
      )}

      {/* Journal */}
      {tab === 'journal' && (
        <div className="space-y-4">
          <form onSubmit={addJournalEntry} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">New Entry</p>
            <textarea
              value={journalContent}
              onChange={e => setJournalContent(e.target.value)}
              className="input-field text-sm min-h-[100px]"
              placeholder="What's on your mind today?"
              required
            />
            <div>
              <p className="text-xs text-gray-500 mb-1">Mood</p>
              <div className="flex gap-2">
                {moodEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setJournalMood(i + 1)}
                    className={cn('text-xl p-1 rounded-lg transition-all', journalMood === i + 1 ? 'bg-teal-100 dark:bg-teal-900/30 scale-125' : 'opacity-50 hover:opacity-100')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={addingJournal} className="btn-teal w-full text-sm disabled:opacity-50">
              {addingJournal ? 'Saving...' : 'Save Entry'}
            </button>
          </form>

          <div className="space-y-3">
            {journal.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No journal entries yet. Start writing!</p>
            ) : journal.map(entry => (
              <div key={entry.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{entry.mood ? moodEmojis[entry.mood - 1] : '📝'}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <button onClick={() => deleteJournalEntry(entry.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                </div>
                <p className="text-sm text-harbor-800 dark:text-gray-200 mt-2 whitespace-pre-wrap">{entry.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planner */}
      {tab === 'planner' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-harbor-800 to-teal-700 text-white p-5">
            <p className="text-xs text-harbor-200">Today</p>
            <p className="text-lg font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Today's habits */}
          {habits.filter(h => h.frequency === 'daily' || h.frequency === 'weekdays').length > 0 && (
            <div className="card">
              <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">🔄 Today&apos;s Habits</p>
              {habits.filter(h => h.frequency === 'daily' || h.frequency === 'weekdays').map(habit => (
                <div key={habit.id} className="flex items-center gap-2 py-1.5">
                  <span className={cn('w-4 h-4 rounded-full border-2', isLoggedToday(habit.id) ? 'bg-teal-500 border-teal-500' : 'border-gray-300 dark:border-harbor-700')} />
                  <p className={cn('text-xs', isLoggedToday(habit.id) ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{habit.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Active goals */}
          {goals.filter(g => g.progress < 100).length > 0 && (
            <div className="card">
              <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">🎯 Active Goals</p>
              {goals.filter(g => g.progress < 100).slice(0, 5).map(goal => (
                <div key={goal.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-sm">{categoryIcons[goal.category] || '🎯'}</span>
                  <p className="text-xs text-harbor-800 dark:text-white flex-1">{goal.title}</p>
                  <span className="text-[10px] font-bold text-teal-500">{goal.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Family events today */}
          {familyEvents.length > 0 && (
            <div className="card">
              <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">👨‍👩‍👧 Family Events Today</p>
              {familyEvents.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-2 py-1.5">
                  <span>📅</span>
                  <p className="text-xs text-harbor-800 dark:text-white">{ev.title}</p>
                </div>
              ))}
            </div>
          )}

          {goals.length === 0 && habits.length === 0 && familyEvents.length === 0 && (
            <div className="card text-center py-6">
              <p className="text-gray-400 text-sm">Nothing planned for today.</p>
              <p className="text-xs text-gray-400 mt-1">Add goals and habits to see them here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
