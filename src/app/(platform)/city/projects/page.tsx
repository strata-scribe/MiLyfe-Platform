'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface CivicProject { id: string; name: string; description: string; neighborhood: string | null; creator_id: string; status: string; budget: number; spent: number; member_count: number; issue_count: number; stars: number; created_at: string; profiles?: { display_name: string }; }
interface RepairClaim { id: string; issue_id: string; claimer_id: string; claimer_type: string; tier: number; before_photo: string | null; after_photo: string | null; status: string; reward_mly: number; created_at: string; city_issues?: { title: string }; }

type CivicTab = 'projects' | 'repairs' | 'create';

export default function CityProjectsPage() {
  const [tab, setTab] = useState<CivicTab>('projects');
  const [projects, setProjects] = useState<CivicProject[]>([]);
  const [repairs, setRepairs] = useState<RepairClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Create project form
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pNeighborhood, setPNeighborhood] = useState('');
  const [pBudget, setPBudget] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: p } = await supabase.from('civic_projects').select('*, profiles!civic_projects_creator_id_fkey(display_name)').order('stars', { ascending: false });
    if (p) setProjects(p as any);
    const { data: r } = await supabase.from('civic_repair_claims').select('*, city_issues!civic_repair_claims_issue_id_fkey(title)').order('created_at', { ascending: false }).limit(20);
    if (r) setRepairs(r as any);
    setLoading(false);
  }

  async function handleCreate() {
    if (!user || !pName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('civic_projects').insert({ name: pName.trim(), description: pDesc.trim(), neighborhood: pNeighborhood.trim() || null, creator_id: user.id, budget: parseFloat(pBudget) || 0 });
    setPName(''); setPDesc(''); setPNeighborhood(''); setPBudget(''); setCreating(false); setTab('projects'); loadData();
  }

  async function handleStar(projectId: string) {
    const supabase = createClient();
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, stars: p.stars + 1 } : p));
    await supabase.from('civic_projects').update({ stars: projects.find(p => p.id === projectId)!.stars + 1 }).eq('id', projectId);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Civic Projects</h1>
          <p className="text-xs text-gray-500">GitHub for your city. Propose, repair, improve.</p>
        </div>
        {user && <button onClick={() => setTab('create')} className="btn-teal text-xs">+ New Project</button>}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['projects', 'repairs', 'create'] as CivicTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'create' ? '+ Create' : t}</button>
        ))}
      </div>

      {/* Projects */}
      {tab === 'projects' && (
        <div className="space-y-3">
          {loading ? [1,2].map(i => <div key={i} className="card skeleton h-32" />) :
          projects.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No civic projects yet. Create the first!</p></div> :
          projects.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start gap-3">
                <button onClick={() => handleStar(p.id)} className="text-sm text-gray-400 hover:text-amber-500 pt-0.5">⭐</button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', p.status === 'active' ? 'bg-green-100 text-green-600' : p.status === 'completed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600')}>{p.status}</span>
                    {p.neighborhood && <span className="text-xs text-gray-400">📍 {p.neighborhood}</span>}
                  </div>
                  <h3 className="text-sm font-bold text-harbor-800 dark:text-white mt-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>⭐ {p.stars}</span>
                    <span>👥 {p.member_count}</span>
                    <span>🎫 {p.issue_count} issues</span>
                    {p.budget > 0 && <span>💰 ${p.spent}/${p.budget}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repair Claims */}
      {tab === 'repairs' && (
        <div className="space-y-3">
          <div className="card bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">🔧 Citizen Repair Program</h3>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Claim an open city issue, fix it yourself, upload before/after photos, get paid in $MLY.</p>
            <div className="flex gap-3 mt-2 text-xs text-amber-600">
              <span>Tier 1: Cleanup ($10-20)</span>
              <span>Tier 2: Minor repair ($20-50)</span>
              <span>Tier 3: Major ($50-100)</span>
            </div>
          </div>
          {repairs.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">No repair claims yet. Claim an issue from MiCity!</p></div> :
          repairs.map(r => (
            <div key={r.id} className="card flex items-center gap-3">
              <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', r.status === 'verified' || r.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>T{r.tier}</span>
              <div className="flex-1">
                <p className="text-sm text-harbor-800 dark:text-white">{(r.city_issues as any)?.title || 'Issue'}</p>
                <p className="text-xs text-gray-400">{r.status} {r.reward_mly > 0 && `· $${r.reward_mly} MLY`}</p>
              </div>
              {r.status === 'submitted' && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded">Awaiting Verification</span>}
              {r.status === 'paid' && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">✓ Paid</span>}
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      {tab === 'create' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Start a Civic Project</h3>
          <p className="text-xs text-gray-500">Organize neighbors around an improvement campaign.</p>
          <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Project name (e.g. Fix Moncrief Sidewalks)" className="input-field" />
          <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="What's the goal? What needs to happen?" className="input-field resize-none" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <input value={pNeighborhood} onChange={e => setPNeighborhood(e.target.value)} placeholder="Neighborhood" className="input-field" />
            <input value={pBudget} onChange={e => setPBudget(e.target.value)} placeholder="Budget ($MLY)" type="number" className="input-field" />
          </div>
          <button onClick={handleCreate} disabled={!pName.trim() || creating} className="btn-teal w-full disabled:opacity-50">{creating ? 'Creating...' : 'Launch Project'}</button>
        </div>
      )}
    </div>
  );
}
