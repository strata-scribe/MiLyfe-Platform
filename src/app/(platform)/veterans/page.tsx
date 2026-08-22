'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Benefit { id: string; category: string; title: string; description: string; eligibility: string; link: string; }
interface Claim { id: string; user_id: string; type: string; status: 'submitted' | 'in-review' | 'approved' | 'denied'; submitted_at: string; updated_at: string; }
interface Peer { id: string; display_name: string; branch: string; era: string; specialties: string[]; available: boolean; }
interface Employer { id: string; company: string; industry: string; vet_friendly_rating: number; hiring_active: boolean; location: string; benefits: string[]; }
interface VetEvent { id: string; title: string; date: string; location: string; type: string; }

type VeteranTab = 'home' | 'benefits' | 'peer' | 'employment' | 'emergency';

const BRANCHES = ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force'];
const BENEFIT_CATEGORIES = ['Healthcare', 'Education', 'Disability', 'Housing', 'Employment', 'Life Insurance'];

export default function VeteransPage() {
  const [tab, setTab] = useState<VeteranTab>('home');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [events, setEvents] = useState<VetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [benefitFilter, setBenefitFilter] = useState('All');
  const [skillsInput, setSkillsInput] = useState('');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: b } = await supabase.from('pop_veteran_benefits').select('*').order('category');
    if (b) setBenefits(b);
    const { data: p } = await supabase.from('pop_veteran_peers').select('*').eq('available', true);
    if (p) setPeers(p);
    const { data: emp } = await supabase.from('pop_veteran_employers').select('*').eq('hiring_active', true);
    if (emp) setEmployers(emp);
    const { data: ev } = await supabase.from('pop_veteran_events').select('*').order('date').limit(5);
    if (ev) setEvents(ev);
    if (user) {
      const { data: cl } = await supabase.from('pop_veteran_claims').select('*').eq('user_id', user.id);
      if (cl) setClaims(cl);
    }
    setLoading(false);
  }

  async function requestBuddy(peerId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('pop_veteran_buddy_requests').insert({ user_id: user.id, peer_id: peerId, status: 'pending' });
    toast.success('Battle buddy request sent. They\u2019ll reach out soon.');
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'in-review': return 'bg-yellow-100 text-yellow-700';
      case 'denied': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Veteran Services</h1>
        <p className="text-xs text-gray-500">Thank you for your service. We&apos;ve got your six.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'benefits', 'peer', 'employment', 'emergency'] as VeteranTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-harbor-50 dark:bg-harbor-900/50 border border-harbor-200 dark:border-harbor-700">
            <p className="text-sm font-medium text-harbor-700 dark:text-harbor-300">🎖️ Thank you for your service.</p>
            <p className="text-xs text-harbor-600 dark:text-harbor-400 mt-1 leading-relaxed">You served this country. Now let this community serve you. From benefits navigation to finding your tribe — we&apos;re here for every chapter after service.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📋', label: 'VA Benefits', action: () => setTab('benefits') },
              { icon: '🤝', label: 'Battle Buddy', action: () => setTab('peer') },
              { icon: '💼', label: 'Vet-Friendly Jobs', action: () => setTab('employment') },
              { icon: '🆘', label: 'Crisis Support', action: () => setTab('emergency') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
          {events.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Upcoming Vet Events</p>
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                  <span className="text-xs text-teal-600 font-medium w-20">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-harbor-800 dark:text-white truncate">{ev.title}</p>
                    <p className="text-[10px] text-gray-400">{ev.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'benefits' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', ...BENEFIT_CATEGORIES].map(f => (
              <button key={f} onClick={() => setBenefitFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', benefitFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            benefits.filter(b => benefitFilter === 'All' || b.category === benefitFilter).map(benefit => (
              <div key={benefit.id} className="card space-y-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{benefit.title}</p>
                <p className="text-xs text-gray-500">{benefit.description}</p>
                <p className="text-[10px] text-teal-600">Eligibility: {benefit.eligibility}</p>
              </div>
            ))
          }
          {claims.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">My Claims Status</p>
              {claims.map(cl => (
                <div key={cl.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                  <div className="flex-1">
                    <p className="text-xs text-harbor-800 dark:text-white">{cl.type}</p>
                    <p className="text-[10px] text-gray-400">Submitted {new Date(cl.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full capitalize', getStatusColor(cl.status))}>{cl.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'peer' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">The Battle Buddy system connects you with fellow veterans who understand. Transition support, someone to talk to, or just shared understanding.</p>
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-24" />) :
            peers.map(peer => (
              <div key={peer.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-sm font-bold text-harbor-600">{peer.display_name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{peer.display_name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span>{peer.branch}</span><span>•</span><span>{peer.era}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {peer.specialties.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-harbor-50 dark:bg-harbor-800 text-harbor-600 dark:text-harbor-300 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => requestBuddy(peer.id)} className="btn-teal text-xs">Connect</button>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'employment' && (
        <div className="space-y-3">
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">Skills Translator</p>
            <p className="text-xs text-gray-500 mb-2">Translate your military skills to civilian terms</p>
            <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} className="input-field" placeholder="e.g., 11B Infantryman, E-6 logistics..." />
            <button onClick={() => toast.success('Skills translator: Translate your military MOS code in the search box above')} className="btn-teal text-xs mt-2 w-full">Translate My Skills</button>
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            employers.map(emp => (
              <div key={emp.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{emp.company}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">🎖️ Vet-Friendly</span>
                </div>
                <p className="text-xs text-gray-500">{emp.industry} • {emp.location}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {emp.benefits.map(b => (
                    <span key={b} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded">{b}</span>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 Veteran Crisis Resources</h3>
            <p className="text-xs text-red-600 mt-1">You served bravely. Let someone serve you now.</p>
          </div>
          {[
            { label: 'Veterans Crisis Line', number: '988 (Press 1)', desc: 'Free, confidential support for veterans 24/7' },
            { label: 'Crisis Text Line', number: 'Text 838255', desc: 'Text support for veterans' },
            { label: 'Emergency Veteran Housing', number: '1-877-424-3838', desc: 'SSVF - immediate housing assistance' },
            { label: 'Vet Center Combat Call', number: '1-877-927-8387', desc: 'Combat veteran peer support' },
            { label: 'VA Financial Hardship', number: '1-800-827-1000', desc: 'Emergency financial assistance' },
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
          <div className="card bg-harbor-50 dark:bg-harbor-900/50">
            <p className="text-xs text-harbor-600 dark:text-harbor-300 text-center">You don&apos;t have to fight this battle alone. Your brothers and sisters in arms are here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
