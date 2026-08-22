'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface HealthCheckIn {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  energy: number;
  sleep_hours: number;
  water_glasses: number;
  exercise_mins: number;
  journal: string | null;
  symptoms: string[];
  medication_taken: boolean;
  created_at: string;
}

interface Habit {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  longest_streak: number;
  completed_today: boolean;
  mly_reward: number;
}

interface HealthGoal {
  id: string;
  user_id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  category: string;
  deadline: string | null;
}

type HealthTab = 'checkin' | 'history' | 'habits' | 'goals' | 'community';

const MOODS = [
  { value: 1, emoji: '😰', label: 'Struggling' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const SYMPTOMS = ['Headache', 'Fatigue', 'Anxiety', 'Pain', 'Insomnia', 'Nausea', 'Brain Fog', 'Shortness of Breath'];

export default function HealthPage() {
  const [tab, setTab] = useState<HealthTab>('checkin');
  const [checkIns, setCheckIns] = useState<HealthCheckIn[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedInToday, setCheckedInToday] = useState(false);

  // Check-in form
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState('7');
  const [water, setWater] = useState('4');
  const [exercise, setExercise] = useState('0');
  const [journal, setJournal] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [medTaken, setMedTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Habit form
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitIcon, setHabitIcon] = useState('💪');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    if (user) {
      const { data: ci } = await supabase.from('health_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30);
      if (ci) {
        setCheckIns(ci);
        const today = new Date().toISOString().split('T')[0];
        setCheckedInToday(ci.some(c => c.date === today));
      }
      const { data: h } = await supabase.from('health_habits').select('*').eq('user_id', user.id).order('streak', { ascending: false });
      if (h) setHabits(h);
      const { data: g } = await supabase.from('health_goals').select('*').eq('user_id', user.id);
      if (g) setGoals(g);
    }
    setLoading(false);
  }

  async function submitCheckIn() {
    if (!user) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('health_checkins').insert({
      user_id: user.id, date: new Date().toISOString().split('T')[0],
      mood, energy, sleep_hours: parseFloat(sleep), water_glasses: parseInt(water),
      exercise_mins: parseInt(exercise), journal: journal.trim() || null,
      symptoms, medication_taken: medTaken,
    });
    setCheckedInToday(true);
    setSubmitting(false);
    toast.success('Check-in saved! +5 $MLY earned 🎉');
    loadData();
  }

  async function toggleHabit(habitId: string) {
    const supabase = createClient();
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.completed_today) return;
    await supabase.from('health_habits').update({ completed_today: true, streak: habit.streak + 1 }).eq('id', habitId);
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed_today: true, streak: h.streak + 1 } : h));
    toast.success(`${habit.icon} Streak: ${habit.streak + 1} days!`);
  }

  async function addHabit() {
    if (!user || !habitTitle.trim()) return;
    const supabase = createClient();
    await supabase.from('health_habits').insert({
      user_id: user.id, title: habitTitle.trim(), icon: habitIcon,
      frequency: 'daily', streak: 0, longest_streak: 0, completed_today: false, mly_reward: 2,
    });
    setHabitTitle(''); setShowAddHabit(false);
    toast.success('Habit added!');
    loadData();
  }

  function toggleSymptom(symptom: string) {
    setSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  }

  // Chart data (last 7 days)
  const last7 = checkIns.slice(0, 7).reverse();
  const avgMood = last7.length > 0 ? (last7.reduce((s, c) => s + c.mood, 0) / last7.length).toFixed(1) : '—';
  const avgSleep = last7.length > 0 ? (last7.reduce((s, c) => s + c.sleep_hours, 0) / last7.length).toFixed(1) : '—';
  const totalExercise = last7.reduce((s, c) => s + c.exercise_mins, 0);
  const currentStreak = checkIns.length > 0 ? (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < checkIns.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (checkIns[i]?.date === expected.toISOString().split('T')[0]) streak++;
      else break;
    }
    return streak;
  })() : 0;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiHealth</h1>
          <p className="text-xs text-gray-500">Track your wellness · Earn $MLY for consistency</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-teal-600">{currentStreak}🔥</p>
          <p className="text-[9px] text-gray-400">day streak</p>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center py-2.5">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{avgMood}</p>
          <p className="text-[9px] text-gray-400">Avg Mood</p>
        </div>
        <div className="card text-center py-2.5">
          <p className="text-lg font-bold text-blue-600">{avgSleep}h</p>
          <p className="text-[9px] text-gray-400">Avg Sleep</p>
        </div>
        <div className="card text-center py-2.5">
          <p className="text-lg font-bold text-green-600">{totalExercise}m</p>
          <p className="text-[9px] text-gray-400">Exercise</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['checkin', 'history', 'habits', 'goals', 'community'] as HealthTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'checkin' ? '📝 Today' : t === 'history' ? '📊 Trends' : t === 'habits' ? '✅ Habits' : t === 'goals' ? '🎯 Goals' : '🏘️'}</button>
        ))}
      </div>

      {/* Check-in Tab */}
      {tab === 'checkin' && (
        <div className="space-y-3">
          {checkedInToday ? (
            <div className="card text-center py-6">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">You&apos;ve checked in today!</p>
              <p className="text-xs text-gray-500 mt-1">Come back tomorrow to keep your streak going.</p>
              <p className="text-xs text-mly-600 font-bold mt-2">+5 $MLY earned</p>
            </div>
          ) : (
            <div className="card space-y-4">
              {/* Mood */}
              <div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">How are you feeling?</p>
                <div className="flex justify-between">
                  {MOODS.map(m => (
                    <button key={m.value} onClick={() => setMood(m.value)} className={cn('flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all', mood === m.value ? 'bg-teal-50 dark:bg-teal-900/20 scale-110' : 'opacity-60 hover:opacity-100')}>
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[9px] text-gray-500">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mb-1">Energy Level</p>
                <input type="range" min="1" max="5" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full accent-teal-500" />
                <div className="flex justify-between text-[9px] text-gray-400"><span>Drained</span><span className="font-bold text-harbor-700 dark:text-white">{energy}/5</span><span>Energized</span></div>
              </div>

              {/* Sleep & Water & Exercise */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Sleep (hrs)</label>
                  <input value={sleep} onChange={e => setSleep(e.target.value)} className="input-field text-center mt-1" type="number" step="0.5" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Water (glasses)</label>
                  <input value={water} onChange={e => setWater(e.target.value)} className="input-field text-center mt-1" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Exercise (min)</label>
                  <input value={exercise} onChange={e => setExercise(e.target.value)} className="input-field text-center mt-1" type="number" />
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mb-2">Any symptoms?</p>
                <div className="flex flex-wrap gap-1">
                  {SYMPTOMS.map(s => (
                    <button key={s} onClick={() => toggleSymptom(s)} className={cn('text-[10px] px-2 py-1 rounded-full border transition-colors', symptoms.includes(s) ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-200 dark:border-harbor-700 text-gray-500')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medication */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-harbor-800 dark:text-white">Medication taken?</span>
                <button onClick={() => setMedTaken(!medTaken)} className={cn('w-10 h-5 rounded-full transition-colors relative', medTaken ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600')}>
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', medTaken ? 'left-5' : 'left-0.5')} />
                </button>
              </div>

              {/* Journal */}
              <div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mb-1">Journal (private)</p>
                <textarea value={journal} onChange={e => setJournal(e.target.value)} placeholder="How was your day? What's on your mind?" className="input-field resize-none text-xs" rows={3} />
              </div>

              <button onClick={submitCheckIn} disabled={submitting} className="btn-teal w-full disabled:opacity-50">
                {submitting ? 'Saving...' : 'Complete Check-In (+5 $MLY)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* History/Trends Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {/* Mood chart (text bars) */}
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-3">Mood — Last 7 Days</h3>
            {last7.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Check in daily to see your trends</p>
            ) : (
              <div className="space-y-1.5">
                {last7.map(ci => (
                  <div key={ci.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-8">{new Date(ci.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', ci.mood >= 4 ? 'bg-green-500' : ci.mood === 3 ? 'bg-yellow-500' : 'bg-orange-500')} style={{ width: `${(ci.mood / 5) * 100}%` }} />
                    </div>
                    <span className="text-sm">{MOODS.find(m => m.value === ci.mood)?.emoji}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sleep chart */}
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-3">Sleep — Last 7 Days</h3>
            {last7.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-1.5">
                {last7.map(ci => (
                  <div key={ci.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-8">{new Date(ci.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', ci.sleep_hours >= 7 ? 'bg-blue-500' : ci.sleep_hours >= 5 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${Math.min((ci.sleep_hours / 10) * 100, 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-8 text-right">{ci.sleep_hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          {last7.length >= 3 && (
            <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
              <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-1">💡 Insights</h3>
              <div className="space-y-1 text-xs text-teal-600 dark:text-teal-300">
                {parseFloat(avgSleep) >= 7 && <p>✓ Great sleep average — keep it up!</p>}
                {parseFloat(avgSleep) < 6 && <p>⚠️ Sleep is low — try setting a consistent bedtime.</p>}
                {totalExercise >= 150 && <p>✓ Hit your weekly exercise target!</p>}
                {totalExercise < 60 && <p>💪 Try adding a 15-min walk to boost energy.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Habits Tab */}
      {tab === 'habits' && (
        <div className="space-y-3">
          {!showAddHabit ? (
            <button onClick={() => setShowAddHabit(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ New Habit</button>
          ) : (
            <div className="card space-y-2 border-2 border-teal-200 dark:border-teal-800">
              <div className="flex gap-2">
                <input value={habitIcon} onChange={e => setHabitIcon(e.target.value)} className="input-field w-12 text-center text-xl" maxLength={2} />
                <input value={habitTitle} onChange={e => setHabitTitle(e.target.value)} placeholder="Habit name" className="input-field flex-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={addHabit} disabled={!habitTitle.trim()} className="btn-teal flex-1 text-xs disabled:opacity-50">Add</button>
                <button onClick={() => setShowAddHabit(false)} className="px-3 py-2 text-xs bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {habits.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-gray-500">No habits yet — add your first one!</p>
              <p className="text-xs text-gray-400 mt-1">Earn $MLY for every day you maintain a streak.</p>
            </div>
          ) : habits.map(habit => (
            <div key={habit.id} className="card flex items-center gap-3">
              <button onClick={() => toggleHabit(habit.id)} className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all', habit.completed_today ? 'bg-green-100 border-green-400 text-green-700' : 'border-gray-300 dark:border-gray-600 hover:border-teal-400')}>
                {habit.completed_today ? '✓' : habit.icon}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', habit.completed_today ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{habit.title}</p>
                <p className="text-[10px] text-gray-400">{habit.streak} day streak · Best: {habit.longest_streak}</p>
              </div>
              <span className="text-xs text-mly-600 font-bold">+{habit.mly_reward}</span>
            </div>
          ))}
        </div>
      )}

      {/* Goals Tab */}
      {tab === 'goals' && (
        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm text-gray-500">No health goals set</p>
              <p className="text-xs text-gray-400 mt-1">Set goals in the habits tab above to track your targets</p>
            </div>
          ) : goals.map(goal => (
            <div key={goal.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{goal.title}</p>
                <span className="text-xs text-gray-500">{goal.current}/{goal.target} {goal.unit}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
          <div className="card bg-gray-50 dark:bg-harbor-900/50">
            <p className="text-xs text-gray-500">Suggested goals:</p>
            <div className="mt-2 space-y-1">
              {['Sleep 8 hours/night', 'Exercise 30 min/day', 'Drink 8 glasses water', 'Meditate 10 min/day'].map(g => (
                <p key={g} className="text-xs text-teal-600">+ {g}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Community Tab */}
      {tab === 'community' && (
        <div className="space-y-3">
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500 mb-1">Community Mood Average</p>
            <p className="text-3xl">😊</p>
            <p className="text-xs text-green-600 mt-1">Positive today</p>
          </div>
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Community Challenges</h3>
            {[
              { title: '30-Day Meditation Challenge', participants: 24, daysLeft: 12, icon: '🧘' },
              { title: 'Walk 10K Steps/Day', participants: 45, daysLeft: 5, icon: '🚶' },
              { title: 'No Sugar Week', participants: 18, daysLeft: 3, icon: '🍎' },
            ].map(ch => (
              <div key={ch.title} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                <span className="text-xl">{ch.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">{ch.title}</p>
                  <p className="text-[10px] text-gray-400">{ch.participants} people · {ch.daysLeft} days left</p>
                </div>
                <button className="text-[10px] px-2 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded">Join</button>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Resources</h3>
            {[
              { label: 'Crisis Support (988)', href: 'tel:988', icon: '📞' },
              { label: 'Therapist Directory', href: '/health/therapists', icon: '🧠' },
              { label: 'Wellness Courses', href: '/learn', icon: '📚' },
              { label: 'Health Sharing Pool', href: '/finance/health-sharing', icon: '❤️‍🩹' },
            ].map(r => (
              <Link key={r.label} href={r.href} className="flex items-center gap-2 py-1.5 text-xs text-teal-600 hover:underline">
                <span>{r.icon}</span> {r.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
