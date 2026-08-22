'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Meeting { id: string; name: string; type: 'AA' | 'NA' | 'SMART Recovery'; format: 'in-person' | 'virtual'; access: 'open' | 'closed'; location: string; day: string; time: string; }
interface Sponsor { id: string; display_name: string; recovery_years: number; program: string; bio: string; available: boolean; }
interface CheckIn { id: string; user_id: string; date: string; cravings: number; mood: string; triggers: string; grateful_for: string; }
interface UserRecovery { id: string; user_id: string; sobriety_date: string; current_streak: number; longest_streak: number; badges: string[]; }

type RecoveryTab = 'home' | 'meetings' | 'sponsors' | 'progress' | 'emergency';

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😔 Struggling', '😰 Crisis'];
const BADGES = [
  { days: 1, label: '1 Day', icon: '🌱' },
  { days: 7, label: '1 Week', icon: '🌿' },
  { days: 30, label: '1 Month', icon: '🌳' },
  { days: 90, label: '90 Days', icon: '⭐' },
  { days: 180, label: '6 Months', icon: '🌟' },
  { days: 365, label: '1 Year', icon: '🏆' },
  { days: 730, label: '2 Years', icon: '💎' },
];

export default function RecoveryPage() {
  const [tab, setTab] = useState<RecoveryTab>('home');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [recovery, setRecovery] = useState<UserRecovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingFilter, setMeetingFilter] = useState<string>('All');
  const [checkInForm, setCheckInForm] = useState({ cravings: 5, mood: '', triggers: '', grateful_for: '' });

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: mt } = await supabase.from('pop_recovery_meetings').select('*').order('day');
    if (mt) setMeetings(mt);
    const { data: sp } = await supabase.from('pop_recovery_sponsors').select('*').eq('available', true);
    if (sp) setSponsors(sp);
    if (user) {
      const { data: rc } = await supabase.from('pop_recovery_users').select('*').eq('user_id', user.id).single();
      if (rc) setRecovery(rc);
      const { data: ci } = await supabase.from('pop_recovery_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30);
      if (ci) setCheckIns(ci);
    }
    setLoading(false);
  }

  async function submitCheckIn() {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from('pop_recovery_checkins').insert({ user_id: user.id, date: new Date().toISOString().split('T')[0], ...checkInForm });
    if (error) { toast.error('Could not save check-in'); return; }
    toast.success('Check-in saved. You\u2019re doing the work. 💪');
    setCheckInForm({ cravings: 5, mood: '', triggers: '', grateful_for: '' });
    loadData();
  }

  async function connectSponsor(sponsorId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('pop_recovery_connections').insert({ user_id: user.id, sponsor_id: sponsorId, status: 'pending' });
    toast.success('Connection request sent anonymously');
  }

  function getSobrietyDisplay() {
    if (!recovery?.sobriety_date) return null;
    const start = new Date(recovery.sobriety_date);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainDays = days - (years * 365) - (months * 30);
    return { days, years, months, remainDays };
  }

  const sobriety = getSobrietyDisplay();

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Recovery Support</h1>
        <p className="text-xs text-gray-500">One day at a time. You are not alone.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'meetings', 'sponsors', 'progress', 'emergency'] as RecoveryTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Recovery is courage, not weakness.</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">This is a judgment-free space. Whether it&apos;s day one or year ten, every step forward matters. Your journey is valid.</p>
          </div>
          {sobriety && (
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-2">Your Sobriety</p>
              <div className="flex justify-center gap-4">
                {sobriety.years > 0 && <div><p className="text-2xl font-bold text-teal-600">{sobriety.years}</p><p className="text-[10px] text-gray-400">years</p></div>}
                {sobriety.months > 0 && <div><p className="text-2xl font-bold text-teal-600">{sobriety.months}</p><p className="text-[10px] text-gray-400">months</p></div>}
                <div><p className="text-2xl font-bold text-teal-600">{sobriety.remainDays}</p><p className="text-[10px] text-gray-400">days</p></div>
              </div>
              <p className="text-xs text-mly-600 font-medium mt-2">{sobriety.days} total days 🎉</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📅', label: 'Find a Meeting', action: () => setTab('meetings') },
              { icon: '🤝', label: 'Find a Sponsor', action: () => setTab('sponsors') },
              { icon: '📝', label: 'Daily Check-In', action: () => setTab('progress') },
              { icon: '🆘', label: 'I Need Help Now', action: () => setTab('emergency') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'meetings' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', 'AA', 'NA', 'SMART Recovery'].map(f => (
              <button key={f} onClick={() => setMeetingFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', meetingFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            meetings.filter(m => meetingFilter === 'All' || m.type === meetingFilter).map(meeting => (
              <div key={meeting.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{meeting.name}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', meeting.format === 'virtual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>{meeting.format}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', meeting.access === 'open' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600')}>{meeting.access}</span>
                </div>
                <p className="text-xs text-gray-500">{meeting.type}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📍 {meeting.location}</span>
                  <span>🕐 {meeting.day} {meeting.time}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'sponsors' && (
        <div className="space-y-3">
          <div className="card bg-harbor-50 dark:bg-harbor-900/50 border border-harbor-200 dark:border-harbor-700">
            <p className="text-xs text-harbor-600 dark:text-harbor-300">Sponsors are peers with 2+ years of recovery who volunteer their time. All connections are anonymous until you choose to reveal yourself.</p>
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-24" />) :
            sponsors.map(sponsor => (
              <div key={sponsor.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm">{sponsor.display_name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{sponsor.display_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{sponsor.bio}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>{sponsor.recovery_years} years in recovery</span>
                    <span>• {sponsor.program}</span>
                  </div>
                </div>
                <button onClick={() => connectSponsor(sponsor.id)} className="btn-teal text-xs">Connect</button>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-3">
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white mb-3">Daily Check-In</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Cravings today (1-10)</label>
                <input type="range" min="1" max="10" value={checkInForm.cravings} onChange={e => setCheckInForm(f => ({ ...f, cravings: Number(e.target.value) }))} className="w-full accent-teal-500" />
                <div className="flex justify-between text-[10px] text-gray-400"><span>Minimal</span><span className="font-bold text-harbor-700 dark:text-white">{checkInForm.cravings}</span><span>Intense</span></div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">How are you feeling?</label>
                <div className="flex gap-1 flex-wrap">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setCheckInForm(f => ({ ...f, mood: m }))} className={cn('px-2 py-1 rounded-full text-xs', checkInForm.mood === m ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Triggers today</label>
                <input value={checkInForm.triggers} onChange={e => setCheckInForm(f => ({ ...f, triggers: e.target.value }))} className="input-field" placeholder="What challenged you today?" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Grateful for</label>
                <input value={checkInForm.grateful_for} onChange={e => setCheckInForm(f => ({ ...f, grateful_for: e.target.value }))} className="input-field" placeholder="One thing you're grateful for..." />
              </div>
              <button onClick={submitCheckIn} className="btn-teal w-full text-sm">Save Check-In</button>
            </div>
          </div>
          {recovery && (
            <div className="card">
              <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Milestone Badges</p>
              <div className="grid grid-cols-4 gap-2">
                {BADGES.map(b => {
                  const earned = (sobriety?.days || 0) >= b.days;
                  return (
                    <div key={b.days} className={cn('text-center p-2 rounded-lg', earned ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-gray-50 dark:bg-harbor-800 opacity-40')}>
                      <p className="text-xl">{b.icon}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{b.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {checkIns.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Recent Check-Ins</p>
              {checkIns.slice(0, 5).map(ci => (
                <div key={ci.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                  <span className="text-xs text-gray-400 w-16">{ci.date}</span>
                  <span className="text-xs">{ci.mood}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">Cravings: {ci.cravings}/10</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 You Are Not Alone</h3>
            <p className="text-xs text-red-600 mt-1">A relapse is not a failure — it&apos;s a moment. Reach out now.</p>
          </div>
          {[
            { label: 'SAMHSA National Helpline', number: '1-800-662-4357', desc: 'Free, confidential, 24/7 treatment referral' },
            { label: 'Crisis Text Line', number: 'Text HOME to 741741', desc: 'Free crisis counseling via text' },
            { label: 'Suicide & Crisis Lifeline', number: '988', desc: 'Immediate emotional support' },
            { label: 'Peer Support (MiLyfe)', number: 'In-app', desc: 'Connect with a recovery peer now' },
          ].map(item => (
            <div key={item.label} className="card flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <a href={`tel:${item.number.replace(/\D/g, '')}`} className="text-xs font-bold text-teal-600">{item.number}</a>
            </div>
          ))}
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">My Relapse Prevention Plan</p>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2"><span className="text-teal-500">1.</span> Recognize my triggers</li>
              <li className="flex items-start gap-2"><span className="text-teal-500">2.</span> Call my sponsor or support person</li>
              <li className="flex items-start gap-2"><span className="text-teal-500">3.</span> Go to a safe place</li>
              <li className="flex items-start gap-2"><span className="text-teal-500">4.</span> Attend a meeting (virtual options available 24/7)</li>
              <li className="flex items-start gap-2"><span className="text-teal-500">5.</span> Remember: progress isn&apos;t erased by a setback</li>
            </ul>
          </div>
          <div className="card bg-teal-50 dark:bg-teal-900/10">
            <p className="text-xs text-teal-700 dark:text-teal-300 text-center font-medium">Safe Places Near You</p>
            <div className="mt-2 space-y-1">
              {['Community Recovery Center', 'MiLyfe Partner Coffee Shop', '24-Hour Meeting Hall'].map(p => (
                <div key={p} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span>📍</span><span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
