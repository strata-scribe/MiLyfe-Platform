'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type Step = 'welcome' | 'city' | 'interests' | 'done';

const cities = [
  'Jacksonville', 'Miami', 'Atlanta', 'Houston', 'Chicago',
  'New York', 'Los Angeles', 'Philadelphia', 'Detroit', 'Memphis',
  'Baltimore', 'Oakland', 'St. Louis', 'New Orleans', 'Other',
];

const interests = [
  { id: 'civic', icon: '🏛️', label: 'Civic Issues', desc: 'Report and fix neighborhood problems' },
  { id: 'health', icon: '💚', label: 'Health & Wellness', desc: 'Daily check-ins and self-care' },
  { id: 'commerce', icon: '🛍️', label: 'Local Commerce', desc: 'Buy and sell with $MLY' },
  { id: 'social', icon: '💬', label: 'Community Connect', desc: 'Meet neighbors, join groups' },
  { id: 'safety', icon: '🛡️', label: 'Safety & Mutual Aid', desc: 'Look out for each other' },
  { id: 'events', icon: '📅', label: 'Events & Gatherings', desc: 'Cleanups, town halls, block parties' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedCity, setSelectedCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { user, setUser } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    // Update profile with onboarding data
    await supabase
      .from('profiles')
      .update({
        city: selectedCity || 'Jacksonville',
        neighborhood: neighborhood.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Update local state
    setUser({
      ...user,
      city: selectedCity || 'Jacksonville',
    });

    setStep('done');
    setSaving(false);
  };

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="space-y-8 animate-slide-up text-center py-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-harbor-800 via-teal-500 to-mly-500 flex items-center justify-center mx-auto animate-float">
          <span className="text-3xl font-bold text-white">Mi</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">
            Welcome to MiLyfe, {user?.display_name || 'neighbor'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            Let&apos;s set you up in 30 seconds. Your community is waiting.
          </p>
        </div>

        <div className="space-y-3 max-w-xs mx-auto text-left">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-mly-100 dark:bg-mly-900/30 flex items-center justify-center text-sm">💰</span>
            <p className="text-sm text-gray-600 dark:text-gray-300">You start with <strong>100 $MLY</strong> credits</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm">💚</span>
            <p className="text-sm text-gray-600 dark:text-gray-300">Check in daily to earn more</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-sm">🏛️</span>
            <p className="text-sm text-gray-600 dark:text-gray-300">Report issues to improve your block</p>
          </div>
        </div>

        <button onClick={() => setStep('city')} className="btn-teal">
          Let&apos;s Go →
        </button>
      </div>
    );
  }

  // City Step
  if (step === 'city') {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="text-center">
          <p className="text-xs text-teal-500 font-medium">Step 1 of 2</p>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Where are you?</h1>
          <p className="text-sm text-gray-500 mt-1">This helps us show you local content.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={cn(
                'py-3 px-2 rounded-xl text-sm font-medium transition-all border-2',
                selectedCity === city
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                  : 'border-gray-200 dark:border-harbor-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
              )}
            >
              {city}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Neighborhood (optional)</label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="input-field"
            placeholder="e.g., Northside, Riverside, Downtown"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('welcome')} className="btn-primary flex-1">Back</button>
          <button
            onClick={() => setStep('interests')}
            disabled={!selectedCity}
            className="btn-teal flex-1 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // Interests Step
  if (step === 'interests') {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="text-center">
          <p className="text-xs text-teal-500 font-medium">Step 2 of 2</p>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">What matters to you?</h1>
          <p className="text-sm text-gray-500 mt-1">Pick as many as you want. You can change these later.</p>
        </div>

        <div className="space-y-2">
          {interests.map((interest) => (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                selectedInterests.has(interest.id)
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-200 dark:border-harbor-700 hover:border-gray-300'
              )}
            >
              <span className="text-2xl">{interest.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{interest.label}</p>
                <p className="text-xs text-gray-500">{interest.desc}</p>
              </div>
              {selectedInterests.has(interest.id) && (
                <span className="text-teal-500 text-lg">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('city')} className="btn-primary flex-1">Back</button>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="btn-teal flex-1 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
      </div>
    );
  }

  // Done Step
  return (
    <div className="space-y-8 animate-slide-up text-center py-12">
      <div className="text-6xl">🎉</div>
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">You&apos;re all set!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Welcome to MiLyfe, {selectedCity}. Your community is ready for you.
        </p>
      </div>

      <div className="card max-w-xs mx-auto text-left space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">🏙️ City: <strong>{selectedCity}</strong></p>
        {neighborhood && <p className="text-sm text-gray-600 dark:text-gray-300">📍 Neighborhood: <strong>{neighborhood}</strong></p>}
        <p className="text-sm text-gray-600 dark:text-gray-300">💰 Balance: <strong>100 $MLY</strong></p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          ❤️ Interests: <strong>{selectedInterests.size > 0 ? Array.from(selectedInterests).join(', ') : 'All'}</strong>
        </p>
      </div>

      <button onClick={() => router.push('/home')} className="btn-teal">
        Enter MiLyfe →
      </button>
    </div>
  );
}
