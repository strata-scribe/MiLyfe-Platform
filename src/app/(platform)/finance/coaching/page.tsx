'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Coach {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  sessions_completed: number;
  rating: number;
  rate: number;
  availability: string[];
  accepting_clients: boolean;
}

interface Session {
  id: string;
  coach_id: string;
  client_id: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduled_for: string;
  notes: string | null;
  rating: number | null;
  created_at: string;
  coach_name?: string;
}

type CoachTab = 'browse' | 'sessions' | 'become';

const SPECIALTIES = ['Budgeting', 'Debt Freedom', 'Savings', 'Investing Basics', 'Credit Building', 'Tax Prep', 'Business Finance', 'Emergency Planning', 'Youth Finance', 'Retirement'];

export default function FinancialCoachingPage() {
  const [tab, setTab] = useState<CoachTab>('browse');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState('all');

  // Become coach form
  const [bio, setBio] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [rate, setRate] = useState('');
  const [registering, setRegistering] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [specialty]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('finance_coaches').select('*').eq('accepting_clients', true).order('rating', { ascending: false });
    if (specialty !== 'all') query = query.contains('specialties', [specialty]);
    const { data: c } = await query.limit(20);
    if (c) setCoaches(c);

    if (user) {
      const { data: s } = await supabase.from('finance_coaching_sessions').select('*').eq('client_id', user.id).order('scheduled_for', { ascending: false }).limit(10);
      if (s) setSessions(s);
    }
    setLoading(false);
  }

  async function bookSession(coachId: string) {
    if (!user) return;
    const supabase = createClient();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const coach = coaches.find(c => c.id === coachId);
    await supabase.from('finance_coaching_sessions').insert({
      coach_id: coachId, client_id: user.id, status: 'scheduled',
      scheduled_for: tomorrow.toISOString(), coach_name: coach?.display_name,
    });
    toast.success('Session booked! Check your messages for confirmation.');
    loadData();
  }

  function toggleSpec(spec: string) {
    setSelectedSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  }

  async function becomeCoach() {
    if (!user || !bio.trim() || selectedSpecs.length === 0) return;
    setRegistering(true);
    const supabase = createClient();
    await supabase.from('finance_coaches').insert({
      user_id: user.id, display_name: user.display_name, bio: bio.trim(),
      specialties: selectedSpecs, experience_years: parseInt(experience) || 0,
      sessions_completed: 0, rating: 0, rate: parseInt(rate) || 0,
      availability: ['weekdays'], accepting_clients: true,
    });
    setBio(''); setSelectedSpecs([]); setRegistering(false);
    toast.success('You\'re now a community financial coach!');
    setTab('browse'); loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Financial Coaching</h1>
        <p className="text-xs text-gray-500">Free peer coaching from community members who&apos;ve been there</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['browse', 'sessions', 'become'] as CoachTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'become' ? 'Become Coach' : t === 'sessions' ? 'My Sessions' : t}</button>
        ))}
      </div>

      {/* Browse Coaches */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSpecialty('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', specialty === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {SPECIALTIES.slice(0, 6).map(s => (
              <button key={s} onClick={() => setSpecialty(s)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', specialty === s ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{s}</button>
            ))}
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            coaches.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🎓</p>
                <p className="text-sm text-gray-500">No coaches available for this specialty</p>
                <button onClick={() => setTab('become')} className="text-xs text-teal-600 mt-2">Become one →</button>
              </div>
            ) : coaches.map(coach => (
              <div key={coach.id} className="card space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <span className="text-sm">{coach.display_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{coach.display_name}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{coach.bio}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span>⭐ {coach.rating > 0 ? coach.rating.toFixed(1) : 'New'}</span>
                      <span>·</span>
                      <span>{coach.sessions_completed} sessions</span>
                      <span>·</span>
                      <span>{coach.experience_years}yr exp</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-mly-600">{coach.rate > 0 ? `$${coach.rate} MLY` : 'Free'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {coach.specialties.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                  ))}
                </div>
                {user && coach.user_id !== user.id && (
                  <button onClick={() => bookSession(coach.id)} className="btn-teal text-xs w-full">Book Free Session</button>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* My Sessions */}
      {tab === 'sessions' && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">{user ? 'No sessions yet — book one!' : 'Sign in to see sessions'}</p>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-sm">🎓</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{s.coach_name || 'Coach'}</p>
                <p className="text-xs text-gray-500">{new Date(s.scheduled_for).toLocaleDateString()} at {new Date(s.scheduled_for).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
              <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize', s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{s.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Become Coach */}
      {tab === 'become' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Become a Financial Coach</h3>
          <p className="text-xs text-gray-500">Share your financial knowledge with the community. Earn $MLY for sessions.</p>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about your financial experience..." className="input-field resize-none" rows={3} />
          <div>
            <p className="text-xs text-gray-500 mb-2">Your specialties:</p>
            <div className="flex flex-wrap gap-1">
              {SPECIALTIES.map(s => (
                <button key={s} onClick={() => toggleSpec(s)} className={cn('text-[10px] px-2 py-1 rounded-full border transition-colors', selectedSpecs.includes(s) ? 'bg-teal-100 border-teal-300 text-teal-700' : 'border-gray-200 dark:border-harbor-700 text-gray-500')}>{s}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="Years experience" className="input-field" type="number" />
            <input value={rate} onChange={e => setRate(e.target.value)} placeholder="Rate ($MLY, 0=free)" className="input-field" type="number" />
          </div>
          <button onClick={becomeCoach} disabled={!bio.trim() || selectedSpecs.length === 0 || registering} className="btn-teal w-full disabled:opacity-50">
            {registering ? 'Registering...' : 'Register as Coach'}
          </button>
        </div>
      )}
    </div>
  );
}
