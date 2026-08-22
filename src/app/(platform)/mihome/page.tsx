'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

type Tab = 'dashboard' | 'maintenance' | 'utilities' | 'roommates' | 'projects';
type Room = 'Kitchen' | 'Bathroom' | 'Bedroom' | 'Living Room' | 'Garage' | 'Yard';
type Urgency = 'low' | 'medium' | 'high' | 'emergency';
type UtilityType = 'Electric' | 'Water' | 'Gas' | 'Internet' | 'Trash';
type ProjectStatus = 'planning' | 'in-progress' | 'complete';

interface MaintenanceTask { id: string; title: string; room: Room; urgency: Urgency; description: string; estimated_cost: number; due_date: string; completed: boolean; }
interface UtilityBill { id: string; provider: string; type: UtilityType; amount: number; due_date: string; paid: boolean; }
interface RoommateTask { id: string; title: string; assignee: string; recurring_schedule: string; completed: boolean; }
interface HomeProject { id: string; title: string; description: string; budget: number; spent: number; progress: number; status: ProjectStatus; materials: string[]; }

const TABS: Tab[] = ['dashboard', 'maintenance', 'utilities', 'roommates', 'projects'];
const ROOMS: Room[] = ['Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Garage', 'Yard'];
const URGENCIES: Urgency[] = ['low', 'medium', 'high', 'emergency'];
const UTILITY_TYPES: UtilityType[] = ['Electric', 'Water', 'Gas', 'Internet', 'Trash'];
const URGENCY_STYLES: Record<Urgency, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const UTIL_ICON: Record<string, string> = { Electric: '⚡', Water: '💧', Gas: '🔥', Internet: '🌐', Trash: '🗑️' };

export default function MiHomePage() {
  const { user } = useAppStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);
  const [utilities, setUtilities] = useState<UtilityBill[]>([]);
  const [roommates, setRoommates] = useState<RoommateTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [roomFilter, setRoomFilter] = useState<Room | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'all'>('all');
  // Form state
  const [mTitle, setMTitle] = useState(''); const [mRoom, setMRoom] = useState<Room>('Kitchen');
  const [mUrgency, setMUrgency] = useState<Urgency>('low'); const [mDesc, setMDesc] = useState('');
  const [mCost, setMCost] = useState(''); const [mDue, setMDue] = useState('');
  const [uProvider, setUProvider] = useState(''); const [uType, setUType] = useState<UtilityType>('Electric');
  const [uAmount, setUAmount] = useState(''); const [uDue, setUDue] = useState('');
  const [rTitle, setRTitle] = useState(''); const [rAssignee, setRAssignee] = useState('');
  const [rSchedule, setRSchedule] = useState('weekly');
  const [pTitle, setPTitle] = useState(''); const [pDesc, setPDesc] = useState(''); const [pBudget, setPBudget] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    const [mRes, uRes, rRes, pRes] = await Promise.all([
      supabase.from('home_maintenance').select('*').eq('user_id', user?.id || '').order('due_date'),
      supabase.from('home_utilities').select('*').eq('user_id', user?.id || '').order('due_date'),
      supabase.from('home_roommates').select('*').eq('user_id', user?.id || ''),
      supabase.from('home_projects').select('*').eq('user_id', user?.id || ''),
    ]);
    if (mRes.data) setMaintenance(mRes.data);
    if (uRes.data) setUtilities(uRes.data);
    if (rRes.data) setRoommates(rRes.data);
    if (pRes.data) setProjects(pRes.data);
    setLoading(false);
  }

  async function addMaintenance() {
    if (!mTitle.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from('home_maintenance').insert({
      user_id: user?.id, title: mTitle, room: mRoom, urgency: mUrgency,
      description: mDesc, estimated_cost: parseFloat(mCost) || 0, due_date: mDue, completed: false,
    });
    if (error) { toast.error('Failed to add task'); return; }
    toast.success('Maintenance task added');
    setMTitle(''); setMDesc(''); setMCost(''); setMDue(''); setShowForm(false); fetchData();
  }

  async function completeMaintenance(id: string) {
    const supabase = createClient();
    await supabase.from('home_maintenance').update({ completed: true }).eq('id', id);
    toast.success('Task completed'); fetchData();
  }

  async function addUtility() {
    if (!uProvider.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from('home_utilities').insert({
      user_id: user?.id, provider: uProvider, type: uType, amount: parseFloat(uAmount) || 0, due_date: uDue, paid: false,
    });
    if (error) { toast.error('Failed to add bill'); return; }
    toast.success('Utility bill added');
    setUProvider(''); setUAmount(''); setUDue(''); setShowForm(false); fetchData();
  }

  async function markPaid(id: string) {
    const supabase = createClient();
    await supabase.from('home_utilities').update({ paid: true }).eq('id', id);
    toast.success('Marked as paid'); fetchData();
  }

  async function addRoommateTask() {
    if (!rTitle.trim() || !rAssignee.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from('home_roommates').insert({
      user_id: user?.id, title: rTitle, assignee: rAssignee, recurring_schedule: rSchedule, completed: false,
    });
    if (error) { toast.error('Failed to add task'); return; }
    toast.success('Roommate task added'); setRTitle(''); setRAssignee(''); setShowForm(false); fetchData();
  }

  async function addProject() {
    if (!pTitle.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from('home_projects').insert({
      user_id: user?.id, title: pTitle, description: pDesc,
      budget: parseFloat(pBudget) || 0, spent: 0, progress: 0, status: 'planning', materials: [],
    });
    if (error) { toast.error('Failed to add project'); return; }
    toast.success('Project created'); setPTitle(''); setPDesc(''); setPBudget(''); setShowForm(false); fetchData();
  }

  const filteredMaintenance = maintenance.filter(t => (roomFilter === 'all' || t.room === roomFilter) && (urgencyFilter === 'all' || t.urgency === urgencyFilter));
  const unpaidBills = utilities.filter(u => !u.paid);
  const pendingTasks = maintenance.filter(m => !m.completed);
  const activeProjects = projects.filter(p => p.status !== 'complete');

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiHome</h1>
          <p className="text-xs text-gray-500">Household management</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-teal text-xs">{showForm ? 'Cancel' : '+ Add'}</button>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }}
            className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all whitespace-nowrap',
              tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="card p-3 text-center"><p className="text-lg font-bold text-orange-600">{pendingTasks.length}</p><p className="text-[10px] text-gray-500">Maintenance Tasks</p></div>
            <div className="card p-3 text-center"><p className="text-lg font-bold text-red-600">${unpaidBills.reduce((s, b) => s + b.amount, 0).toFixed(0)}</p><p className="text-[10px] text-gray-500">Bills Due</p></div>
            <div className="card p-3 text-center"><p className="text-lg font-bold text-teal-600">{roommates.filter(r => !r.completed).length}</p><p className="text-[10px] text-gray-500">Roommate Tasks</p></div>
            <div className="card p-3 text-center"><p className="text-lg font-bold text-purple-600">{activeProjects.length}</p><p className="text-[10px] text-gray-500">Active Projects</p></div>
          </div>
          {pendingTasks.slice(0, 3).map(t => (
            <div key={t.id} className="card flex items-center gap-3">
              <span className={cn('w-2 h-2 rounded-full', t.urgency === 'emergency' ? 'bg-red-500' : t.urgency === 'high' ? 'bg-orange-500' : 'bg-blue-500')} />
              <div className="flex-1"><p className="text-sm text-harbor-800 dark:text-white">{t.title}</p><p className="text-[10px] text-gray-500">{t.room} · Due {t.due_date}</p></div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', URGENCY_STYLES[t.urgency])}>{t.urgency}</span>
            </div>
          ))}
          {unpaidBills.slice(0, 3).map(b => (
            <div key={b.id} className="card flex items-center gap-3">
              <span className="text-lg">{UTIL_ICON[b.type]}</span>
              <div className="flex-1"><p className="text-sm text-harbor-800 dark:text-white">{b.provider}</p><p className="text-[10px] text-gray-500">{b.type} · Due {b.due_date}</p></div>
              <p className="text-sm font-bold text-harbor-800 dark:text-white">${b.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value as Room | 'all')} className="input-field text-xs flex-1">
              <option value="all">All Rooms</option>
              {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value as Urgency | 'all')} className="input-field text-xs flex-1">
              <option value="all">All Urgency</option>
              {URGENCIES.map(u => <option key={u} value={u} className="capitalize">{u}</option>)}
            </select>
          </div>
          {showForm && (
            <div className="card space-y-2 border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Maintenance Task</h3>
              <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Task title" className="input-field" />
              <select value={mRoom} onChange={e => setMRoom(e.target.value as Room)} className="input-field">{ROOMS.map(r => <option key={r} value={r}>{r}</option>)}</select>
              <select value={mUrgency} onChange={e => setMUrgency(e.target.value as Urgency)} className="input-field">{URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}</select>
              <textarea value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Description" className="input-field" rows={2} />
              <input value={mCost} onChange={e => setMCost(e.target.value)} placeholder="Estimated cost ($)" type="number" className="input-field" />
              <input value={mDue} onChange={e => setMDue(e.target.value)} type="date" className="input-field" />
              <button onClick={addMaintenance} className="btn-teal w-full">Add Task</button>
            </div>
          )}
          {filteredMaintenance.filter(m => !m.completed).map(t => (
            <div key={t.id} className="card flex items-center gap-3">
              <button onClick={() => completeMaintenance(t.id)} className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-teal-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white">{t.title}</p>
                <p className="text-[10px] text-gray-500">{t.room} · ${t.estimated_cost} · Due {t.due_date}</p>
              </div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', URGENCY_STYLES[t.urgency])}>{t.urgency}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'utilities' && (
        <div className="space-y-3">
          {showForm && (
            <div className="card space-y-2 border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Utility Bill</h3>
              <input value={uProvider} onChange={e => setUProvider(e.target.value)} placeholder="Provider name" className="input-field" />
              <select value={uType} onChange={e => setUType(e.target.value as UtilityType)} className="input-field">{UTILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <input value={uAmount} onChange={e => setUAmount(e.target.value)} placeholder="Amount ($)" type="number" className="input-field" />
              <input value={uDue} onChange={e => setUDue(e.target.value)} type="date" className="input-field" />
              <button onClick={addUtility} className="btn-teal w-full">Add Bill</button>
            </div>
          )}
          {utilities.map(b => (
            <div key={b.id} className="card flex items-center gap-3">
              <span className="text-lg">{UTIL_ICON[b.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white">{b.provider}</p>
                <p className="text-[10px] text-gray-500">{b.type} · Due {b.due_date}</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <p className="text-sm font-bold text-harbor-800 dark:text-white">${b.amount.toFixed(2)}</p>
                {!b.paid ? <button onClick={() => markPaid(b.id)} className="text-[10px] px-2 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200">Pay</button>
                  : <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded">Paid</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'roommates' && (
        <div className="space-y-3">
          {showForm && (
            <div className="card space-y-2 border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Roommate Task</h3>
              <input value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="Task (e.g., Take out trash)" className="input-field" />
              <input value={rAssignee} onChange={e => setRAssignee(e.target.value)} placeholder="Assignee name" className="input-field" />
              <select value={rSchedule} onChange={e => setRSchedule(e.target.value)} className="input-field">
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option>
              </select>
              <button onClick={addRoommateTask} className="btn-teal w-full">Add Task</button>
            </div>
          )}
          {roommates.map(r => (
            <div key={r.id} className="card flex items-center gap-3">
              <span className="text-lg">👤</span>
              <div className="flex-1 min-w-0"><p className="text-sm text-harbor-800 dark:text-white">{r.title}</p><p className="text-[10px] text-gray-500">Assigned: {r.assignee} · {r.recurring_schedule}</p></div>
              <span className={cn('text-[10px] px-2 py-1 rounded', r.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{r.completed ? 'Done' : 'Pending'}</span>
            </div>
          ))}
          {roommates.length === 0 && !showForm && <div className="card text-center py-8"><p className="text-2xl mb-2">👥</p><p className="text-sm text-gray-500">No roommate tasks yet. Add one to get started!</p></div>}
        </div>
      )}

      {tab === 'projects' && (
        <div className="space-y-3">
          {showForm && (
            <div className="card space-y-2 border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">New Project</h3>
              <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Project title" className="input-field" />
              <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Description" className="input-field" rows={2} />
              <input value={pBudget} onChange={e => setPBudget(e.target.value)} placeholder="Budget ($)" type="number" className="input-field" />
              <button onClick={addProject} className="btn-teal w-full">Create Project</button>
            </div>
          )}
          {projects.map(p => (
            <div key={p.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-harbor-800 dark:text-white">{p.title}</p>
                <span className={cn('text-[10px] px-2 py-1 rounded capitalize', p.status === 'complete' ? 'bg-green-100 text-green-700' : p.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>{p.status}</span>
              </div>
              <p className="text-xs text-gray-500">{p.description}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${p.progress}%` }} /></div>
              <div className="flex justify-between text-[10px] text-gray-500"><span>{p.progress}% complete</span><span>${p.spent} / ${p.budget} budget</span></div>
              {p.materials.length > 0 && <div className="flex flex-wrap gap-1">{p.materials.map((m, i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{m}</span>)}</div>}
            </div>
          ))}
          {projects.length === 0 && !showForm && <div className="card text-center py-8"><p className="text-2xl mb-2">🏗️</p><p className="text-sm text-gray-500">No projects yet. Start your first home improvement!</p></div>}
        </div>
      )}

      {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
}
