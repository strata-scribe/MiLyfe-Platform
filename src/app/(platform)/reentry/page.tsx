'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface Resource {
  id: string; title: string; category: string; description: string;
  location: string; contact: string; accepts_mly: boolean; verified: boolean;
}
interface Mentor {
  id: string; user_id: string; display_name: string; avatar_url: string | null;
  bio: string; years_since_release: number; specialties: string[]; available: boolean;
}
interface IDStep {
  id: string; user_id: string; label: string; category: string;
  completed: boolean; completed_at: string | null; notes: string;
}
interface Milestone {
  id: string; user_id: string; title: string; category: string;
  completed: boolean; completed_at: string | null; mly_reward: number;
}

type Tab = 'overview' | 'resources' | 'mentors' | 'id-rebuilding' | 'progress';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'resources', label: 'Resources' },
  { key: 'mentors', label: 'Mentors' },
  { key: 'id-rebuilding', label: 'ID Rebuilding' },
  { key: 'progress', label: 'My Progress' },
];

const RESOURCE_CATEGORIES = ['housing', 'employment', 'legal', 'benefits', 'support'];

const ID_CHECKLIST = [
  { label: 'Birth Certificate', category: 'vital' },
  { label: 'Social Security Card', category: 'vital' },
  { label: 'State ID / Driver License', category: 'state' },
  { label: 'Voter Registration', category: 'civic' },
  { label: 'Bank Account Opening', category: 'financial' },
  { label: 'Expungement Eligibility Check', category: 'legal' },
];

const MILESTONE_TEMPLATES = [
  { title: 'Secure stable housing', category: 'Housing', mly_reward: 50 },
  { title: 'Obtain state ID', category: 'Documents', mly_reward: 25 },
  { title: 'First paycheck received', category: 'Employment', mly_reward: 50 },
  { title: 'Complete job training', category: 'Education', mly_reward: 40 },
  { title: 'Open bank account', category: 'Financial', mly_reward: 15 },
  { title: 'Register to vote', category: 'Civic', mly_reward: 10 },
  { title: 'Connect with a mentor', category: 'Support', mly_reward: 10 },
  { title: '30 days on platform', category: 'Streak', mly_reward: 30 },
  { title: '90 days stable', category: 'Streak', mly_reward: 75 },
  { title: '1 year anniversary', category: 'Streak', mly_reward: 200 },
];

/* ─── Component ─── */
export default function ReentryPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [resources, setResources] = useState<Resource[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [idSteps, setIdSteps] = useState<IDStep[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [resResult, mentorResult] = await Promise.all([
      supabase.from('reentry_resources').select('*').order('verified', { ascending: false }),
      supabase.from('reentry_mentors').select('*').eq('available', true),
    ]);
    if (resResult.data) setResources(resResult.data);
    if (mentorResult.data) setMentors(mentorResult.data);

    if (user) {
      const [idResult, msResult] = await Promise.all([
        supabase.from('reentry_id_steps').select('*').eq('user_id', user.id),
        supabase.from('reentry_milestones').select('*').eq('user_id', user.id),
      ]);
      if (idResult.data) setIdSteps(idResult.data);
      if (msResult.data) setMilestones(msResult.data);
    }
    setLoading(false);
  }

  async function connectMentor(mentorId: string) {
    if (!user) { toast.error('Sign in to connect with mentors'); return; }
    const { error } = await supabase.from('reentry_mentor_connections').insert({ user_id: user.id, mentor_id: mentorId });
    if (error) { toast.error('Could not connect — try again'); return; }
    toast.success('Connection request sent! Your mentor will reach out soon.');
  }

  async function toggleIDStep(stepId: string, completed: boolean) {
    await supabase.from('reentry_id_steps').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', stepId);
    if (completed) toast.success('Step completed — keep going!');
    loadData();
  }

  async function initIDSteps() {
    if (!user) return;
    const entries = ID_CHECKLIST.map(s => ({ user_id: user.id, label: s.label, category: s.category, completed: false, completed_at: null, notes: '' }));
    await supabase.from('reentry_id_steps').insert(entries);
    toast.success('ID rebuilding checklist created');
    loadData();
  }

  async function initMilestones() {
    if (!user) return;
    const entries = MILESTONE_TEMPLATES.map(m => ({ user_id: user.id, title: m.title, category: m.category, completed: false, completed_at: null, mly_reward: m.mly_reward }));
    await supabase.from('reentry_milestones').insert(entries);
    toast.success('Milestones activated — earn $MLY as you progress!');
    loadData();
  }

  async function completeMilestone(id: string) {
    await supabase.from('reentry_milestones').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id);
    const ms = milestones.find(m => m.id === id);
    if (ms) toast.success(`+${ms.mly_reward} $MLY earned!`);
    loadData();
  }

  const filteredResources = resources.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || r.category.toLowerCase() === categoryFilter;
    return matchSearch && matchCat;
  });

  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMLY = milestones.filter(m => m.completed).reduce((s, m) => s + m.mly_reward, 0);
  const completedID = idSteps.filter(s => s.completed).length;

  /* ─── Skeleton ─── */
  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiReentry</h1>
        <p className="text-xs text-gray-500 mt-0.5">Welcome back. Your community is here for you — no judgment, just support.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Overview ─── */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Who this is for</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 leading-relaxed">Anyone rebuilding after incarceration. Whether you were released yesterday or years ago, this space connects you to housing, employment, legal aid, ID rebuilding, benefits navigation, expungement support, and voting restoration — plus a community that gets it.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🏠', label: 'Housing', action: () => { setTab('resources'); setCategoryFilter('housing'); } },
              { icon: '💼', label: 'Employment', action: () => { setTab('resources'); setCategoryFilter('employment'); } },
              { icon: '📋', label: 'ID Help', action: () => setTab('id-rebuilding') },
              { icon: '🤝', label: 'Find Mentor', action: () => setTab('mentors') },
              { icon: '⚖️', label: 'Legal/Expungement', action: () => { setTab('resources'); setCategoryFilter('legal'); } },
              { icon: '🗳️', label: 'Voting Rights', action: () => { setTab('resources'); setCategoryFilter('benefits'); } },
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
                <span className="text-gray-500">{completedMilestones}/{milestones.length} milestones</span>
                <span className="text-teal-600 font-bold">${totalMLY} MLY earned</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${milestones.length ? (completedMilestones / milestones.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-xs font-bold text-red-700 dark:text-red-400">Emergency Contacts</p>
            <div className="mt-1 space-y-1 text-xs text-red-600 dark:text-red-300">
              <p>Crisis Line: <span className="font-bold">988</span></p>
              <p>Immediate Shelter: <span className="font-bold">211</span></p>
              <p>Legal Emergency: <span className="font-bold">(904) 555-0200</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Resources ─── */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCategoryFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', categoryFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {RESOURCE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', categoryFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredResources.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No resources found</p><p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p></div>
          ) : filteredResources.map(res => (
            <div key={res.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                {res.verified && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Verified</span>}
                {res.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{res.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                {res.location && <span>📍 {res.location}</span>}
                {res.contact && <span>📞 {res.contact}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Mentors ─── */}
      {tab === 'mentors' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Mentors are community members who have been through reentry themselves. They volunteer their time to walk beside you.</p>
          </div>
          {loading ? <Skeleton /> : mentors.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm text-gray-500">No mentors available right now</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon — community is growing</p>
            </div>
          ) : mentors.map(mentor => (
            <div key={mentor.id} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700">
                {mentor.display_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{mentor.display_name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{mentor.bio}</p>
                <p className="text-[10px] text-gray-400 mt-1">{mentor.years_since_release}+ years rebuilding</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mentor.specialties?.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => connectMentor(mentor.id)} className="btn-teal text-xs">Connect</button>
            </div>
          ))}
        </div>
      )}

      {/* ─── ID Rebuilding ─── */}
      {tab === 'id-rebuilding' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">ID Rebuilding Checklist</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Step by step — get the documents you need to rebuild. Each step unlocks the next.</p>
          </div>
          {idSteps.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Start Your ID Checklist</p>
              <p className="text-xs text-gray-500 mt-1">Track birth certificate, SS card, state ID, and more</p>
              {user && <button onClick={initIDSteps} className="btn-teal text-xs mt-4">Create My Checklist</button>}
            </div>
          ) : (
            <>
              <div className="card">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-harbor-800 dark:text-white font-bold">{completedID}/{idSteps.length} complete</span>
                  <span className="text-teal-600">Keep going!</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${idSteps.length ? (completedID / idSteps.length) * 100 : 0}%` }} />
                </div>
              </div>
              {idSteps.map(step => (
                <div key={step.id} className="card flex items-center gap-3">
                  <button onClick={() => toggleIDStep(step.id, !step.completed)} className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors', step.completed ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 dark:border-gray-600 hover:border-teal-500')}>
                    {step.completed && '✓'}
                  </button>
                  <div className="flex-1">
                    <p className={cn('text-sm', step.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{step.label}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{step.category}</p>
                  </div>
                  {step.completed_at && <span className="text-[10px] text-gray-400">{new Date(step.completed_at).toLocaleDateString()}</span>}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ─── Progress ─── */}
      {tab === 'progress' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center">
              <p className="text-lg font-bold text-teal-600">{completedMilestones}</p>
              <p className="text-[10px] text-gray-500">Milestones</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold text-teal-600">${totalMLY}</p>
              <p className="text-[10px] text-gray-500">$MLY Earned</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold text-teal-600">{completedID}</p>
              <p className="text-[10px] text-gray-500">IDs Done</p>
            </div>
          </div>
          {milestones.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Track Your Rebuild</p>
              <p className="text-xs text-gray-500 mt-1">Set up milestones and earn $MLY as you hit them</p>
              {user && <button onClick={initMilestones} className="btn-teal text-xs mt-4">Activate Milestones</button>}
            </div>
          ) : milestones.map(ms => (
            <div key={ms.id} className="card flex items-center gap-3">
              {ms.completed ? (
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</span>
              ) : (
                <button onClick={() => completeMilestone(ms.id)} className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-teal-500 transition-colors" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', ms.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{ms.title}</p>
                <p className="text-[10px] text-gray-400">{ms.category}</p>
              </div>
              <span className="text-xs text-teal-600 font-bold">+{ms.mly_reward} $MLY</span>
            </div>
          ))}
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Earn $MLY by completing milestones, helping others in the community, and attending guild events. Spend at MiShop or save for housing deposits.</p>
          </div>
        </div>
      )}
    </div>
  );
}
