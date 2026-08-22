'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface HousingListing {
  id: string; title: string; description: string; location: string;
  rent_mly: number; roommate_vetted: boolean; available: boolean;
  type: string; amenities: string[];
}
interface Skill {
  id: string; title: string; category: string; description: string;
  duration_minutes: number; completed: boolean; mly_reward: number;
}
interface Mentor {
  id: string; display_name: string; avatar_url: string | null;
  bio: string; expertise: string[]; available: boolean; age_range: string;
}
interface NetworkContact {
  id: string; user_id: string; name: string; phone: string;
  relationship: string; notify_emergency: boolean;
}
interface UBIStatus {
  id: string; user_id: string; days_remaining: number; daily_amount: number;
  total_earned: number; started_at: string;
}

type Tab = 'start' | 'housing' | 'skills' | 'mentors' | 'network';

const TABS: { key: Tab; label: string }[] = [
  { key: 'start', label: 'Start Here' },
  { key: 'housing', label: 'Housing' },
  { key: 'skills', label: 'Skills' },
  { key: 'mentors', label: 'Mentors' },
  { key: 'network', label: 'My Network' },
];

const SKILL_CATEGORIES = ['Banking', 'Cooking', 'Renting', 'Budgeting', 'Taxes', 'Health', 'Career'];

/* ─── Component ─── */
export default function YouthPage() {
  const [tab, setTab] = useState<Tab>('start');
  const [housing, setHousing] = useState<HousingListing[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [network, setNetwork] = useState<NetworkContact[]>([]);
  const [ubiStatus, setUbiStatus] = useState<UBIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [housingResult, skillResult, mentorResult] = await Promise.all([
      supabase.from('youth_housing').select('*').eq('available', true),
      supabase.from('youth_skills').select('*'),
      supabase.from('youth_mentors').select('*').eq('available', true),
    ]);
    if (housingResult.data) setHousing(housingResult.data);
    if (skillResult.data) setSkills(skillResult.data);
    if (mentorResult.data) setMentors(mentorResult.data);

    if (user) {
      const [networkResult, ubiResult] = await Promise.all([
        supabase.from('youth_network_contacts').select('*').eq('user_id', user.id),
        supabase.from('youth_ubi_status').select('*').eq('user_id', user.id).single(),
      ]);
      if (networkResult.data) setNetwork(networkResult.data);
      if (ubiResult.data) setUbiStatus(ubiResult.data);
    }
    setLoading(false);
  }

  async function connectMentor(mentorId: string) {
    if (!user) { toast.error('Sign in to connect'); return; }
    const { error } = await supabase.from('youth_mentor_connections').insert({ user_id: user.id, mentor_id: mentorId });
    if (error) { toast.error('Connection failed — try again'); return; }
    toast.success('Connection request sent! Your mentor will reach out.');
  }

  async function addNetworkContact(name: string, phone: string, relationship: string) {
    if (!user) return;
    const { error } = await supabase.from('youth_network_contacts').insert({
      user_id: user.id, name, phone, relationship, notify_emergency: true,
    });
    if (error) { toast.error('Could not add contact'); return; }
    toast.success('Contact added to your network!');
    loadData();
  }

  async function completeSkill(skillId: string) {
    if (!user) return;
    await supabase.from('youth_skill_completions').insert({ user_id: user.id, skill_id: skillId });
    const skill = skills.find(s => s.id === skillId);
    if (skill) toast.success(`+${skill.mly_reward} $MLY earned! Skill unlocked.`);
    loadData();
  }

  const filteredSkills = skills.filter(s => skillFilter === 'all' || s.category.toLowerCase() === skillFilter.toLowerCase());
  const completedSkills = skills.filter(s => s.completed).length;

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiYouth</h1>
        <p className="text-xs text-gray-500 mt-0.5">For foster youth aging out — you are not alone in this transition.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Start Here ─── */}
      {tab === 'start' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Welcome — You Belong Here</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 leading-relaxed">
              If you&apos;re 18+ and aging out of foster care, MiYouth is your launchpad. Here you&apos;ll find housing, life skills, real mentors (not counselors), and people who become your chosen family. Everything here is designed for YOUR situation.
            </p>
          </div>
          {/* UBI Banner */}
          <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-sm font-bold text-green-700 dark:text-green-300">💰 Bonus UBI: $20/day for 90 days</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              As a foster youth member, you automatically receive $20 $MLY daily for your first 90 days. No strings attached — spend it on what you need.
            </p>
            {ubiStatus && (
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">{ubiStatus.days_remaining} days remaining</span>
                  <span className="font-bold text-green-700">${ubiStatus.total_earned} earned so far</span>
                </div>
                <div className="h-2 bg-green-200 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${((90 - ubiStatus.days_remaining) / 90) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🏠', label: 'Find Housing', action: () => setTab('housing') },
              { icon: '📚', label: 'Life Skills', action: () => setTab('skills') },
              { icon: '🤝', label: 'Find Mentor', action: () => setTab('mentors') },
              { icon: '👥', label: 'Build Network', action: () => setTab('network') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
          <Link href="/vault" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">🔐</span>
            <div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Document Vault</p>
              <p className="text-xs text-gray-400">Store birth certificate, school records, medical files safely</p>
            </div>
          </Link>
        </div>
      )}

      {/* ─── Housing ─── */}
      {tab === 'housing' && (
        <div className="space-y-3">
          <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-300">Priority housing for foster youth aging out. All roommates are vetted community members.</p>
          </div>
          {loading ? <Skeleton /> : housing.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🏠</p>
              <p className="text-sm text-gray-500">No listings right now</p>
              <p className="text-xs text-gray-400 mt-1">New housing options are posted regularly</p>
            </div>
          ) : housing.map(h => (
            <div key={h.id} className="card space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{h.title}</p>
                {h.roommate_vetted && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Vetted</span>}
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded capitalize">{h.type}</span>
              </div>
              <p className="text-xs text-gray-500">{h.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>📍 {h.location}</span>
                <span className="text-teal-600 font-medium">{h.rent_mly} $MLY/mo</span>
              </div>
              {h.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {h.amenities.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-500 rounded">{a}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Skills ─── */}
      {tab === 'skills' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">Fast-track life skills from MiLearn — things nobody taught you but everyone expects you to know.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSkillFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', skillFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {SKILL_CATEGORIES.map(c => (
              <button key={c} onClick={() => setSkillFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', skillFilter.toLowerCase() === c.toLowerCase() ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredSkills.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No skills in this category yet</p></div>
          ) : filteredSkills.map(skill => (
            <div key={skill.id} className="card flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs', skill.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-harbor-800 text-gray-500')}>
                {skill.completed ? '✓' : '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', skill.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white font-medium')}>{skill.title}</p>
                <p className="text-[10px] text-gray-400">{skill.category} • {skill.duration_minutes} min</p>
              </div>
              {!skill.completed ? (
                <button onClick={() => completeSkill(skill.id)} className="btn-teal text-xs">Start</button>
              ) : (
                <span className="text-xs text-green-600">+{skill.mly_reward}</span>
              )}
            </div>
          ))}
          <div className="card text-center">
            <p className="text-xs text-gray-500">{completedSkills}/{skills.length} skills completed</p>
          </div>
        </div>
      )}

      {/* ─── Mentors ─── */}
      {tab === 'mentors' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">These are real community members — not counselors. People who genuinely want to guide you through this transition.</p>
          </div>
          {loading ? <Skeleton /> : mentors.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm text-gray-500">Mentor matching in progress</p>
            </div>
          ) : mentors.map(mentor => (
            <div key={mentor.id} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700">
                {mentor.display_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{mentor.display_name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{mentor.bio}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mentor.expertise?.slice(0, 3).map(e => (
                    <span key={e} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{e}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => connectMentor(mentor.id)} className="btn-teal text-xs">Connect</button>
            </div>
          ))}
        </div>
      )}

      {/* ─── My Network ─── */}
      {tab === 'network' && (
        <div className="space-y-3">
          <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Build Your Chosen Family</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Add 3+ emergency contacts — people who get notified if you need help. These are your people.
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Emergency Contacts</p>
              <span className={cn('text-xs font-bold', network.length >= 3 ? 'text-green-600' : 'text-yellow-600')}>{network.length}/3 minimum</span>
            </div>
            {network.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No contacts yet — start building your network</p>
            ) : network.map(contact => (
              <div key={contact.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-700">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-harbor-800 dark:text-white">{contact.name}</p>
                  <p className="text-[10px] text-gray-400">{contact.relationship} • {contact.phone}</p>
                </div>
                {contact.notify_emergency && <span className="text-[10px] text-green-600">🔔 Notified</span>}
              </div>
            ))}
          </div>
          <Link href="/vault" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">📄</span>
            <div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Document Vault</p>
              <p className="text-xs text-gray-400">Birth certificate, school records, medical files</p>
            </div>
          </Link>
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Earn $MLY by completing life skills, helping other youth, and maintaining your housing. Your UBI bonus stacks with all other earnings.</p>
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Need Help Now?</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-red-600 dark:text-red-300">
          <span>Crisis: <strong>988</strong></span>
          <span>Runaway Safeline: <strong>1-800-786-2929</strong></span>
          <span>Childhelp: <strong>1-800-422-4453</strong></span>
        </div>
      </div>
    </div>
  );
}
