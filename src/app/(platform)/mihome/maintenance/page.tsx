'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface MaintenanceTask {
  id: string;
  home_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  due_date: string | null;
  assigned_to: string | null;
  cost_estimate: number | null;
  cost_actual: number | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';

const CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Exterior', 'Cleaning', 'Pest Control', 'Safety', 'Other'];
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [showAdd, setShowAdd] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenanceTask['priority']>('medium');
  const [category, setCategory] = useState('Other');
  const [dueDate, setDueDate] = useState('');
  const [costEstimate, setCostEstimate] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadTasks(); }, [filterStatus, filterPriority]);

  async function loadTasks() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('mihome_maintenance').select('*').order('priority', { ascending: true }).order('created_at', { ascending: false });
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    if (filterPriority !== 'all') query = query.eq('priority', filterPriority);
    const { data } = await query.limit(50);
    if (data) setTasks(data);
    setLoading(false);
  }

  async function createTask() {
    if (!user || !title.trim()) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('mihome_maintenance').insert({
      home_id: null, title: title.trim(), description: description.trim() || null,
      priority, category, status: 'pending',
      due_date: dueDate || null, cost_estimate: parseFloat(costEstimate) || null,
      assigned_to: user.id,
    });
    setTitle(''); setDescription(''); setDueDate(''); setCostEstimate('');
    setShowAdd(false); setCreating(false);
    loadTasks();
  }

  async function updateStatus(taskId: string, status: MaintenanceTask['status']) {
    const supabase = createClient();
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    await supabase.from('mihome_maintenance').update(updates).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Maintenance</h1>
          <p className="text-xs text-gray-500">{pendingCount} pending · {inProgressCount} in progress</p>
        </div>
        {user && <button onClick={() => setShowAdd(!showAdd)} className="btn-teal text-xs">+ Task</button>}
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Maintenance Task</h3>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs fixing?" className="input-field" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details (optional)" className="input-field resize-none" rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <select value={priority} onChange={e => setPriority(e.target.value as any)} className="input-field">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" />
            <input value={costEstimate} onChange={e => setCostEstimate(e.target.value)} placeholder="Est. cost ($MLY)" className="input-field" type="number" />
          </div>
          <button onClick={createTask} disabled={!title.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Add Task'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="input-field text-xs w-auto">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} className="input-field text-xs w-auto">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {loading ? [1, 2, 3, 4].map(i => <div key={i} className="card skeleton h-20" />) :
          tasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-gray-500">No maintenance tasks found</p>
            </div>
          ) : tasks.map(task => (
            <div key={task.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                    <span className="text-[10px] text-gray-400">{task.category}</span>
                  </div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{task.description}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                  {task.cost_estimate && <span>~${task.cost_estimate} MLY</span>}
                </div>
                <div className="flex gap-1">
                  {task.status === 'pending' && (
                    <button onClick={() => updateStatus(task.id, 'in_progress')} className="text-[10px] px-2 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded">Start</button>
                  )}
                  {task.status === 'in_progress' && (
                    <button onClick={() => updateStatus(task.id, 'completed')} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">Done</button>
                  )}
                  {task.status === 'completed' && (
                    <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">✓ Complete</span>
                  )}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
