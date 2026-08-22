'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Resource { id: string; title: string; category: string; description: string; location: string; contact: string; accepts_mly: boolean; verified: boolean; }
interface Mentor { id: string; user_id: string; display_name: string; bio: string; years_since_release: number; specialties: string[]; available: boolean; }
interface Milestone { id: string; user_id: string; title: string; category: string; completed: boolean; completed_at: string | null; mly_reward: number; }

type ReentryTab = 'home' | 'resources' | 'mentors' | 'milestones' | 'emergency';

const RESOURCE_CATEGORIES = ['Housing', 'Employment', 'Legal Aid', 'ID/Documents', 'Education', 'Healthcare', 'Family Reunification', 'Transportation', 'Financial'];
const MILESTONE_TEMPLATES = [
  { title: 'Secure stable housing', category: 'Housing', mly_reward: 50 },
  { title: 'Obtain state ID/driver license', category: 'Documents', mly_reward: 25 },
  { title: 'Get first paycheck', category: 'Employment', mly_reward: 50 },
  { title: 'Complete job training program', category: 'Education', mly_reward: 40 },
  { title: 'Open bank account', category: 'Financial', mly_reward: 15 },
  { title: 'Register to vote', category: 'Civic', mly_reward: 10 },
  { title: 'Connect with mentor', category: 'Support', mly_reward: 10 },
  { title: '30 days stable', category: 'Milestone', mly_reward: 30 },
  { title: '90 days stable', category: 'Milestone', mly_reward: 75 },
  { title: '1 year anniversary', category: 'Milestone', mly_reward: 200 },
];

export default function ReentryPage() {
  const [tab, setTab] = useState<ReentryTab>('home');
  const [resources, setResources] = useState<Resource[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('All');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: r } = await supabase.from('pop_reentry_resources').select('*').order('verified', { ascending: false });
    if (r) setResources(r);
    const { data: m } = await supabase.from('pop_reentry_mentors').select('*').eq('available', true);
    if (m) setMentors(m);
    if (user) {
      const { data: ms } = await supabase.from('pop_reentry_milestones').select('*').eq('user_id', user.id);
      if (ms) setMilestones(ms);
    }
    setLoading(false);
  }

  async function initMilestones() {
    if (!user) return;
    const supabase = createClient();
    const entries = MILESTONE_TEMPLATES.map(m => ({ user_id: user.id, title: m.title, category: m.category, completed: false, completed_at: null, mly_reward: m.mly_reward }));
    await supabase.from('pop_reentry_milestones').insert(entries);
    toast.success('Milestones set up! Complete them to earn $MLY.');
    loadData();
  }

  async function completeMilestone(id: string) {
    const supabase = createClient();
    await supabase.from('pop_reentry_milestones').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id);
    const ms = milestones.find(m => m.id === id);
    if (ms) toast.success(`+${ms.mly_reward} $MLY earned! 🎉`);
    loadData();
  }

  const completedCount = milestones.filter(m => m.completed).length;
  const totalReward = milestones.filter(m => m.completed).reduce((s, m) => s + m.mly_reward, 0);

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Reentry Support</h1>
        <p className="text-xs text-gray-500">Welcome back. Your community is here for you.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'resources', 'mentors', 'milestones', 'emergency'] as ReentryTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Home */}
      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">You belong here.</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">This space was built for people rebuilding their lives. No judgment. No stigma. Just support, resources, and a community that believes in second chances.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🏠', label: 'Find Housing', action: () => { setTab('resources'); setResourceFilter('Housing'); } },
              { icon: '💼', label: 'Find Work', action: () => { setTab('resources'); setResourceFilter('Employment'); } },
              { icon: '📋', label: 'Get Documents', action: () => { setTab('resources'); setResourceFilter('ID/Documents'); } },
              { icon: '🤝', label: 'Find Mentor', action: () => setTab('mentors') },
              { icon: '⚖️', label: 'Legal Help', action: () => { setTab('resources'); setResourceFilter('Legal Aid'); } },
              { icon: '🎯', label: 'My Progress', action: () => setTab('milestones') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
          {milestones.length > 0 && (
            <div className="card">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500">{completedCount}/{milestones.length} milestones</span>
                <span className="text-mly-600 font-bold">${totalReward} MLY earned</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setResourceFilter('All')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === 'All' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {RESOURCE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setResourceFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).length === 0 ? (
              <div className="card text-center py-8"><p className="text-sm text-gray-500">No resources in this category yet</p></div>
            ) : resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).map(res => (
              <div key={res.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                  {res.verified && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">✓ Verified</span>}
                  {res.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-mly-100 text-mly-700 rounded">$MLY</span>}
                </div>
                <p className="text-xs text-gray-500">{res.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📍 {res.location}</span>
                  {res.contact && <span>📞 {res.contact}</span>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Mentors */}
      {tab === 'mentors' && (
        <div className="space-y-2">
          {mentors.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm text-gray-500">Mentors are community members who&apos;ve walked this path before you</p>
            </div>
          ) : mentors.map(mentor => (
            <div key={mentor.id} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm">{mentor.display_name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{mentor.display_name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{mentor.bio}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                  <span>{mentor.years_since_release}+ years since release</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mentor.specialties.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <button className="btn-teal text-xs">Connect</button>
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Track Your Progress</p>
              <p className="text-xs text-gray-500 mt-1">Set up milestones and earn $MLY as you rebuild</p>
              {user && <button onClick={initMilestones} className="btn-teal text-xs mt-4">Set Up My Milestones</button>}
            </div>
          ) : (
            <>
              <div className="card">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-harbor-800 dark:text-white">{completedCount}/{milestones.length} complete</span>
                  <span className="text-mly-600 font-bold">${totalReward} MLY earned</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(completedCount / milestones.length) * 100}%` }} />
                </div>
              </div>
              {milestones.map(ms => (
                <div key={ms.id} className="card flex items-center gap-3">
                  {ms.completed ? (
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</span>
                  ) : (
                    <button onClick={() => completeMilestone(ms.id)} className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-teal-500 flex items-center justify-center transition-colors" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', ms.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{ms.title}</p>
                    <p className="text-[10px] text-gray-400">{ms.category}</p>
                  </div>
                  <span className="text-xs text-mly-600 font-bold">+{ms.mly_reward}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Emergency */}
      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 Emergency Resources</h3>
            <p className="text-xs text-red-600 mt-1">If you&apos;re in immediate danger, call 911</p>
          </div>
          {[
            { label: 'Parole/Probation Emergency', number: '(904) 555-0100', desc: 'Report issues before they escalate' },
            { label: 'Emergency Housing Hotline', number: '211', desc: 'Immediate shelter placement' },
            { label: 'Legal Emergency Line', number: '(904) 555-0200', desc: 'Know your rights during stops/checks' },
            { label: 'Crisis Mental Health', number: '988', desc: 'Suicide & Crisis Lifeline' },
            { label: 'MiLyfe Community Emergency', number: 'In-app', desc: 'Request immediate community help' },
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
