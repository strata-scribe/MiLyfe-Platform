'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Project {
  id: string;
  home_id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  budget: number;
  spent: number;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  steps: { id: string; title: string; done: boolean }[];
  images: string[];
  created_at: string;
}

type ProjectFilter = 'all' | 'planning' | 'in_progress' | 'completed';

const CATEGORIES = ['Paint & Decor', 'Landscaping', 'Electrical', 'Plumbing', 'Flooring', 'Kitchen', 'Bathroom', 'Storage', 'Outdoor', 'Other'];

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  in_progress: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [showAdd, setShowAdd] = useState(false);

  // Form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState('Other');
  const [pBudget, setPBudget] = useState('');
  const [pTarget, setPTarget] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadProjects(); }, [filter]);

  async function loadProjects() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('mihome_projects').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query.limit(30);
    if (data) setProjects(data);
    setLoading(false);
  }

  async function createProject() {
    if (!user || !pTitle.trim()) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('mihome_projects').insert({
      home_id: null, owner_id: user.id, title: pTitle.trim(),
      description: pDesc.trim(), category: pCategory, status: 'planning',
      priority: 'medium', budget: parseFloat(pBudget) || 0, spent: 0,
      target_date: pTarget || null, steps: [], images: [],
    });
    setPTitle(''); setPDesc(''); setPBudget(''); setPTarget('');
    setShowAdd(false); setCreating(false);
    loadProjects();
  }

  async function updateStatus(projectId: string, status: Project['status']) {
    const supabase = createClient();
    const updates: any = { status };
    if (status === 'completed') updates.completed_date = new Date().toISOString();
    await supabase.from('mihome_projects').update(updates).eq('id', projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  }

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const activeCount = projects.filter(p => p.status === 'in_progress').length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Home Projects</h1>
          <p className="text-xs text-gray-500">{activeCount} active · ${totalSpent.toFixed(0)} of ${totalBudget.toFixed(0)} spent</p>
        </div>
        {user && <button onClick={() => setShowAdd(!showAdd)} className="btn-teal text-xs">+ Project</button>}
      </div>

      {/* Add Project */}
      {showAdd && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Project</h3>
          <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Project name" className="input-field" />
          <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="What are you building/fixing?" className="input-field resize-none" rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <select value={pCategory} onChange={e => setPCategory(e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={pBudget} onChange={e => setPBudget(e.target.value)} placeholder="Budget ($MLY)" className="input-field" type="number" />
          </div>
          <input value={pTarget} onChange={e => setPTarget(e.target.value)} className="input-field" type="date" />
          <button onClick={createProject} disabled={!pTitle.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Start Project'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'planning', 'in_progress', 'completed'] as ProjectFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', filter === f ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>
            {f === 'in_progress' ? 'Active' : f}
          </button>
        ))}
      </div>

      {/* Projects */}
      <div className="space-y-3">
        {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-28" />) :
          projects.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🏗️</p>
              <p className="text-sm text-gray-500">No projects yet</p>
              <p className="text-xs text-gray-400 mt-1">Plan your next home improvement</p>
            </div>
          ) : projects.map(project => {
            const progress = project.steps.length > 0
              ? Math.round((project.steps.filter(s => s.done).length / project.steps.length) * 100)
              : 0;
            const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

            return (
              <div key={project.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', STATUS_COLORS[project.status])}>{project.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-gray-400">{project.category}</span>
                    </div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1">{project.title}</p>
                    {project.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{project.description}</p>}
                  </div>
                </div>

                {/* Progress bar */}
                {project.steps.length > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Budget */}
                {project.budget > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">${project.spent} / ${project.budget} MLY</span>
                    <span className={cn(budgetPct > 100 ? 'text-red-600' : budgetPct > 80 ? 'text-orange-600' : 'text-green-600')}>{budgetPct}% of budget</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {project.status === 'planning' && (
                    <button onClick={() => updateStatus(project.id, 'in_progress')} className="text-[10px] px-2 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded">Start</button>
                  )}
                  {project.status === 'in_progress' && (
                    <>
                      <button onClick={() => updateStatus(project.id, 'completed')} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">Complete</button>
                      <button onClick={() => updateStatus(project.id, 'on_hold')} className="text-[10px] px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">Pause</button>
                    </>
                  )}
                  {project.status === 'on_hold' && (
                    <button onClick={() => updateStatus(project.id, 'in_progress')} className="text-[10px] px-2 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded">Resume</button>
                  )}
                  {project.target_date && (
                    <span className="text-[10px] text-gray-400 ml-auto">Target: {new Date(project.target_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
