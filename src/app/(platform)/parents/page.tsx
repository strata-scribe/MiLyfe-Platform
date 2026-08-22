'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface ChildcareExchange {
  id: string; parent_name: string; description: string; availability: string;
  children_ages: string; location: string; mly_rate: number; verified: boolean;
}
interface CoParentMessage {
  id: string; from_user: string; to_user: string; content: string;
  timestamp: string; documented: boolean;
}
interface MealTrain {
  id: string; family_name: string; reason: string; start_date: string;
  end_date: string; meals_needed: number; meals_filled: number;
  dietary_notes: string; delivery_address: string;
}
interface Activity {
  id: string; title: string; instructor: string; category: string;
  age_range: string; schedule: string; location: string;
  mly_cost: number; free: boolean;
}
interface SupplyExchange {
  id: string; title: string; category: string; condition: string;
  age_range: string; offered_by: string; available: boolean;
}

type Tab = 'childcare' | 'coparent' | 'meals' | 'activities' | 'help';

const TABS: { key: Tab; label: string }[] = [
  { key: 'childcare', label: 'Childcare' },
  { key: 'coparent', label: 'Co-Parent' },
  { key: 'meals', label: 'Meals' },
  { key: 'activities', label: 'Activities' },
  { key: 'help', label: 'Help' },
];

const ACTIVITY_CATEGORIES = ['Music', 'Sports', 'Art', 'Coding', 'Tutoring', 'Dance', 'Outdoor'];

/* ─── Component ─── */
export default function ParentsPage() {
  const [tab, setTab] = useState<Tab>('childcare');
  const [childcare, setChildcare] = useState<ChildcareExchange[]>([]);
  const [mealTrains, setMealTrains] = useState<MealTrain[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [supplies, setSupplies] = useState<SupplyExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [ccResult, mealResult, actResult, supResult] = await Promise.all([
      supabase.from('parents_childcare_exchange').select('*').order('verified', { ascending: false }),
      supabase.from('parents_meal_trains').select('*').gte('end_date', new Date().toISOString().split('T')[0]),
      supabase.from('parents_activities').select('*'),
      supabase.from('parents_supply_exchange').select('*').eq('available', true),
    ]);
    if (ccResult.data) setChildcare(ccResult.data);
    if (mealResult.data) setMealTrains(mealResult.data);
    if (actResult.data) setActivities(actResult.data);
    if (supResult.data) setSupplies(supResult.data);
    setLoading(false);
  }

  async function requestChildcare(exchangeId: string) {
    if (!user) { toast.error('Sign in to request childcare'); return; }
    const { error } = await supabase.from('parents_childcare_requests').insert({ user_id: user.id, exchange_id: exchangeId });
    if (error) { toast.error('Request failed — try again'); return; }
    toast.success('Childcare request sent! The provider will confirm.');
  }

  async function joinMealTrain(trainId: string, mealType: string) {
    if (!user) { toast.error('Sign in to join'); return; }
    const { error } = await supabase.from('parents_meal_signups').insert({ user_id: user.id, train_id: trainId, meal_type: mealType });
    if (error) { toast.error('Could not sign up'); return; }
    toast.success('Signed up to deliver a meal! Thank you for helping a family.');
    loadData();
  }

  async function requestSupply(supplyId: string) {
    if (!user) { toast.error('Sign in to request'); return; }
    const { error } = await supabase.from('parents_supply_requests').insert({ user_id: user.id, supply_id: supplyId });
    if (error) { toast.error('Request failed'); return; }
    toast.success('Supply request sent!');
  }

  async function requestEmergencyChildcare() {
    if (!user) { toast.error('Sign in first'); return; }
    const { error } = await supabase.from('parents_emergency_childcare').insert({ user_id: user.id, requested_at: new Date().toISOString(), status: 'urgent' });
    if (error) { toast.error('Request failed'); return; }
    toast.success('Emergency childcare alert sent to nearby community members.');
  }

  const filteredActivities = activities.filter(a => activityFilter === 'all' || a.category.toLowerCase() === activityFilter.toLowerCase());

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiParents</h1>
        <p className="text-xs text-gray-500 mt-0.5">Childcare, co-parenting tools, meals, activities, and community support for single parents.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Childcare ─── */}
      {tab === 'childcare' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Community Childcare Exchange</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Swap hours with other parents, earn $MLY for watching kids, or request emergency coverage when you need it.</p>
          </div>
          {/* Emergency Childcare */}
          <button onClick={requestEmergencyChildcare} className="w-full card bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 text-center py-4 hover:shadow-md transition-shadow">
            <p className="text-lg">🆘</p>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Emergency Childcare</p>
            <p className="text-[10px] text-orange-600">Alert community members for immediate help</p>
          </button>
          {loading ? <Skeleton /> : childcare.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">👶</p>
              <p className="text-sm text-gray-500">No childcare exchanges posted yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to offer!</p>
            </div>
          ) : childcare.map(cc => (
            <div key={cc.id} className="card flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{cc.parent_name}</p>
                  {cc.verified && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Verified</span>}
                </div>
                <p className="text-xs text-gray-500">{cc.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>👶 Ages: {cc.children_ages}</span>
                  <span>📍 {cc.location}</span>
                  <span>🕐 {cc.availability}</span>
                </div>
                {cc.mly_rate > 0 && <p className="text-[10px] text-teal-600">{cc.mly_rate} $MLY/hour</p>}
              </div>
              <button onClick={() => requestChildcare(cc.id)} className="btn-teal text-xs">Request</button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Co-Parent ─── */}
      {tab === 'coparent' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Co-Parenting Tools</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Documented messaging (admissible in court), shared calendar, and expense splitting. Keep communication clear and recorded.</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="card flex items-center gap-3">
              <span className="text-xl">💬</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Documented Messaging</p>
                <p className="text-xs text-gray-400">All messages timestamped and admissible. Cannot be deleted by either party.</p>
              </div>
              <Link href="/connect" className="btn-teal text-xs">Open</Link>
            </div>
            <div className="card flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Shared Calendar</p>
                <p className="text-xs text-gray-400">Custody schedule, pickups, school events, appointments</p>
              </div>
              <Link href="/family" className="btn-teal text-xs">Open</Link>
            </div>
            <div className="card flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Expense Splitting</p>
                <p className="text-xs text-gray-400">Track shared expenses, receipts, child support documentation</p>
              </div>
              <Link href="/finance" className="btn-teal text-xs">Open</Link>
            </div>
          </div>
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300">📋 All co-parent communications are stored securely and can be exported for legal proceedings if needed.</p>
          </div>
        </div>
      )}

      {/* ─── Meals ─── */}
      {tab === 'meals' && (
        <div className="space-y-3">
          <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Meal Trains</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Sign up to deliver meals to families in crisis — new baby, illness, job loss, or just overwhelmed. Or request one when you need it.</p>
          </div>
          {loading ? <Skeleton /> : mealTrains.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🍲</p>
              <p className="text-sm text-gray-500">No active meal trains right now</p>
              <p className="text-xs text-gray-400 mt-1">Request one if your family needs support</p>
              <button className="btn-teal text-xs mt-3">Request Meal Train</button>
            </div>
          ) : mealTrains.map(train => (
            <div key={train.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{train.family_name} Family</p>
                  <p className="text-xs text-gray-500">{train.reason}</p>
                </div>
                <button onClick={() => joinMealTrain(train.id, 'dinner')} className="btn-teal text-xs">Sign Up</button>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>📅 {train.start_date} — {train.end_date}</span>
                <span className="text-teal-600">{train.meals_filled}/{train.meals_needed} meals filled</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${train.meals_needed ? (train.meals_filled / train.meals_needed) * 100 : 0}%` }} />
              </div>
              {train.dietary_notes && <p className="text-[10px] text-gray-400">🍽️ Dietary: {train.dietary_notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ─── Activities ─── */}
      {tab === 'activities' && (
        <div className="space-y-3">
          <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-300">Community members teaching kids music, sports, art, coding, and more — for $MLY or free.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActivityFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', activityFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {ACTIVITY_CATEGORIES.map(c => (
              <button key={c} onClick={() => setActivityFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', activityFilter.toLowerCase() === c.toLowerCase() ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredActivities.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No activities in this category yet</p></div>
          ) : filteredActivities.map(act => (
            <div key={act.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{act.title}</p>
                {act.free && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Free</span>}
                {!act.free && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">{act.mly_cost} $MLY</span>}
              </div>
              <p className="text-xs text-gray-500">Instructor: {act.instructor}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>👶 Ages {act.age_range}</span>
                <span>📅 {act.schedule}</span>
                <span>📍 {act.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Help ─── */}
      {tab === 'help' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">School supplies, transportation, respite care, and emergency resources — your community has your back.</p>
          </div>
          {/* Supply Exchange */}
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">School Supply Exchange</p>
            {supplies.length === 0 ? (
              <p className="text-xs text-gray-500">No supplies available right now</p>
            ) : supplies.slice(0, 5).map(sup => (
              <div key={sup.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                <div className="flex-1">
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">{sup.title}</p>
                  <p className="text-[10px] text-gray-400">{sup.condition} • Ages {sup.age_range}</p>
                </div>
                <button onClick={() => requestSupply(sup.id)} className="text-xs text-teal-600 hover:underline">Request</button>
              </div>
            ))}
          </div>
          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🚗', label: 'Carpool Match', desc: 'Find carpools for school' },
              { icon: '🛋️', label: 'Respite Care', desc: 'Take a break — someone watches your kids' },
              { icon: '💰', label: 'Rent Assistance', desc: 'Community emergency pool' },
              { icon: '⚖️', label: 'Child Support Nav', desc: 'Filing and enforcement help' },
            ].map(item => (
              <div key={item.label} className="card text-center p-3">
                <p className="text-xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Anti-Eviction Resources</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Know your rights: landlord must give 30-day notice</li>
              <li>• Community emergency rent fund available</li>
              <li>• Legal aid for eviction defense</li>
              <li>• Emergency housing placements for families</li>
            </ul>
          </div>
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Earn $MLY by providing childcare, teaching activities, or delivering meals. Spend on childcare, activities, or supplies for your family.</p>
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Emergency Resources</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-red-600 dark:text-red-300">
          <span>Childhelp: <strong>1-800-422-4453</strong></span>
          <span>Crisis: <strong>988</strong></span>
          <span>211: <strong>Housing/food/utilities</strong></span>
        </div>
      </div>
    </div>
  );
}
