'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Housing { id: string; name: string; type: string; address: string; rent_range: string; age_range: string; accepts_vouchers: boolean; has_openings: boolean; amenities: string[]; contact: string; }
interface Course { id: string; title: string; category: string; description: string; duration_mins: number; completed: boolean; mly_reward: number; link: string; }
interface Mentor { id: string; display_name: string; bio: string; aged_out_year: number; specialties: string[]; available: boolean; rating: number; }
interface Milestone { id: string; user_id: string; title: string; completed: boolean; completed_at: string | null; mly_reward: number; icon: string; }

type YouthTab = 'home' | 'housing' | 'life-skills' | 'mentors' | 'emergency';

const MILESTONE_TEMPLATES = [
  { title: 'Got my first apartment', icon: '🏠', mly_reward: 100 },
  { title: 'Landed first job', icon: '💼', mly_reward: 75 },
  { title: 'Opened bank account', icon: '🏦', mly_reward: 25 },
  { title: 'Got my driver\'s license', icon: '🚗', mly_reward: 50 },
  { title: 'Filed taxes for first time', icon: '📋', mly_reward: 30 },
  { title: 'Completed a course', icon: '🎓', mly_reward: 20 },
  { title: 'Built emergency fund', icon: '💰', mly_reward: 50 },
  { title: 'Registered to vote', icon: '🗳️', mly_reward: 15 },
];

const LIFE_SKILL_CATEGORIES = ['Budgeting', 'Cooking', 'Laundry', 'Interviewing', 'Taxes', 'Renting', 'Health', 'Relationships'];

export default function YouthPage() {
  const [tab, setTab] = useState<YouthTab>('home');
  const [housing, setHousing] = useState<Housing[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [mlyBalance, setMlyBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState('All');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: h } = await supabase.from('pop_youth_housing').select('*').order('has_openings', { ascending: false });
    if (h) setHousing(h);
    const { data: c } = await supabase.from('pop_youth_courses').select('*').order('category');
    if (c) setCourses(c);
    const { data: m } = await supabase.from('pop_youth_mentors').select('*').eq('available', true).order('rating', { ascending: false });
    if (m) setMentors(m);
    if (user) {
      const { data: ms } = await supabase.from('pop_youth_milestones').select('*').eq('user_id', user.id);
      if (ms) setMilestones(ms);
      const { data: bal } = await supabase.from('pop_youth_balances').select('balance').eq('user_id', user.id).single();
      if (bal) setMlyBalance(bal.balance);
    }
    setLoading(false);
  }

  async function initMilestones() {
    if (!user) return;
    const supabase = createClient();
    const entries = MILESTONE_TEMPLATES.map(m => ({ user_id: user.id, title: m.title, icon: m.icon, completed: false, completed_at: null, mly_reward: m.mly_reward }));
    await supabase.from('pop_youth_milestones').insert(entries);
    toast.success('Milestones ready! Earn $MLY as you hit each one. 🎯');
    loadData();
  }

  async function completeMilestone(id: string) {
    const supabase = createClient();
    await supabase.from('pop_youth_milestones').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id);
    const ms = milestones.find(m => m.id === id);
    if (ms) toast.success(`${ms.icon} +${ms.mly_reward} $MLY! You did it!`);
    loadData();
  }

  async function requestMentor(mentorId: string) {
    if (!user) { toast.error('Sign in to connect with mentors'); return; }
    const supabase = createClient();
    await supabase.from('pop_youth_mentor_requests').insert({ user_id: user.id, mentor_id: mentorId, status: 'pending' });
    toast.success('Mentor request sent! They\'ll reach out soon. 💪');
  }

  const completedCount = milestones.filter(m => m.completed).length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Youth Forward</h1>
          <p className="text-xs text-gray-500">Your future is yours to build. We&apos;ve got your back.</p>
        </div>
        <div className="card px-3 py-1.5 bg-mly-50 dark:bg-mly-900/20 border border-mly-200 dark:border-mly-800">
          <p className="text-[10px] text-mly-600">Balance</p>
          <p className="text-sm font-bold text-mly-700">${mlyBalance} MLY</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'housing', 'life-skills', 'mentors', 'emergency'] as YouthTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'life-skills' ? 'Skills' : t}</button>
        ))}
      </div>

      {/* Home */}
      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">You&apos;re not alone in this. 💪</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">Aging out of care is hard — but thousands have walked this path before you, and they&apos;re here to help. Every skill you learn, every milestone you hit, earns real $MLY you can use.</p>
          </div>

          {/* Milestone Tracker */}
          {milestones.length > 0 ? (
            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-harbor-800 dark:text-white">🎯 My Milestones</p>
                <span className="text-xs text-mly-600 font-bold">{completedCount}/{milestones.length}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {milestones.slice(0, 8).map(ms => (
                  <div key={ms.id} className={cn('text-center p-2 rounded-lg text-lg', ms.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-harbor-800 opacity-50')}>
                    {ms.icon}
                  </div>
                ))}
              </div>
            </div>
          ) : user ? (
            <div className="card text-center py-4">
              <p className="text-sm text-gray-500">Set up your milestones to start earning $MLY</p>
              <button onClick={initMilestones} className="btn-teal text-xs mt-2">Get Started</button>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🏠', label: 'Find Housing', action: () => setTab('housing') },
              { icon: '📚', label: 'Learn Skills', action: () => setTab('life-skills') },
              { icon: '🤝', label: 'Find a Mentor', action: () => setTab('mentors') },
              { icon: '💼', label: 'Job Help', action: () => { setTab('life-skills'); setSkillFilter('Interviewing'); } },
              { icon: '💰', label: 'Budgeting 101', action: () => { setTab('life-skills'); setSkillFilter('Budgeting'); } },
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

      {/* Housing */}
      {tab === 'housing' && (
        <div className="space-y-3">
          <div className="card bg-gray-50 dark:bg-harbor-900/50">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">🏠 First Apartment Checklist</p>
            <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-gray-500">
              {['ID & Social Security', 'Pay stubs or offer letter', 'References', 'Security deposit', 'Renter\'s insurance', 'Utilities setup'].map(item => (
                <span key={item} className="flex items-center gap-1">☐ {item}</span>
              ))}
            </div>
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            housing.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🏠</p>
                <p className="text-sm text-gray-500">Housing options are being added for your area</p>
              </div>
            ) : housing.map(h => (
              <div key={h.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{h.name}</p>
                    <p className="text-xs text-gray-500">{h.type} • Ages {h.age_range}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', h.has_openings ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                    {h.has_openings ? 'Open' : 'Waitlist'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{h.address}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                  <span>💰 {h.rent_range}/mo</span>
                  {h.accepts_vouchers && <span className="text-green-600">✓ Vouchers OK</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {h.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{a}</span>
                  ))}
                </div>
                <a href={`tel:${h.contact}`} className="btn-teal text-xs inline-block text-center w-full">Contact</a>
              </div>
            ))
          }
        </div>
      )}

      {/* Life Skills */}
      {tab === 'life-skills' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSkillFilter('All')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', skillFilter === 'All' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {LIFE_SKILL_CATEGORIES.map(c => (
              <button key={c} onClick={() => setSkillFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', skillFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            courses.filter(c => skillFilter === 'All' || c.category === skillFilter).length === 0 ? (
              <div className="card text-center py-8"><p className="text-sm text-gray-500">More courses coming soon!</p></div>
            ) : courses.filter(c => skillFilter === 'All' || c.category === skillFilter).map(course => (
              <div key={course.id} className="card flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm', course.completed ? 'bg-green-100 text-green-700' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700')}>
                  {course.completed ? '✓' : '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', course.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{course.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{course.category}</span>
                    <span>{course.duration_mins} min</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-mly-600 font-bold">+{course.mly_reward}</span>
                  <Link href={course.link || '/learn'} className="block btn-teal text-[10px] mt-1">{course.completed ? 'Review' : 'Start'}</Link>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Mentors */}
      {tab === 'mentors' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-300">Your mentors aged out of foster care too. They&apos;ve been where you are and made it through. They get it.</p>
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-24" />) :
            mentors.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🤝</p>
                <p className="text-sm text-gray-500">Mentors are being matched for you</p>
              </div>
            ) : mentors.map(mentor => (
              <div key={mentor.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm">{mentor.display_name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{mentor.display_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{mentor.bio}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>⭐ {mentor.rating.toFixed(1)}</span>
                    <span>Aged out {mentor.aged_out_year}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mentor.specialties.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => requestMentor(mentor.id)} className="btn-teal text-xs">Connect</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Emergency */}
      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 You&apos;re Not Alone</h3>
            <p className="text-xs text-red-600 mt-1">If you&apos;re in crisis, these resources are free, confidential, and available right now.</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => toast.success('Emergency fund application started')} className="card bg-teal-500 text-white text-center py-3 hover:bg-teal-600 transition-colors">
              <p className="text-sm font-bold">💰 Emergency Funds</p>
              <p className="text-xs mt-0.5">Apply for immediate financial help</p>
            </button>
            <button onClick={() => toast.success('Crisis housing search started')} className="card bg-orange-500 text-white text-center py-3 hover:bg-orange-600 transition-colors">
              <p className="text-sm font-bold">🏠 Crisis Housing</p>
              <p className="text-xs mt-0.5">I need a place to stay tonight</p>
            </button>
          </div>
          {[
            { label: '24/7 Youth Support Line', number: '1-800-786-2929', desc: 'National Runaway Safeline' },
            { label: 'Crisis Text Line', number: 'Text HOME to 741741', desc: 'Free 24/7 text-based support' },
            { label: 'Foster Care Ombudsman', number: '1-877-846-1602', desc: 'Know your rights in care' },
            { label: 'Suicide & Crisis Lifeline', number: '988', desc: '24/7 confidential support' },
            { label: 'MiLyfe Youth Emergency', number: 'In-app', desc: 'Connect with community NOW' },
          ].map(item => (
            <div key={item.label} className="card flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <a href={`tel:${item.number}`} className="text-xs font-bold text-teal-600">{item.number}</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
