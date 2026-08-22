'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface CheckInEntry {
  id: string; user_id: string; date: string; sober: boolean;
  mood: number; triggers: string[]; notes: string;
}
interface Meeting {
  id: string; name: string; type: string; day: string; time: string;
  location: string; address: string; format: string; virtual_link: string | null;
}
interface Sponsor {
  id: string; display_name: string; avatar_url: string | null;
  bio: string; years_sober: number; specialties: string[];
  available: boolean; program: string;
}
interface Resource {
  id: string; title: string; category: string; description: string;
  address: string; phone: string; accepts_mly: boolean;
}
interface Milestone {
  id: string; user_id: string; days: number; title: string;
  reached: boolean; reached_at: string | null; mly_reward: number;
}

type Tab = 'checkin' | 'meetings' | 'sponsor' | 'resources' | 'milestones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'checkin', label: 'Check-in' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'resources', label: 'Resources' },
  { key: 'milestones', label: 'Milestones' },
];

const MOODS = [
  { value: 1, label: '😟', text: 'Struggling' },
  { value: 2, label: '😐', text: 'Okay' },
  { value: 3, label: '🙂', text: 'Good' },
  { value: 4, label: '😊', text: 'Great' },
  { value: 5, label: '🌟', text: 'Thriving' },
];

const COMMON_TRIGGERS = ['Stress', 'Loneliness', 'Boredom', 'Social Pressure', 'Pain', 'Anger', 'Celebration', 'Financial'];

const MILESTONE_DAYS = [
  { days: 1, title: 'Day 1 — You showed up', mly_reward: 5 },
  { days: 7, title: '1 Week Strong', mly_reward: 10 },
  { days: 14, title: '2 Weeks', mly_reward: 15 },
  { days: 30, title: '30 Days — One month!', mly_reward: 30 },
  { days: 60, title: '60 Days', mly_reward: 40 },
  { days: 90, title: '90 Days — Quarter year!', mly_reward: 75 },
  { days: 180, title: '6 Months — Half year!', mly_reward: 100 },
  { days: 365, title: '1 Year — Incredible!', mly_reward: 200 },
  { days: 730, title: '2 Years', mly_reward: 300 },
  { days: 1825, title: '5 Years — Legend', mly_reward: 500 },
];

/* ─── Component ─── */
export default function RecoveryPage() {
  const [tab, setTab] = useState<Tab>('checkin');
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayMood, setTodayMood] = useState(3);
  const [todayTriggers, setTodayTriggers] = useState<string[]>([]);
  const [todayNotes, setTodayNotes] = useState('');
  const [meetingFilter, setMeetingFilter] = useState('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [meetResult, sponsorResult, resResult] = await Promise.all([
      supabase.from('recovery_meetings').select('*').order('day'),
      supabase.from('recovery_sponsors').select('*').eq('available', true),
      supabase.from('recovery_resources').select('*'),
    ]);
    if (meetResult.data) setMeetings(meetResult.data);
    if (sponsorResult.data) setSponsors(sponsorResult.data);
    if (resResult.data) setResources(resResult.data);

    if (user) {
      const [checkResult, msResult] = await Promise.all([
        supabase.from('recovery_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
        supabase.from('recovery_milestones').select('*').eq('user_id', user.id),
      ]);
      if (checkResult.data) setCheckIns(checkResult.data);
      if (msResult.data) setMilestones(msResult.data);
    }
    setLoading(false);
  }

  async function submitCheckIn() {
    if (!user) { toast.error('Sign in to check in'); return; }
    const { error } = await supabase.from('recovery_checkins').insert({
      user_id: user.id, date: new Date().toISOString().split('T')[0], sober: true,
      mood: todayMood, triggers: todayTriggers, notes: todayNotes,
    });
    if (error) { toast.error('Check-in failed'); return; }
    toast.success(`Day ${streakDays + 1} — You are doing this!`);
    setTodayNotes('');
    setTodayTriggers([]);
    loadData();
  }

  async function reportRelapse() {
    if (!user) return;
    await supabase.from('recovery_checkins').insert({
      user_id: user.id, date: new Date().toISOString().split('T')[0], sober: false,
      mood: todayMood, triggers: todayTriggers, notes: todayNotes,
    });
    toast('No judgment. Your support network has been notified. You can start again right now.', { duration: 6000 });
    loadData();
  }

  async function connectSponsor(sponsorId: string) {
    if (!user) { toast.error('Sign in to connect'); return; }
    const { error } = await supabase.from('recovery_sponsor_connections').insert({ user_id: user.id, sponsor_id: sponsorId });
    if (error) { toast.error('Connection failed'); return; }
    toast.success('Sponsor request sent! They will reach out soon.');
  }

  async function initMilestones() {
    if (!user) return;
    const entries = MILESTONE_DAYS.map(m => ({ user_id: user.id, days: m.days, title: m.title, reached: false, reached_at: null, mly_reward: m.mly_reward }));
    await supabase.from('recovery_milestones').insert(entries);
    toast.success('Milestones activated! Earn $MLY at each one.');
    loadData();
  }

  const streakDays = checkIns.filter(c => c.sober).length;
  const todayCheckedIn = checkIns.some(c => c.date === new Date().toISOString().split('T')[0]);
  const reachedMilestones = milestones.filter(m => m.reached).length;
  const totalMLY = milestones.filter(m => m.reached).reduce((s, m) => s + m.mly_reward, 0);

  const filteredMeetings = meetings.filter(m => meetingFilter === 'all' || m.type.toLowerCase() === meetingFilter);

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiRecovery</h1>
        <p className="text-xs text-gray-500 mt-0.5">One day at a time. Your community walks with you.</p>
      </div>

      {/* Streak Badge */}
      {streakDays > 0 && (
        <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 text-center">
          <p className="text-3xl font-bold text-teal-600">{streakDays}</p>
          <p className="text-xs text-teal-700 dark:text-teal-300">days strong</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Check-in ─── */}
      {tab === 'checkin' && (
        <div className="space-y-3">
          {todayCheckedIn ? (
            <div className="card text-center py-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <p className="text-2xl mb-1">✓</p>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">Checked in today</p>
              <p className="text-xs text-green-600 mt-1">Come back tomorrow. You are doing amazing.</p>
            </div>
          ) : (
            <div className="card space-y-4">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">Daily Check-in</p>
              {/* Mood */}
              <div>
                <p className="text-xs text-gray-500 mb-2">How are you feeling?</p>
                <div className="flex gap-2 justify-between">
                  {MOODS.map(mood => (
                    <button key={mood.value} onClick={() => setTodayMood(mood.value)} className={cn('flex-1 py-2 rounded-lg text-center transition-all', todayMood === mood.value ? 'bg-teal-100 dark:bg-teal-900/30 ring-2 ring-teal-500' : 'bg-gray-50 dark:bg-harbor-800')}>
                      <p className="text-xl">{mood.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{mood.text}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Triggers */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Any triggers today?</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TRIGGERS.map(trigger => (
                    <button key={trigger} onClick={() => setTodayTriggers(prev => prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger])} className={cn('px-3 py-1 rounded-full text-xs', todayTriggers.includes(trigger) ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{trigger}</button>
                  ))}
                </div>
              </div>
              {/* Notes */}
              <textarea value={todayNotes} onChange={e => setTodayNotes(e.target.value)} placeholder="Anything else on your mind (optional)..." className="input-field w-full" rows={2} />
              {/* Submit */}
              <div className="flex gap-2">
                <button onClick={submitCheckIn} className="btn-teal flex-1 py-3">I&apos;m Sober Today ✓</button>
              </div>
              <button onClick={reportRelapse} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2">
                I need to reset my streak (no judgment)
              </button>
            </div>
          )}
          {/* 24/7 Peer Support */}
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">💬 24/7 Peer Support available — text RECOVERY in the MiLyfe chat anytime.</p>
          </div>
        </div>
      )}

      {/* ─── Meetings ─── */}
      {tab === 'meetings' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'aa', 'na', 'smart', 'refuge'].map(type => (
              <button key={type} onClick={() => setMeetingFilter(type)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap uppercase', meetingFilter === type ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{type === 'all' ? 'All' : type}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredMeetings.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No meetings found for this filter</p></div>
          ) : filteredMeetings.map(meeting => (
            <div key={meeting.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{meeting.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded uppercase">{meeting.type}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{meeting.format}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>📅 {meeting.day} at {meeting.time}</span>
                <span>📍 {meeting.location}</span>
              </div>
              {meeting.virtual_link && <a href={meeting.virtual_link} className="text-xs text-teal-600 hover:underline">Join Virtual →</a>}
            </div>
          ))}
          <Link href="/map" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">🗺️</span>
            <div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">View on MiNav Map</p>
              <p className="text-xs text-gray-400">See all meetings near you</p>
            </div>
          </Link>
        </div>
      )}

      {/* ─── Sponsor ─── */}
      {tab === 'sponsor' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Sponsors are community members in long-term recovery who volunteer to walk this path with you. Not therapists — real people who understand.</p>
          </div>
          {loading ? <Skeleton /> : sponsors.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm text-gray-500">Sponsors are being matched</p>
            </div>
          ) : sponsors.map(sponsor => (
            <div key={sponsor.id} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700">
                {sponsor.display_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{sponsor.display_name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{sponsor.bio}</p>
                <p className="text-[10px] text-gray-400 mt-1">{sponsor.years_sober}+ years in recovery • {sponsor.program}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sponsor.specialties?.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => connectSponsor(sponsor.id)} className="btn-teal text-xs">Connect</button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Resources ─── */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '💊', label: 'Naloxone Locations', desc: 'Free Narcan near you' },
              { icon: '🏥', label: 'MAT Providers', desc: 'Medication-assisted treatment' },
              { icon: '🧠', label: 'Counseling', desc: 'Covered by health pool' },
              { icon: '🛡️', label: 'Harm Reduction', desc: 'Safe use supplies & education' },
            ].map(item => (
              <div key={item.label} className="card text-center p-3">
                <p className="text-xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          {loading ? <Skeleton /> : resources.map(res => (
            <div key={res.id} className="card space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                {res.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{res.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                {res.address && <span>📍 {res.address}</span>}
                {res.phone && <span>📞 {res.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Milestones ─── */}
      {tab === 'milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Sobriety Milestones</p>
              <p className="text-xs text-gray-500 mt-1">Celebrate every milestone — earn $MLY at each one</p>
              {user && <button onClick={initMilestones} className="btn-teal text-xs mt-4">Activate Milestones</button>}
            </div>
          ) : (
            <>
              <div className="card text-center">
                <p className="text-xs text-gray-500">{reachedMilestones}/{milestones.length} milestones reached • ${totalMLY} $MLY earned</p>
              </div>
              {milestones.map(ms => (
                <div key={ms.id} className="card flex items-center gap-3">
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', ms.reached ? 'bg-green-100 text-green-700' : streakDays >= ms.days ? 'bg-teal-100 text-teal-700 animate-pulse' : 'bg-gray-100 dark:bg-harbor-800 text-gray-400')}>
                    {ms.reached ? '✓' : ms.days}
                  </span>
                  <div className="flex-1">
                    <p className={cn('text-sm', ms.reached ? 'text-green-600 font-medium' : 'text-harbor-800 dark:text-white')}>{ms.title}</p>
                    {ms.reached_at && <p className="text-[10px] text-gray-400">{new Date(ms.reached_at).toLocaleDateString()}</p>}
                  </div>
                  <span className="text-xs text-teal-600 font-bold">+{ms.mly_reward}</span>
                </div>
              ))}
            </>
          )}
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Earn $MLY at every sobriety milestone. Relapse does not take away earned tokens. Every day is a new chance.</p>
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Crisis Support</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-red-600 dark:text-red-300">
          <span>SAMHSA: <strong>1-800-662-4357</strong></span>
          <span>Crisis: <strong>988</strong></span>
          <span>Text: <strong>HOME to 741741</strong></span>
        </div>
      </div>
    </div>
  );
}
