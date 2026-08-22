'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

const INTERESTS = [
  { id: 'civic', label: '🏛️ Civic Engagement', desc: 'Voting, governance, city issues' },
  { id: 'health', label: '❤️ Health & Wellness', desc: 'Daily check-ins, mental health' },
  { id: 'finance', label: '💰 $MLY Economy', desc: 'Earning, spending, local businesses' },
  { id: 'social', label: '💬 Community', desc: 'Forum, social, connecting' },
  { id: 'education', label: '📚 Learning', desc: 'Courses, wiki, academia' },
  { id: 'safety', label: '🛡️ Safety & Rights', desc: 'Know your rights, guild patrol' },
  { id: 'creative', label: '🎬 Media & Content', desc: 'Video, music, podcasts' },
  { id: 'tech', label: '🛠️ Development', desc: 'Building on MiLyfe, bounties' },
];

const NEIGHBORHOODS = [
  'Downtown', 'Springfield', 'Riverside/Avondale', 'San Marco', 'Southside',
  'Arlington', 'Northside', 'Westside', 'Beaches', 'Mandarin',
  'Murray Hill', 'Ortega', 'Moncrief', 'New Town', 'Grand Park',
  'Brentwood', 'Other',
];

const AVATAR_STYLES = ['🧑', '👩', '👨', '🧔', '👩‍🦱', '👨‍🦱', '🧑‍🦰', '👩‍🦳', '🧑‍🦲'];

type Step = 'interests' | 'neighborhood' | 'avatar' | 'actions' | 'done';

export default function OnboardingSetupPage() {
  const [step, setStep] = useState<Step>('interests');
  const [interests, setInterests] = useState<string[]>([]);
  const [neighborhood, setNeighborhood] = useState('');
  const [avatar, setAvatar] = useState('🧑');
  const [saving, setSaving] = useState(false);
  const { user } = useAppStore();
  const router = useRouter();

  function toggleInterest(id: string) {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  async function finishSetup() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    // Save neighborhood
    await supabase.from('profiles').update({ neighborhood }).eq('id', user.id);

    // Create digital twin with selected avatar
    await supabase.from('digital_twins').upsert({
      user_id: user.id,
      avatar_config: { emoji: avatar, interests },
      personality: 'friendly',
      automation: { auto_vote_delegated: false, auto_checkin: false, auto_respond_messages: false },
      active: true,
    }, { onConflict: 'user_id' });

    // Create social profile
    await supabase.from('social_profiles').upsert({
      user_id: user.id,
      bio: '',
    }, { onConflict: 'user_id' });

    setSaving(false);
    setStep('done');
  }

  if (step === 'done') {
    return (
      <div className="text-center py-12 animate-slide-up space-y-4">
        <p className="text-5xl">🎉</p>
        <h2 className="text-xl font-bold text-harbor-800 dark:text-white">You&apos;re All Set!</h2>
        <p className="text-sm text-gray-500">Your MiLyfe is ready. Here&apos;s what to do first:</p>
        <div className="space-y-2 max-w-xs mx-auto text-left">
          <button onClick={() => router.push('/health')} className="w-full card flex items-center gap-3 !py-3 hover:shadow-md">
            <span className="text-xl">❤️</span><span className="text-sm">Do your first health check-in (+$5 MLY)</span>
          </button>
          <button onClick={() => router.push('/city')} className="w-full card flex items-center gap-3 !py-3 hover:shadow-md">
            <span className="text-xl">🚨</span><span className="text-sm">Report a community issue (+$3 MLY)</span>
          </button>
          <button onClick={() => router.push('/learn')} className="w-full card flex items-center gap-3 !py-3 hover:shadow-md">
            <span className="text-xl">📚</span><span className="text-sm">Start a free course (+$10 MLY)</span>
          </button>
        </div>
        <button onClick={() => router.push('/home')} className="btn-teal mt-4">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-md mx-auto">
      {/* Progress */}
      <div className="flex gap-1">
        {(['interests', 'neighborhood', 'avatar', 'actions'] as Step[]).map((s, i) => (
          <div key={s} className={cn('h-1.5 flex-1 rounded-full', step === s || ['interests','neighborhood','avatar','actions'].indexOf(step) > i ? 'bg-teal-500' : 'bg-gray-200 dark:bg-harbor-800')} />
        ))}
      </div>

      {/* Step 1: Interests */}
      {step === 'interests' && (
        <div className="space-y-4">
          <div><h2 className="text-lg font-bold text-harbor-800 dark:text-white">What interests you?</h2><p className="text-xs text-gray-500">Pick at least 2. This helps personalize your experience.</p></div>
          <div className="grid grid-cols-2 gap-2">
            {INTERESTS.map(interest => (
              <button key={interest.id} onClick={() => toggleInterest(interest.id)} className={cn('p-3 rounded-xl border text-left transition-all', interests.includes(interest.id) ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700')}>
                <p className="text-sm font-medium">{interest.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{interest.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('neighborhood')} disabled={interests.length < 2} className="btn-teal w-full disabled:opacity-50">Next →</button>
        </div>
      )}

      {/* Step 2: Neighborhood */}
      {step === 'neighborhood' && (
        <div className="space-y-4">
          <div><h2 className="text-lg font-bold text-harbor-800 dark:text-white">Where in Jacksonville?</h2><p className="text-xs text-gray-500">Connects you to local issues, events, and neighbors.</p></div>
          <div className="grid grid-cols-3 gap-2">
            {NEIGHBORHOODS.map(n => (
              <button key={n} onClick={() => setNeighborhood(n)} className={cn('py-2 px-2 rounded-lg border text-xs font-medium transition-all text-center', neighborhood === n ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700' : 'border-gray-200 dark:border-harbor-700 text-gray-600')}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('interests')} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => setStep('avatar')} disabled={!neighborhood} className="btn-teal flex-1 disabled:opacity-50">Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Avatar */}
      {step === 'avatar' && (
        <div className="space-y-4">
          <div><h2 className="text-lg font-bold text-harbor-800 dark:text-white">Pick your avatar</h2><p className="text-xs text-gray-500">This represents you across the platform. You can customize more later in MiTwin.</p></div>
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-harbor-600 flex items-center justify-center text-4xl shadow-xl">{avatar}</div>
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            {AVATAR_STYLES.map(a => (
              <button key={a} onClick={() => setAvatar(a)} className={cn('w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all', avatar === a ? 'ring-4 ring-teal-500 scale-110' : 'bg-gray-100 dark:bg-harbor-800 hover:scale-105')}>{a}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('neighborhood')} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => setStep('actions')} className="btn-teal flex-1">Next →</button>
          </div>
        </div>
      )}

      {/* Step 4: First actions */}
      {step === 'actions' && (
        <div className="space-y-4">
          <div><h2 className="text-lg font-bold text-harbor-800 dark:text-white">Ready to go!</h2><p className="text-xs text-gray-500">Your MiLyfe setup is complete. You&apos;ll start earning $MLY immediately.</p></div>
          <div className="card bg-mly-50 dark:bg-mly-900/10 border-mly-200">
            <p className="text-sm font-bold text-mly-700 dark:text-mly-400">💰 Starting Balance: $100 MLY</p>
            <p className="text-xs text-mly-600 dark:text-mly-300 mt-1">Plus $10/day UBI for staying active. Check in daily, report issues, and participate to earn more.</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Your setup:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>📍 {neighborhood}</p>
              <p>💡 {interests.length} interests selected</p>
              <p>{avatar} Avatar chosen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('avatar')} className="btn-secondary flex-1">← Back</button>
            <button onClick={finishSetup} disabled={saving} className="btn-teal flex-1">{saving ? 'Setting up...' : '🚀 Launch My MiLyfe'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
