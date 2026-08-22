'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface Benefit {
  id: string; title: string; category: string; description: string;
  eligibility: string; how_to_apply: string; link: string;
}
interface ClaimStep {
  id: string; user_id: string; title: string; category: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'denied';
  notes: string; updated_at: string;
}
interface Peer {
  id: string; display_name: string; avatar_url: string | null;
  branch: string; years_served: number; bio: string;
  specialties: string[]; available: boolean;
}
interface TranslatedSkill {
  id: string; mos_code: string; mos_title: string;
  civilian_titles: string[]; salary_range: string; description: string;
}
interface Resource {
  id: string; title: string; category: string; description: string;
  address: string; phone: string; veteran_owned: boolean; accepts_mly: boolean;
}

type Tab = 'benefits' | 'claims' | 'peers' | 'transition' | 'resources';

const TABS: { key: Tab; label: string }[] = [
  { key: 'benefits', label: 'Benefits' },
  { key: 'claims', label: 'Claims' },
  { key: 'peers', label: 'Peers' },
  { key: 'transition', label: 'Transition' },
  { key: 'resources', label: 'Resources' },
];

const BENEFIT_CATEGORIES = ['Healthcare', 'Education', 'Housing', 'Employment', 'Disability', 'Family', 'Burial'];
const BRANCHES = ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force'];

/* ─── Component ─── */
export default function VeteransPage() {
  const [tab, setTab] = useState<Tab>('benefits');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [claims, setClaims] = useState<ClaimStep[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [translatedSkills, setTranslatedSkills] = useState<TranslatedSkill[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [benefitFilter, setBenefitFilter] = useState('all');
  const [mosSearch, setMosSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [benResult, peerResult, resResult] = await Promise.all([
      supabase.from('veterans_benefits').select('*'),
      supabase.from('veterans_peers').select('*').eq('available', true),
      supabase.from('veterans_resources').select('*'),
    ]);
    if (benResult.data) setBenefits(benResult.data);
    if (peerResult.data) setPeers(peerResult.data);
    if (resResult.data) setResources(resResult.data);

    if (user) {
      const { data: claimsData } = await supabase.from('veterans_claims').select('*').eq('user_id', user.id);
      if (claimsData) setClaims(claimsData);
    }
    setLoading(false);
  }

  async function searchMOS() {
    if (!mosSearch.trim()) return;
    const { data } = await supabase.from('veterans_mos_translations').select('*').or(`mos_code.ilike.%${mosSearch}%,mos_title.ilike.%${mosSearch}%`);
    if (data) setTranslatedSkills(data);
    else toast.error('No matches found — try a different MOS code or title');
  }

  async function connectPeer(peerId: string) {
    if (!user) { toast.error('Sign in to connect'); return; }
    const { error } = await supabase.from('veterans_peer_connections').insert({ user_id: user.id, peer_id: peerId });
    if (error) { toast.error('Connection failed'); return; }
    toast.success('Connection sent! Your fellow vet will reach out.');
  }

  async function updateClaimStatus(id: string, status: ClaimStep['status']) {
    await supabase.from('veterans_claims').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    toast.success('Claim status updated');
    loadData();
  }

  const filteredBenefits = benefits.filter(b => benefitFilter === 'all' || b.category.toLowerCase() === benefitFilter.toLowerCase());
  const filteredResources = resources.filter(r => resourceFilter === 'all' || r.category.toLowerCase() === resourceFilter.toLowerCase());

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiVeterans</h1>
        <p className="text-xs text-gray-500 mt-0.5">Thank you for your service. Now let us serve you.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Benefits ─── */}
      {tab === 'benefits' && (
        <div className="space-y-3">
          <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">VA Benefits Navigator</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Step-by-step guide to every benefit you earned. Broken down by category with eligibility and how to apply.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setBenefitFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', benefitFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {BENEFIT_CATEGORIES.map(c => (
              <button key={c} onClick={() => setBenefitFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', benefitFilter.toLowerCase() === c.toLowerCase() ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredBenefits.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No benefits in this category</p></div>
          ) : filteredBenefits.map(ben => (
            <div key={ben.id} className="card space-y-2">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{ben.title}</p>
              <p className="text-xs text-gray-500">{ben.description}</p>
              <div className="space-y-1 text-[10px] text-gray-400">
                <p><span className="font-medium">Eligibility:</span> {ben.eligibility}</p>
                <p><span className="font-medium">How to Apply:</span> {ben.how_to_apply}</p>
              </div>
              {ben.link && <a href={ben.link} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">Learn more →</a>}
            </div>
          ))}
        </div>
      )}

      {/* ─── Claims ─── */}
      {tab === 'claims' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Disability Claim Assistant</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Track your claims, get buddy statement templates, nexus letter guidance, and appeal walkthrough.</p>
          </div>
          {claims.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm text-gray-500">No claims tracked yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first claim to start tracking progress</p>
            </div>
          ) : claims.map(claim => (
            <div key={claim.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{claim.title}</p>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', {
                  'bg-gray-100 text-gray-600': claim.status === 'not_started',
                  'bg-yellow-100 text-yellow-700': claim.status === 'in_progress',
                  'bg-blue-100 text-blue-700': claim.status === 'submitted',
                  'bg-green-100 text-green-700': claim.status === 'approved',
                  'bg-red-100 text-red-700': claim.status === 'denied',
                })}>{claim.status.replace('_', ' ')}</span>
              </div>
              {claim.notes && <p className="text-xs text-gray-500">{claim.notes}</p>}
              <p className="text-[10px] text-gray-400">Updated: {new Date(claim.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Helpful Tools</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Buddy Statement Template', desc: 'Template for fellow service members to corroborate' },
                { label: 'Nexus Letter Guide', desc: 'How to get a medical nexus connecting condition to service' },
                { label: 'Appeal Walkthrough', desc: 'Step-by-step Higher-Level Review or Board Appeal' },
              ].map(tool => (
                <div key={tool.label} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-harbor-800 rounded-lg">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-xs font-medium text-harbor-800 dark:text-white">{tool.label}</p>
                    <p className="text-[10px] text-gray-400">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Peers ─── */}
      {tab === 'peers' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Connect with fellow veterans in your community. People who get it — no explanation needed.</p>
          </div>
          {loading ? <Skeleton /> : peers.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🎖️</p>
              <p className="text-sm text-gray-500">No peers listed yet — you could be the first</p>
            </div>
          ) : peers.map(peer => (
            <div key={peer.id} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-700">
                {peer.display_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{peer.display_name}</p>
                <p className="text-[10px] text-gray-400">{peer.branch} • {peer.years_served} years served</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{peer.bio}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {peer.specialties?.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => connectPeer(peer.id)} className="btn-teal text-xs">Connect</button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Transition ─── */}
      {tab === 'transition' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Military-to-Civilian Skills Translator</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Enter your MOS code or military job title to see civilian equivalents and salary ranges.</p>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="MOS code or job title (e.g. 11B, 68W)..." value={mosSearch} onChange={e => setMosSearch(e.target.value)} className="input-field flex-1" />
            <button onClick={searchMOS} className="btn-teal text-xs px-4">Translate</button>
          </div>
          {translatedSkills.length > 0 && (
            <div className="space-y-2">
              {translatedSkills.map(skill => (
                <div key={skill.id} className="card space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded font-mono">{skill.mos_code}</span>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{skill.mos_title}</p>
                  </div>
                  <p className="text-xs text-gray-500">{skill.description}</p>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Civilian equivalents:</p>
                    <div className="flex flex-wrap gap-1">
                      {skill.civilian_titles.map(title => (
                        <span key={title} className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded">{title}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-teal-600 font-medium">Salary range: {skill.salary_range}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/career" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">📝</span>
            <div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Resume Builder</p>
              <p className="text-xs text-gray-400">Translate your military experience into civilian terms</p>
            </div>
          </Link>
        </div>
      )}

      {/* ─── Resources ─── */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'housing', 'health', 'employment', 'business', 'education'].map(cat => (
              <button key={cat} onClick={() => setResourceFilter(cat)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', resourceFilter === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{cat}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredResources.map(res => (
            <div key={res.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                {res.veteran_owned && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Vet Owned</span>}
                {res.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{res.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                {res.address && <span>📍 {res.address}</span>}
                {res.phone && <span>📞 {res.phone}</span>}
              </div>
            </div>
          ))}
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Key Programs</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>• <strong>HUD-VASH</strong> — Housing vouchers for homeless veterans</p>
              <p>• <strong>VA Home Loan</strong> — $0 down, no PMI mortgage</p>
              <p>• <strong>GI Bill</strong> — Education benefits transfer info</p>
              <p>• <strong>Vet Center</strong> — Free readjustment counseling</p>
            </div>
          </div>
        </div>
      )}

      {/* Crisis Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Veterans Crisis Line</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-red-600 dark:text-red-300">
          <span>Call: <strong>988 (Press 1)</strong></span>
          <span>Text: <strong>838255</strong></span>
          <span>Vet Center: <strong>1-877-927-8387</strong></span>
        </div>
      </div>
    </div>
  );
}
