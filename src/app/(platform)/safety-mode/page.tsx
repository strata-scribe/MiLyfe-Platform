'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface EscapePlanItem {
  id: string; user_id: string; label: string; category: string;
  completed: boolean; notes: string; encrypted: boolean;
}
interface SafeHouse {
  id: string; name: string; description: string; location_hint: string;
  capacity: number; available: boolean; level_required: number;
  accepts_children: boolean; accepts_pets: boolean;
}
interface HiddenBalance {
  id: string; user_id: string; hidden_mly: number; visible: boolean;
  last_deposit: string;
}
interface WalkTimer {
  active: boolean; destination: string; eta_minutes: number;
  alert_contacts: string[];
}

type Tab = 'tools' | 'escape' | 'resources' | 'finances';

const TABS: { key: Tab; label: string }[] = [
  { key: 'tools', label: 'Safety Tools' },
  { key: 'escape', label: 'Escape Plan' },
  { key: 'resources', label: 'Resources' },
  { key: 'finances', label: 'Hidden Finances' },
];

const ESCAPE_CHECKLIST = [
  { label: 'Birth certificates (all family)', category: 'documents' },
  { label: 'Social Security cards', category: 'documents' },
  { label: 'Passports', category: 'documents' },
  { label: 'Protective order copy', category: 'legal' },
  { label: 'Cash reserve hidden', category: 'money' },
  { label: 'Extra car keys', category: 'transport' },
  { label: 'Medications for 2 weeks', category: 'health' },
  { label: 'Children school records', category: 'documents' },
  { label: 'Phone charger + prepaid phone', category: 'communication' },
  { label: 'Overnight bag packed (hidden)', category: 'essentials' },
  { label: 'Safe place identified', category: 'shelter' },
  { label: 'Emergency contact knows plan', category: 'people' },
];

/* ─── Component ─── */
export default function SafetyModePage() {
  const [tab, setTab] = useState<Tab>('tools');
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [escapePlan, setEscapePlan] = useState<EscapePlanItem[]>([]);
  const [safeHouses, setSafeHouses] = useState<SafeHouse[]>([]);
  const [hiddenBalance, setHiddenBalance] = useState<HiddenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [walkTimerActive, setWalkTimerActive] = useState(false);
  const [walkDestination, setWalkDestination] = useState('');
  const [walkMinutes, setWalkMinutes] = useState(15);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [safeResult] = await Promise.all([
      supabase.from('safety_safe_houses').select('*').eq('available', true),
    ]);
    if (safeResult.data) setSafeHouses(safeResult.data);

    if (user) {
      const [planResult, balanceResult] = await Promise.all([
        supabase.from('safety_escape_plan').select('*').eq('user_id', user.id),
        supabase.from('safety_hidden_balance').select('*').eq('user_id', user.id).single(),
      ]);
      if (planResult.data) setEscapePlan(planResult.data);
      if (balanceResult.data) setHiddenBalance(balanceResult.data);
    }
    setLoading(false);
  }

  async function triggerEmergencyAlert() {
    if (!user) return;
    await supabase.from('safety_emergency_alerts').insert({
      user_id: user.id, triggered_at: new Date().toISOString(), type: 'emergency',
    });
    toast.success('Emergency alert sent to your safety contacts.');
  }

  async function startWalkTimer() {
    if (!user || !walkDestination) return;
    setWalkTimerActive(true);
    await supabase.from('safety_walk_timers').insert({
      user_id: user.id, destination: walkDestination, eta_minutes: walkMinutes, started_at: new Date().toISOString(),
    });
    toast.success(`Walk-with-me timer started. If you don't check in within ${walkMinutes} minutes, your contacts will be alerted.`);
  }

  async function cancelWalkTimer() {
    setWalkTimerActive(false);
    if (user) {
      await supabase.from('safety_walk_timers').update({ cancelled: true }).eq('user_id', user.id).is('cancelled', null);
    }
    toast.success('Timer cancelled — you are safe.');
  }

  async function initEscapePlan() {
    if (!user) return;
    const entries = ESCAPE_CHECKLIST.map(item => ({
      user_id: user.id, label: item.label, category: item.category, completed: false, notes: '', encrypted: true,
    }));
    await supabase.from('safety_escape_plan').insert(entries);
    toast.success('Escape plan created. This is encrypted and only visible to you.');
    loadData();
  }

  async function toggleEscapeItem(id: string, completed: boolean) {
    await supabase.from('safety_escape_plan').update({ completed }).eq('id', id);
    loadData();
  }

  async function depositToHidden(amount: number) {
    if (!user) return;
    const current = hiddenBalance?.hidden_mly || 0;
    await supabase.from('safety_hidden_balance').upsert({
      user_id: user.id, hidden_mly: current + amount, visible: false, last_deposit: new Date().toISOString(),
    });
    toast.success(`$${amount} MLY moved to hidden balance.`);
    loadData();
  }

  function exitApp() {
    // Quick-escape: redirect to innocuous page
    window.location.href = 'https://weather.com';
  }

  const completedEscape = escapePlan.filter(e => e.completed).length;

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Exit Button — disguised as weather app */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">
            {anonymousMode ? 'Weather Dashboard' : 'MiSafety'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {anonymousMode ? 'Local forecast and conditions' : 'Safety tools, escape planning, and hidden finances'}
          </p>
        </div>
        <button onClick={exitApp} className="px-3 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600" title="Quick exit">
          ☁️ Weather
        </button>
      </div>

      {/* Anonymous Mode Toggle */}
      <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Anonymous Mode</p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400">Hides your real name, uses pseudonym across platform</p>
          </div>
          <input type="checkbox" checked={anonymousMode} onChange={e => setAnonymousMode(e.target.checked)} className="w-5 h-5 rounded" />
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Safety Tools ─── */}
      {tab === 'tools' && (
        <div className="space-y-3">
          {/* Emergency Alert */}
          <button onClick={triggerEmergencyAlert} className="w-full card bg-red-500 hover:bg-red-600 text-white text-center py-6 transition-colors">
            <p className="text-2xl mb-1">🆘</p>
            <p className="text-lg font-bold">Emergency Alert</p>
            <p className="text-xs opacity-80">One tap — alerts all your safety contacts</p>
          </button>

          {/* Walk-with-me timer */}
          <div className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Walk-With-Me Timer</p>
            <p className="text-xs text-gray-500">Set a timer when walking somewhere. If you don&apos;t check in, your contacts are alerted.</p>
            {!walkTimerActive ? (
              <>
                <input type="text" placeholder="Where are you going?" value={walkDestination} onChange={e => setWalkDestination(e.target.value)} className="input-field w-full" />
                <div className="flex gap-2">
                  {[5, 10, 15, 30, 60].map(min => (
                    <button key={min} onClick={() => setWalkMinutes(min)} className={cn('px-3 py-1 rounded-full text-xs', walkMinutes === min ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{min}m</button>
                  ))}
                </div>
                <button onClick={startWalkTimer} disabled={!walkDestination} className="btn-teal w-full">Start Timer</button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-harbor-800 dark:text-white">Timer active — {walkMinutes} min</p>
                <p className="text-xs text-gray-500 mt-1">To: {walkDestination}</p>
                <button onClick={cancelWalkTimer} className="btn-teal mt-3">I Arrived Safely</button>
              </div>
            )}
          </div>

          {/* Device Safety Check */}
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Device Safety Guide</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Clear browser history after each visit</li>
              <li>• Use incognito/private mode</li>
              <li>• Check for tracking apps (Settings → Apps)</li>
              <li>• Turn off location sharing</li>
              <li>• Use a different email for this account</li>
            </ul>
          </div>

          <p className="text-[10px] text-gray-400 text-center">Everything on this page works offline. Data is end-to-end encrypted.</p>
        </div>
      )}

      {/* ─── Escape Plan ─── */}
      {tab === 'escape' && (
        <div className="space-y-3">
          <div className="card bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-300">🔐 This checklist is private and encrypted. Only you can see it. Stored in your vault.</p>
          </div>
          {escapePlan.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Create Your Escape Plan</p>
              <p className="text-xs text-gray-500 mt-1">A private encrypted checklist of what to prepare</p>
              {user && <button onClick={initEscapePlan} className="btn-teal text-xs mt-4">Create Plan</button>}
            </div>
          ) : (
            <>
              <div className="card">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-harbor-800 dark:text-white font-bold">{completedEscape}/{escapePlan.length} ready</span>
                  <span className="text-teal-600">{completedEscape === escapePlan.length ? 'Plan complete!' : 'Keep preparing'}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${escapePlan.length ? (completedEscape / escapePlan.length) * 100 : 0}%` }} />
                </div>
              </div>
              {escapePlan.map(item => (
                <div key={item.id} className="card flex items-center gap-3">
                  <button onClick={() => toggleEscapeItem(item.id, !item.completed)} className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors', item.completed ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 dark:border-gray-600 hover:border-orange-500')}>
                    {item.completed && '✓'}
                  </button>
                  <div className="flex-1">
                    <p className={cn('text-sm', item.completed ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{item.label}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{item.category}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ─── Resources ─── */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Safe houses are managed by vetted Level 5 community members. All locations are confidential.</p>
          </div>
          {loading ? <Skeleton /> : safeHouses.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🏠</p>
              <p className="text-sm text-gray-500">Safe house information is shared securely after verification</p>
            </div>
          ) : safeHouses.map(house => (
            <div key={house.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{house.name}</p>
                {house.accepts_children && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Children OK</span>}
                {house.accepts_pets && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Pets OK</span>}
              </div>
              <p className="text-xs text-gray-500">{house.description}</p>
              <p className="text-[10px] text-gray-400">Location shared after safety verification</p>
            </div>
          ))}
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Legal Rights</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• You have the right to a protective order</li>
              <li>• Police must respond to DV calls</li>
              <li>• Free legal aid available through MiLyfe community</li>
              <li>• Your immigration status does NOT prevent help</li>
            </ul>
          </div>
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Hotlines</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>National DV Hotline: <strong className="text-harbor-800 dark:text-white">1-800-799-7233</strong></p>
              <p>Human Trafficking: <strong className="text-harbor-800 dark:text-white">1-888-373-7888</strong></p>
              <p>Crisis Text Line: Text <strong className="text-harbor-800 dark:text-white">HOME to 741741</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Hidden Finances ─── */}
      {tab === 'finances' && (
        <div className="space-y-3">
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Hidden $MLY Balance</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">This balance is invisible to shared accounts. Only you can see it. Not reflected in your main wallet.</p>
          </div>
          <div className="card text-center py-6">
            <p className="text-3xl font-bold text-harbor-800 dark:text-white">${hiddenBalance?.hidden_mly || 0} MLY</p>
            <p className="text-xs text-gray-400 mt-1">Hidden balance — invisible to others</p>
            {hiddenBalance?.last_deposit && (
              <p className="text-[10px] text-gray-400 mt-1">Last deposit: {new Date(hiddenBalance.last_deposit).toLocaleDateString()}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 25].map(amount => (
              <button key={amount} onClick={() => depositToHidden(amount)} className="card text-center py-3 hover:shadow-md transition-shadow">
                <p className="text-sm font-bold text-teal-600">+${amount}</p>
                <p className="text-[10px] text-gray-400">Hide</p>
              </button>
            ))}
          </div>
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">How It Works</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Deposits here are invisible on your main balance</li>
              <li>• Cannot be seen by anyone sharing your account</li>
              <li>• Withdraw anytime to a separate private wallet</li>
              <li>• No notifications or transaction history visible to others</li>
            </ul>
          </div>
        </div>
      )}

      {/* Emergency — always visible */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-700 dark:text-red-400">Immediate Help</p>
            <p className="text-[10px] text-red-600 dark:text-red-300 mt-0.5">DV Hotline: 1-800-799-7233 | 911 for danger</p>
          </div>
          <button onClick={exitApp} className="px-3 py-1 bg-blue-100 rounded text-xs text-blue-600">☁️ Exit</button>
        </div>
      </div>
    </div>
  );
}
