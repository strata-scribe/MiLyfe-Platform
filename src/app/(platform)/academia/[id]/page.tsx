'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface ResearchProject {
  id: string;
  title: string;
  description: string;
  lead_id: string;
  status: 'proposal' | 'active' | 'completed' | 'paused';
  funding_goal: number;
  funding_raised: number;
  category: string;
  members: string[];
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  completed_at: string | null;
}

interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  created_at: string;
  display_name?: string;
}

const statusColors: Record<string, string> = {
  proposal: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paused: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function AcademiaProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [updateInput, setUpdateInput] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadProject(); }, [projectId]);

  async function loadProject() {
    setLoading(true);
    const { data: p } = await supabase.from('research_projects').select('*, profiles!research_projects_lead_id_fkey(display_name, avatar_url)').eq('id', projectId).single();
    if (p) {
      setProject(p as any);
      if (user && (p.members || []).includes(user.id)) setIsMember(true);
    }

    const { data: m } = await supabase.from('research_milestones').select('*').eq('project_id', projectId).order('due_date', { ascending: true });
    if (m) setMilestones(m as any);

    const { data: u } = await supabase.from('research_updates').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20);
    if (u) setUpdates(u as any);
    setLoading(false);
  }

  async function joinProject() {
    if (!user || !project) return;
    const members = [...(project.members || []), user.id];
    await supabase.from('research_projects').update({ members }).eq('id', projectId);
    setIsMember(true);
    setProject({ ...project, members });
    toast.success('Joined project!');
  }

  async function fundProject() {
    if (!user || !project || !fundAmount) return;
    const amount = parseFloat(fundAmount);
    if (amount <= 0) return;

    const { error } = await supabase.rpc('transfer_mly', {
      sender_id: user.id, recipient_identifier: project.lead_id, transfer_amount: amount, transfer_note: `Research funding: ${project.title}`,
    });
    if (error) { toast.error(error.message); return; }

    await supabase.from('research_projects').update({ funding_raised: (project.funding_raised || 0) + amount }).eq('id', projectId);
    setProject({ ...project, funding_raised: (project.funding_raised || 0) + amount });
    setFundAmount('');
    toast.success(`Funded ${amount} $MLY!`);
  }

  async function postUpdate() {
    if (!user || !updateInput.trim()) return;
    await supabase.from('research_updates').insert({ project_id: projectId, user_id: user.id, message: updateInput.trim(), display_name: user.display_name });
    setUpdates(prev => [{ id: Date.now().toString(), project_id: projectId, user_id: user.id, message: updateInput.trim(), created_at: new Date().toISOString(), display_name: user.display_name }, ...prev]);
    setUpdateInput('');
    toast.success('Update posted!');
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  if (loading) return <div className="space-y-4 animate-slide-up"><div className="skeleton h-32 rounded-xl" /><div className="skeleton h-48 rounded-xl" /></div>;
  if (!project) return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/academia" className="text-gray-400 text-sm">← Back</Link>
      <div className="card text-center py-8"><p className="text-gray-500">Project not found</p></div>
    </div>
  );

  const fundingPct = project.funding_goal > 0 ? Math.min(100, Math.round((project.funding_raised / project.funding_goal) * 100)) : 0;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/academia" className="text-gray-400 text-sm">← Back to MiAcademia</Link>

      {/* Project Header */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs px-2 py-0.5 rounded capitalize', statusColors[project.status])}>{project.status}</span>
          <span className="text-xs text-gray-400 capitalize">{project.category}</span>
        </div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">{project.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{project.description}</p>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>Led by {(project.profiles as any)?.display_name}</span>
          <span>·</span>
          <span>{(project.members || []).length} members</span>
          <span>·</span>
          <span>Started {new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Funding */}
      {project.funding_goal > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Funding</h3>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-mly-600 font-bold">{project.funding_raised} $MLY raised</span>
            <span className="text-gray-400">Goal: {project.funding_goal} $MLY</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
            <div className="h-full bg-mly-500 rounded-full transition-all" style={{ width: `${fundingPct}%` }} />
          </div>
          {user && project.status !== 'completed' && (
            <div className="flex gap-2 mt-3">
              <input type="number" placeholder="$MLY amount" value={fundAmount} onChange={e => setFundAmount(e.target.value)} className="input-field flex-1 text-sm" />
              <button onClick={fundProject} disabled={!fundAmount} className="btn-teal text-sm disabled:opacity-50">Fund</button>
            </div>
          )}
        </div>
      )}

      {/* Join */}
      {user && !isMember && project.status === 'active' && (
        <button onClick={joinProject} className="btn-teal w-full">Join This Project</button>
      )}

      {/* Milestones */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Milestones ({completedMilestones}/{milestones.length})</h3>
        {milestones.length === 0 ? (
          <div className="card text-center py-4"><p className="text-xs text-gray-500">No milestones defined yet</p></div>
        ) : milestones.map(m => (
          <div key={m.id} className="card flex items-center gap-3">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs', m.status === 'completed' ? 'bg-green-100 text-green-600' : m.status === 'in_progress' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400')}>
              {m.status === 'completed' ? '✓' : m.status === 'in_progress' ? '→' : '○'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm', m.status === 'completed' ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{m.title}</p>
              {m.due_date && <p className="text-[10px] text-gray-400">Due {new Date(m.due_date).toLocaleDateString()}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Updates */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Updates</h3>
        {isMember && (
          <div className="card space-y-2">
            <textarea value={updateInput} onChange={e => setUpdateInput(e.target.value)} placeholder="Post a project update..." className="input-field resize-none text-sm" rows={2} />
            <button onClick={postUpdate} disabled={!updateInput.trim()} className="btn-teal text-xs disabled:opacity-50">Post Update</button>
          </div>
        )}
        {updates.length === 0 ? (
          <div className="card text-center py-4"><p className="text-xs text-gray-500">No updates yet</p></div>
        ) : updates.map(u => (
          <div key={u.id} className="card py-2.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium text-teal-600">{u.display_name}</span>
              <span>·</span>
              <span>{timeAgo(u.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{u.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
