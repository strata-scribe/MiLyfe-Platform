'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface Resource {
  id: string; title: string; category: string; description: string;
  address: string; hours: string; walk_in: boolean; has_availability: boolean;
  accepts_mly: boolean;
}
interface StorageSpot {
  id: string; business_name: string; address: string; available_lockers: number;
  hours: string; fee_mly: number; description: string;
}
interface MailService {
  id: string; provider_name: string; address: string; description: string;
  accepts_new: boolean; monthly_fee_mly: number;
}
interface IncomeOption {
  id: string; title: string; description: string; category: string;
  mly_range: string; requires_address: boolean;
}
interface HousingPlan {
  id: string; title: string; type: string; rent_range: string;
  location: string; roommates_needed: number; description: string;
}

type Tab = 'resources' | 'storage' | 'mail' | 'income' | 'plan';

const TABS: { key: Tab; label: string }[] = [
  { key: 'resources', label: 'Resources' },
  { key: 'storage', label: 'Day Storage' },
  { key: 'mail', label: 'Mail' },
  { key: 'income', label: 'Income' },
  { key: 'plan', label: 'My Plan' },
];

const RESOURCE_CATEGORIES = ['shelters', 'meals', 'showers', 'clothing', 'hygiene', 'medical'];

/* ─── Component ─── */
export default function ShelterPage() {
  const [tab, setTab] = useState<Tab>('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [storage, setStorage] = useState<StorageSpot[]>([]);
  const [mailServices, setMailServices] = useState<MailService[]>([]);
  const [incomeOptions, setIncomeOptions] = useState<IncomeOption[]>([]);
  const [housingPlans, setHousingPlans] = useState<HousingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityOnly, setAvailabilityOnly] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [resResult, storageResult, mailResult, incomeResult, planResult] = await Promise.all([
      supabase.from('shelter_resources').select('*').order('has_availability', { ascending: false }),
      supabase.from('shelter_storage_spots').select('*').gt('available_lockers', 0),
      supabase.from('shelter_mail_services').select('*'),
      supabase.from('shelter_income_options').select('*'),
      supabase.from('shelter_housing_plans').select('*'),
    ]);
    if (resResult.data) setResources(resResult.data);
    if (storageResult.data) setStorage(storageResult.data);
    if (mailResult.data) setMailServices(mailResult.data);
    if (incomeResult.data) setIncomeOptions(incomeResult.data);
    if (planResult.data) setHousingPlans(planResult.data);
    setLoading(false);
  }

  async function requestStorage(spotId: string) {
    if (!user) { toast.error('Sign in to request a spot'); return; }
    const { error } = await supabase.from('shelter_storage_requests').insert({ user_id: user.id, spot_id: spotId });
    if (error) { toast.error('Request failed — try again'); return; }
    toast.success('Storage spot requested! You will be notified when confirmed.');
  }

  async function requestMailbox(serviceId: string) {
    if (!user) { toast.error('Sign in to request a mailbox'); return; }
    const { error } = await supabase.from('shelter_mail_requests').insert({ user_id: user.id, service_id: serviceId });
    if (error) { toast.error('Request failed — try again'); return; }
    toast.success('Mailbox requested! Check notifications for your address.');
  }

  const filteredResources = resources.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || r.category.toLowerCase() === categoryFilter;
    const matchAvail = !availabilityOnly || r.has_availability;
    return matchSearch && matchCat && matchAvail;
  });

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiShelter</h1>
        <p className="text-xs text-gray-500 mt-0.5">Resources, storage, mail, and income — no address required.</p>
      </div>

      {/* No phone number notice */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <p className="text-[10px] text-blue-600 dark:text-blue-300">📱 Everything here works with email only — no phone number needed.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Resources ─── */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <input type="text" placeholder="Search shelters, meals, showers..." value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full" />
          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto flex-1 pb-1">
              <button onClick={() => setCategoryFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', categoryFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
              {RESOURCE_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', categoryFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={availabilityOnly} onChange={e => setAvailabilityOnly(e.target.checked)} className="rounded" />
            Show available only
          </label>
          {loading ? <Skeleton /> : filteredResources.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No resources found</p></div>
          ) : filteredResources.map(res => (
            <div key={res.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                {res.has_availability && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Open</span>}
                {!res.has_availability && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Full</span>}
                {res.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{res.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                {res.address && <span>📍 {res.address}</span>}
                {res.hours && <span>🕐 {res.hours}</span>}
                {res.walk_in && <span className="text-green-600">Walk-in OK</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Day Storage ─── */}
      {tab === 'storage' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Community businesses offering safe locker space during the day. Keep your belongings secure while you handle business.</p>
          </div>
          {loading ? <Skeleton /> : storage.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm text-gray-500">No storage spots available right now</p>
              <p className="text-xs text-gray-400 mt-1">Check back — businesses add spots regularly</p>
            </div>
          ) : storage.map(spot => (
            <div key={spot.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{spot.business_name}</p>
                  <p className="text-xs text-gray-500">{spot.description}</p>
                </div>
                <button onClick={() => requestStorage(spot.id)} className="btn-teal text-xs">Request</button>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>📍 {spot.address}</span>
                <span>🕐 {spot.hours}</span>
                <span className="text-green-600">{spot.available_lockers} available</span>
                {spot.fee_mly > 0 && <span className="text-yellow-600">{spot.fee_mly} $MLY/day</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Mail ─── */}
      {tab === 'mail' && (
        <div className="space-y-3">
          <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Community Mailbox Service</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Get a real mailing address for job applications, benefits, and official documents — no home address needed.</p>
          </div>
          {loading ? <Skeleton /> : mailServices.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">📬</p>
              <p className="text-sm text-gray-500">No mail services available yet</p>
            </div>
          ) : mailServices.map(svc => (
            <div key={svc.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{svc.provider_name}</p>
                  <p className="text-xs text-gray-500">{svc.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1">📍 {svc.address}</p>
                </div>
                <button onClick={() => requestMailbox(svc.id)} disabled={!svc.accepts_new} className={cn('btn-teal text-xs', !svc.accepts_new && 'opacity-50 cursor-not-allowed')}>
                  {svc.accepts_new ? 'Request' : 'Full'}
                </button>
              </div>
              {svc.monthly_fee_mly > 0 && <p className="text-[10px] text-yellow-600">{svc.monthly_fee_mly} $MLY/month</p>}
            </div>
          ))}
        </div>
      )}

      {/* ─── Income ─── */}
      {tab === 'income' && (
        <div className="space-y-3">
          <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Earn Without an Address</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Ways to earn $MLY that don&apos;t require a home address, bank account, or phone number.</p>
          </div>
          {loading ? <Skeleton /> : incomeOptions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">💰</p>
              <p className="text-sm text-gray-500">Income options coming soon</p>
            </div>
          ) : incomeOptions.map(opt => (
            <div key={opt.id} className="card space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{opt.title}</p>
                {!opt.requires_address && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">No address needed</span>}
              </div>
              <p className="text-xs text-gray-500">{opt.description}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="capitalize">{opt.category}</span>
                <span className="text-teal-600 font-medium">{opt.mly_range} $MLY</span>
              </div>
            </div>
          ))}
          <div className="card">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">Quick Earn Ideas</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-500">
              <li>• Guild tasks — community work paid in $MLY</li>
              <li>• Content creation — share your story on MiMedia</li>
              <li>• Sell handmade items on MiShop</li>
              <li>• Community surveys and feedback</li>
              <li>• Peer support volunteering (earns $MLY bonuses)</li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── My Plan ─── */}
      {tab === 'plan' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Transition Housing</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Community housing options, roommate matching, and rent-sharing to get you stable.</p>
          </div>
          {loading ? <Skeleton /> : housingPlans.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🏠</p>
              <p className="text-sm text-gray-500">No transition housing listed yet</p>
              <p className="text-xs text-gray-400 mt-1">Community members will post options soon</p>
            </div>
          ) : housingPlans.map(plan => (
            <div key={plan.id} className="card space-y-1">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{plan.title}</p>
              <p className="text-xs text-gray-500">{plan.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>📍 {plan.location}</span>
                <span>💲 {plan.rent_range}/mo</span>
                <span>{plan.type}</span>
                {plan.roommates_needed > 0 && <span className="text-teal-600">{plan.roommates_needed} roommate(s) needed</span>}
              </div>
            </div>
          ))}
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Save $MLY toward housing deposits. Some community landlords accept $MLY for first month&apos;s rent. Your MiShelter activity builds your community trust score.</p>
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Emergency</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-red-600 dark:text-red-300">
          <span>Shelter Hotline: <strong>211</strong></span>
          <span>Crisis: <strong>988</strong></span>
          <span>Domestic Violence: <strong>1-800-799-7233</strong></span>
        </div>
      </div>
    </div>
  );
}
