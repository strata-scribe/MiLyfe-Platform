'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

const moods = [
  { emoji: '😢', label: 'Rough', value: 1 },
  { emoji: '😕', label: 'Low', value: 2 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😊', label: 'Great', value: 5 },
];

interface CheckinHistory {
  id: string;
  mood: number;
  energy: number;
  sleep_hours: number;
  created_at: string;
}

export default function HealthPage() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(3);
  const [sleep, setSleep] = useState<string>('7');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [weekHistory, setWeekHistory] = useState<(CheckinHistory | null)[]>([]);
  const [error, setError] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();

  // Check if already checked in today and load streak
  useEffect(() => {
    if (!user) return;

    const loadHealthData = async () => {
      // Get today's check-in
      const today = new Date().toISOString().split('T')[0];
      const { data: todayCheckin } = await supabase
        .from('health_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (todayCheckin) {
        setAlreadyCheckedIn(true);
      }

      // Get last 7 days of check-ins for streak calc
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentCheckins } = await supabase
        .from('health_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Calculate streak
      if (recentCheckins && recentCheckins.length > 0) {
        let currentStreak = 0;
        const checkDate = new Date();

        // If already checked in today, start counting from today
        if (todayCheckin) {
          currentStreak = 1;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        // Walk backwards through days
        for (let i = 0; i < 30; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const hasCheckin = recentCheckins.some(
            (c) => c.created_at.split('T')[0] === dateStr
          );

          if (hasCheckin) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        setStreak(currentStreak);
      }

      // Build week history (Mon-Sun)
      const week: (CheckinHistory | null)[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const match = recentCheckins?.find(
          (c) => c.created_at.split('T')[0] === dateStr
        );
        week.push(match || null);
      }
      setWeekHistory(week);
    };

    loadHealthData();
  }, [user, supabase, checkedIn]);

  const handleCheckin = async () => {
    if (selectedMood === null || !user) return;
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('health_checkins').insert({
      user_id: user.id,
      mood: selectedMood,
      energy,
      sleep_hours: parseFloat(sleep) || 0,
      notes: notes.trim() || null,
      mly_earned: 5,
    });

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
        setError("You've already checked in today! Come back tomorrow.");
        setAlreadyCheckedIn(true);
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    // Award MLY
    await supabase.from('mly_transactions').insert({
      to_id: user.id,
      amount: 5,
      type: 'earn',
      description: 'Daily health check-in',
    });

    // Update streak on profile
    await supabase
      .from('profiles')
      .update({ health_streak: streak + 1 })
      .eq('id', user.id);

    setCheckedIn(true);
    setStreak((prev) => prev + 1);
    setLoading(false);
  };

  if (checkedIn) {
    return (
      <div className="space-y-6 animate-slide-up text-center py-12">
        <div className="text-6xl">✨</div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Check-in complete!</h1>
        <p className="text-gray-500 dark:text-gray-400">+5 $MLY earned. {streak} day streak!</p>
        <div className="card max-w-xs mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {selectedMood && selectedMood >= 4
              ? "You're feeling good today — carry that energy into your community!"
              : selectedMood && selectedMood <= 2
              ? "Tough day. You showed up anyway. That matters. Mi is here if you need anything."
              : "Steady. Consistent check-ins build self-awareness over time."}
          </p>
        </div>
        <button onClick={() => setCheckedIn(false)} className="btn-teal">
          View My Week
        </button>
      </div>
    );
  }

  if (alreadyCheckedIn) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Already checked in today</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Come back tomorrow. Your streak is at <strong className="text-teal-500">{streak} days</strong>.
          </p>
        </div>

        {/* Weekly Overview */}
        <section className="card">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">This Week</h2>
          <div className="flex justify-between">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm',
                  weekHistory[i]
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                    : 'bg-gray-100 dark:bg-harbor-800 text-gray-400'
                )}>
                  {weekHistory[i] ? moods[weekHistory[i]!.mood - 1]?.emoji : '·'}
                </div>
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Insights */}
        <section className="card">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Weekly Insights</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-harbor-800 dark:text-white">
                {weekHistory.filter(Boolean).length}/7
              </p>
              <p className="text-xs text-gray-500">Days active</p>
            </div>
            <div>
              <p className="text-lg font-bold text-teal-500">{streak}</p>
              <p className="text-xs text-gray-500">Day streak</p>
            </div>
            <div>
              <p className="text-lg font-bold text-mly-600">
                {weekHistory.filter(Boolean).length * 5}
              </p>
              <p className="text-xs text-gray-500">MLY earned</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiHealth</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily check-in. Private. Yours.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Mood */}
      <section className="card">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">How are you feeling?</h2>
        <div className="flex justify-between">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                selectedMood === mood.value
                  ? 'bg-teal-50 dark:bg-teal-900/20 scale-110 ring-2 ring-teal-500'
                  : 'hover:bg-gray-50 dark:hover:bg-harbor-800'
              )}
              aria-label={mood.label}
              aria-pressed={selectedMood === mood.value}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs text-gray-500">{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Energy */}
      <section className="card">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Energy level: {['', 'Drained', 'Low', 'Normal', 'Energized', 'Wired'][energy]}
        </h2>
        <input
          type="range"
          min="1"
          max="5"
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="w-full accent-teal-500"
          aria-label="Energy level"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Drained</span>
          <span>Wired</span>
        </div>
      </section>

      {/* Sleep */}
      <section className="card">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Hours of sleep last night</h2>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          className="input-field text-center text-2xl font-bold"
          aria-label="Hours of sleep"
        />
      </section>

      {/* Notes */}
      <section className="card">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Anything on your mind? (private)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field resize-none h-20"
          placeholder="Only you can see this..."
          maxLength={300}
        />
      </section>

      {/* Submit */}
      <button
        onClick={handleCheckin}
        disabled={selectedMood === null || loading}
        className="btn-teal w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : selectedMood === null ? 'Select your mood to check in' : 'Complete Check-in (+5 MLY)'}
      </button>

      {/* Weekly Overview */}
      <section className="card">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">This Week</h2>
        <div className="flex justify-between">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm',
                weekHistory[i]
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                  : 'bg-gray-100 dark:bg-harbor-800 text-gray-400'
              )}>
                {weekHistory[i] ? moods[weekHistory[i]!.mood - 1]?.emoji : '·'}
              </div>
              <span className="text-xs text-gray-400">{day}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
