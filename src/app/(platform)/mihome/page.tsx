'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Home {
  id: string;
  owner_id: string;
  name: string;
  type: 'apartment' | 'house' | 'condo' | 'room' | 'studio';
  address: string;
  members: number;
  monthly_budget: number;
  created_at: string;
}

interface MaintenanceTask {
  id: string;
  home_id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface Utility {
  id: string;
  home_id: string;
  type: string;
  provider: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'due' | 'overdue';
  month: string;
}

type MiHomeTab = 'dashboard' | 'maintenance' | 'utilities' | 'roommates' | 'projects';

const HOME_APPS = [
  { href: '/mihome/smart', icon: '🏠', label: 'Smart Home', desc: 'Connected devices & automation' },
  { href: '/mihome/maintenance', icon: '🔧', label: 'Maintenance', desc: 'Repairs, tasks & upkeep' },
  { href: '/mihome/household', icon: '📋', label: 'Household', desc: 'Chores, inventory & shopping' },
  { href: '/mihome/roommates', icon: '👥', label: 'Roommates', desc: 'Coordination & splitting' },
  { href: '/mihome/security', icon: '🔒', label: 'Security', desc: 'Cameras, locks & alerts' },
  { href: '/mihome/utilities', icon: '⚡', label: 'Utilities', desc: 'Bills, usage & tracking' },
  { href: '/mihome/projects', icon: '🏗️', label: 'Projects', desc: 'Home improvement & DIY' },
  { href: '/mihome/garden', icon: '🌱', label: 'Garden', desc: 'Plants, yard & schedules' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function MiHomePage() {
  const [tab, setTab] = useState<MiHomeTab>('dashboard');
  const [homes, setHomes] = useState<Home[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddHome, setShowAddHome] = useState(false);

  // Add home form
  const [homeName, setHomeName] = useState('');
  const [homeType, setHomeType] = useState<Home['type']>('apartment');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeBudget, setHomeBudget] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const { data: h } = await supabase
      .from('mihome_homes')
      .select('*')
      .eq('owner_id', user?.id || '')
      .order('created_at', { ascending: false });
    if (h) setHomes(h);

    const { data: t } = await supabase
      .from('mihome_maintenance')
      .select('*')
      .neq('status', 'completed')
      .order('priority', { ascending: true })
      .limit(10);
    if (t) setTasks(t);

    const { data: u } = await supabase
      .from('mihome_utilities')
      .select('*')
      .in('status', ['due', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(10);
    if (u) setUtilities(u);

    setLoading(false);
  }

  async function addHome() {
    if (!user || !homeName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    await supabase.from('mihome_homes').insert({
      owner_id: user.id,
      name: homeName.trim(),
      type: homeType,
      address: homeAddress.trim(),
      monthly_budget: parseFloat(homeBudget) || 0,
      members: 1,
    });
    setHomeName(''); setHomeAddress(''); setHomeBudget('');
    setShowAddHome(false);
    setCreating(false);
    loadData();
  }

  const totalDue = utilities.reduce((sum, u) => sum + u.amount, 0);
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiHome</h1>
          <p className="text-xs text-gray-500">Home & living management</p>
        </div>
        {user && (
          <button onClick={() => setShowAddHome(!showAddHome)} className="btn-teal text-xs">
            + Add Home
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{homes.length}</p>
            <p className="text-[10px] text-gray-500">Properties</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-orange-600">{urgentTasks}</p>
            <p className="text-[10px] text-gray-500">Urgent Tasks</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-mly-600">${totalDue.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500">Bills Due</p>
          </div>
        </div>
      )}

      {/* Add Home Form */}
      {showAddHome && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Add a Home</h3>
          <input value={homeName} onChange={e => setHomeName(e.target.value)} placeholder="Home name (e.g., My Apartment)" className="input-field" />
          <select value={homeType} onChange={e => setHomeType(e.target.value as Home['type'])} className="input-field">
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="room">Room</option>
            <option value="studio">Studio</option>
          </select>
          <input value={homeAddress} onChange={e => setHomeAddress(e.target.value)} placeholder="Address" className="input-field" />
          <input value={homeBudget} onChange={e => setHomeBudget(e.target.value)} placeholder="Monthly budget ($MLY)" className="input-field" type="number" />
          <button onClick={addHome} disabled={!homeName.trim() || creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Adding...' : 'Add Home'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['dashboard', 'maintenance', 'utilities', 'roommates', 'projects'] as MiHomeTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all',
              tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* App Grid */}
          <div className="grid grid-cols-2 gap-2">
            {HOME_APPS.map(app => (
              <Link key={app.href} href={app.href} className="card flex items-start gap-3 hover:shadow-md transition-shadow p-3">
                <span className="text-2xl">{app.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{app.label}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{app.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* My Homes */}
          {homes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">My Homes</h3>
              {homes.map(home => (
                <div key={home.id} className="card flex items-center gap-3">
                  <span className="text-2xl">{home.type === 'house' ? '🏡' : home.type === 'condo' ? '🏢' : '🏠'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{home.name}</p>
                    <p className="text-xs text-gray-500 truncate">{home.address || 'No address set'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-mly-600 font-bold">${home.monthly_budget}/mo</p>
                    <p className="text-[10px] text-gray-400">{home.members} member{home.members !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {tab === 'maintenance' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            tasks.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-500">No pending maintenance tasks</p>
                <Link href="/mihome/maintenance" className="text-xs text-teal-600 hover:underline mt-2 inline-block">Add a task →</Link>
              </div>
            ) : tasks.map(task => (
              <div key={task.id} className="card flex items-center gap-3">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                    {task.due_date && <span className="text-[10px] text-gray-400">Due {new Date(task.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={cn('text-[10px] px-2 py-1 rounded capitalize', task.status === 'in_progress' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>{task.status.replace('_', ' ')}</span>
              </div>
            ))
          }
          <Link href="/mihome/maintenance" className="card text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors">
            Manage All Tasks →
          </Link>
        </div>
      )}

      {/* Utilities Tab */}
      {tab === 'utilities' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            utilities.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">💡</p>
                <p className="text-sm text-gray-500">No bills due right now</p>
                <Link href="/mihome/utilities" className="text-xs text-teal-600 hover:underline mt-2 inline-block">Track a utility →</Link>
              </div>
            ) : utilities.map(bill => (
              <div key={bill.id} className="card flex items-center gap-3">
                <span className="text-xl">{bill.type === 'electric' ? '⚡' : bill.type === 'water' ? '💧' : bill.type === 'internet' ? '🌐' : bill.type === 'gas' ? '🔥' : '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{bill.type}</p>
                  <p className="text-xs text-gray-500">{bill.provider} · Due {new Date(bill.due_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">${bill.amount.toFixed(2)}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', bill.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{bill.status}</span>
                </div>
              </div>
            ))
          }
          <Link href="/mihome/utilities" className="card text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors">
            Manage All Utilities →
          </Link>
        </div>
      )}

      {/* Roommates Tab */}
      {tab === 'roommates' && (
        <div className="space-y-3">
          <div className="card text-center py-8">
            <p className="text-2xl mb-2">👥</p>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Roommate Hub</p>
            <p className="text-xs text-gray-500 mt-1">Manage shared spaces, split expenses, coordinate schedules</p>
            <Link href="/mihome/roommates" className="btn-teal text-xs mt-4 inline-block">Set Up Household →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="card p-3 text-center">
              <p className="text-lg">💸</p>
              <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">Split Bills</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg">📅</p>
              <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">Chore Schedule</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg">🛒</p>
              <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">Shared Lists</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg">📢</p>
              <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">House Rules</p>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {tab === 'projects' && (
        <div className="space-y-3">
          <div className="card text-center py-8">
            <p className="text-2xl mb-2">🏗️</p>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Home Improvement</p>
            <p className="text-xs text-gray-500 mt-1">Track DIY projects, budgets, and progress</p>
            <Link href="/mihome/projects" className="btn-teal text-xs mt-4 inline-block">Start a Project →</Link>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: '🎨', label: 'Paint & Decor', desc: 'Walls, trim, interior design' },
              { icon: '🪴', label: 'Landscaping', desc: 'Yard, garden, outdoor spaces' },
              { icon: '🔌', label: 'Electrical', desc: 'Outlets, lighting, smart wiring' },
              { icon: '🚿', label: 'Plumbing', desc: 'Fixtures, pipes, water heater' },
            ].map(p => (
              <div key={p.label} className="card flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
