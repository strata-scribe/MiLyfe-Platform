'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Project { id: string; title: string; description: string; lead_id: string; status: string; category: string; funding_goal: number; funding_raised: number; member_count: number; created_at: string; profiles?: { display_name: string }; }
interface StudyGroup { id: string; name: string; topic: string; description: string; schedule: string | null; meeting_url: string | null; max_members: number; member_count: number; creator_id: string; }
interface Paper { id: string; title: string; authors: string; abstract: string; pdf_url: string | null; category: string; upvotes: number; created_at: string; }

type AcademiaTab = 'projects' | 'groups' | 'papers' | 'grants';

export default function AcademiaPage() {
  const [tab, setTab] = useState<AcademiaTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create project form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState('general');
  const [pGoal, setPGoal] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const [{ data: p }, { data: g }, { data: pa }] = await Promise.all([
      supabase.from('research_projects').select('*, profiles!research_projects_lead_id_fkey(display_name)').order('created_at', { ascending: false }),
      supabase.from('study_groups').select('*').order('member_count', { ascending: false }),
      supabase.from('academic_papers').select('*').order('upvotes', { ascending: false }).limit(20),
    ]);
    if (p) setProjects(p as any);
    if (g) setGroups(g);
    if (pa) setPapers(pa);
    setLoading(false);
  }

  async function handleCreateProject() {
    if (!user || !pTitle.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data } = await supabase.from('research_projects').insert({ title: pTitle.trim(), description: pDesc.trim(), lead_id: user.id, category: pCategory, funding_goal: parseFloat(pGoal) || 0 }).select().single();
    if (data) await supabase.from('research_members').insert({ project_id: data.id, user_id: user.id, role: 'lead' });
    setPTitle(''); setPDesc(''); setPGoal(''); setShowCreate(false); setCreating(false); loadData();
  }

  async function handleFundProject(projectId: string, amount: number) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('research_grants').insert({ project_id: projectId, amount, funder_id: user.id });
    await supabase.from('research_projects').update({ funding_raised: projects.find(p => p.id === projectId)!.funding_raised + amount }).eq('id', projectId);
    loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiAcademia</h1>
          <p className="text-xs text-gray-500">Community R&D, study groups, and research</p>
        </div>
        {user && <button onClick={() => setShowCreate(!showCreate)} className="btn-teal text-xs">+ New Project</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([{ key: 'projects', label: '🔬 Projects' }, { key: 'groups', label: '👥 Study Groups' }, { key: 'papers', label: '📄 Papers' }, { key: 'grants', label: '💰 Grants' }] as { key: AcademiaTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{t.label}</button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold">Propose a Research Project</h3>
          <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Project title" className="input-field" />
          <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="What are you researching and why?" className="input-field resize-none" rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <select value={pCategory} onChange={e => setPCategory(e.target.value)} className="input-field">
              {['general','technology','social','economic','health','education','environmental','civic'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={pGoal} onChange={e => setPGoal(e.target.value)} placeholder="Funding goal ($MLY)" type="number" className="input-field" />
          </div>
          <button onClick={handleCreateProject} disabled={!pTitle.trim() || creating} className="btn-teal w-full disabled:opacity-50">{creating ? 'Creating...' : 'Propose Project'}</button>
        </div>
      )}

      {/* Projects */}
      {tab === 'projects' && (
        <div className="space-y-3">
          {loading ? [1,2].map(i => <div key={i} className="card skeleton h-32" />) :
          projects.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No research projects yet.</p></div> :
          projects.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', p.status === 'active' ? 'bg-green-100 text-green-600' : p.status === 'completed' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600')}>{p.status}</span>
                  <h3 className="text-sm font-bold text-harbor-800 dark:text-white mt-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-harbor-800">
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>👤 {(p.profiles as any)?.display_name}</span>
                  <span>👥 {p.member_count} members</span>
                </div>
                {p.funding_goal > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-teal-600 font-medium">${p.funding_raised}/${p.funding_goal} MLY</p>
                    <div className="w-20 h-1.5 bg-gray-200 dark:bg-harbor-800 rounded-full mt-0.5">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min((p.funding_raised / p.funding_goal) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
              {user && p.funding_goal > 0 && (
                <button onClick={() => handleFundProject(p.id, 5)} className="mt-2 text-xs text-teal-600 font-medium hover:underline">💰 Fund $5 MLY</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Study Groups */}
      {tab === 'groups' && (
        <div className="space-y-3">
          {groups.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No study groups yet.</p></div> :
          groups.map(g => (
            <div key={g.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-xl">📚</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{g.name}</h3>
                <p className="text-xs text-gray-500">{g.topic}</p>
                <p className="text-xs text-gray-400 mt-0.5">{g.member_count}/{g.max_members} members {g.schedule && `· ${g.schedule}`}</p>
              </div>
              <button className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg">Join</button>
            </div>
          ))}
        </div>
      )}

      {/* Papers */}
      {tab === 'papers' && (
        <div className="space-y-3">
          {papers.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No papers submitted yet.</p></div> :
          papers.map(p => (
            <div key={p.id} className="card">
              <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{p.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">by {p.authors}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">{p.abstract}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>▲ {p.upvotes}</span>
                <span className="capitalize">{p.category}</span>
                {p.pdf_url && <a href={p.pdf_url} target="_blank" rel="noopener" className="text-teal-600">📄 PDF</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grants */}
      {tab === 'grants' && (
        <div className="card text-center py-8">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-sm text-gray-500">Fund community research with $MLY</p>
          <p className="text-xs text-gray-400 mt-1">Browse projects and contribute to ones you believe in.</p>
          <button onClick={() => setTab('projects')} className="text-xs text-teal-600 mt-3 hover:underline">View Projects →</button>
        </div>
      )}
    </div>
  );
}
