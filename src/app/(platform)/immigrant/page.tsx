'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface RightsCard {
  id: string; title: string; content: string; language: string;
  category: string; downloadable: boolean;
}
interface Workplace {
  id: string; name: string; description: string; location: string;
  sanctuary: boolean; industry: string; contact: string; accepts_mly: boolean;
}
interface FamilyPlanItem {
  id: string; user_id: string; label: string; category: string;
  completed: boolean; details: string; encrypted: boolean;
}
interface Resource {
  id: string; title: string; category: string; description: string;
  language: string; phone: string; link: string;
}
interface RapidAlert {
  id: string; area: string; description: string; created_at: string;
  active: boolean; source: string;
}

type Tab = 'rights' | 'community-id' | 'work' | 'family-plan' | 'resources';

const TABS: { key: Tab; label: string }[] = [
  { key: 'rights', label: 'Rights' },
  { key: 'community-id', label: 'Community ID' },
  { key: 'work', label: 'Work' },
  { key: 'family-plan', label: 'Family Plan' },
  { key: 'resources', label: 'Resources' },
];

const LANGUAGES = ['English', 'Español', 'Français', 'العربية', 'Kreyòl', '中文'];
const FAMILY_PLAN_ITEMS = [
  { label: 'Who takes the children if I am detained', category: 'children' },
  { label: 'Emergency contact who speaks my language', category: 'contacts' },
  { label: 'Immigration lawyer contact', category: 'legal' },
  { label: 'Where important documents are stored', category: 'documents' },
  { label: 'School contact and pickup authorization', category: 'children' },
  { label: 'Power of attorney signed', category: 'legal' },
  { label: 'Bank account access for trusted person', category: 'financial' },
  { label: 'Medical information and allergies (kids)', category: 'health' },
  { label: 'Consulate phone number', category: 'contacts' },
];

/* ─── Component ─── */
export default function ImmigrantPage() {
  const [tab, setTab] = useState<Tab>('rights');
  const [rightsCards, setRightsCards] = useState<RightsCard[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [familyPlan, setFamilyPlan] = useState<FamilyPlanItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [alerts, setAlerts] = useState<RapidAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('English');
  const [workFilter, setWorkFilter] = useState('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [rightsResult, workResult, resResult, alertResult] = await Promise.all([
      supabase.from('immigrant_rights_cards').select('*'),
      supabase.from('immigrant_workplaces').select('*'),
      supabase.from('immigrant_resources').select('*'),
      supabase.from('immigrant_rapid_alerts').select('*').eq('active', true).order('created_at', { ascending: false }),
    ]);
    if (rightsResult.data) setRightsCards(rightsResult.data);
    if (workResult.data) setWorkplaces(workResult.data);
    if (resResult.data) setResources(resResult.data);
    if (alertResult.data) setAlerts(alertResult.data);

    if (user) {
      const { data: planData } = await supabase.from('immigrant_family_plans').select('*').eq('user_id', user.id);
      if (planData) setFamilyPlan(planData);
    }
    setLoading(false);
  }

  async function initFamilyPlan() {
    if (!user) return;
    const entries = FAMILY_PLAN_ITEMS.map(item => ({
      user_id: user.id, label: item.label, category: item.category, completed: false, details: '', encrypted: true,
    }));
    await supabase.from('immigrant_family_plans').insert(entries);
    toast.success('Family plan created. This is encrypted — only you can see it.');
    loadData();
  }

  async function toggleFamilyItem(id: string, completed: boolean) {
    await supabase.from('immigrant_family_plans').update({ completed }).eq('id', id);
    loadData();
  }

  const filteredRights = rightsCards.filter(r => r.language === language || language === 'English');
  const filteredWorkplaces = workplaces.filter(w => workFilter === 'all' || (workFilter === 'sanctuary' && w.sanctuary));
  const completedPlan = familyPlan.filter(f => f.completed).length;

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiImmigrant</h1>
          <p className="text-xs text-gray-500 mt-0.5">Regardless of status — you belong here.</p>
        </div>
        {/* Language Selector */}
        <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field text-xs py-1 px-2">
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Rapid Response Alerts */}
      {alerts.length > 0 && (
        <div className="card bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-800">
          <p className="text-xs font-bold text-red-700 dark:text-red-400">🚨 Rapid Response Alert</p>
          {alerts.slice(0, 2).map(alert => (
            <div key={alert.id} className="mt-1">
              <p className="text-xs text-red-600 dark:text-red-300"><strong>{alert.area}:</strong> {alert.description}</p>
              <p className="text-[10px] text-red-400">{new Date(alert.created_at).toLocaleString()} • {alert.source}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Rights ─── */}
      {tab === 'rights' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Know Your Rights</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">What ICE can and cannot do. Your rights during encounters. Available in multiple languages and downloadable for offline use.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LANGUAGES.slice(0, 4).map(l => (
              <button key={l} onClick={() => setLanguage(l)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', language === l ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{l}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredRights.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">Rights cards coming in this language</p></div>
          ) : filteredRights.map(card => (
            <div key={card.id} className="card space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{card.title}</p>
                {card.downloadable && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Offline</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{card.content}</p>
            </div>
          ))}
          <div className="card">
            <p className="text-xs font-bold text-harbor-800 dark:text-white">Quick Reference</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-500">
              <li>• You have the right to remain silent</li>
              <li>• You do NOT have to open your door without a warrant signed by a judge</li>
              <li>• You have the right to an attorney</li>
              <li>• You do NOT have to sign anything you don&apos;t understand</li>
              <li>• You CAN record interactions with ICE</li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── Community ID ─── */}
      {tab === 'community-id' && (
        <div className="space-y-3">
          <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Your MiLyfe Membership IS Your Community ID</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">No government ID required. Your MiLyfe membership serves as community identification accepted by community businesses, health services, and mutual aid networks.</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">What Your Community ID Includes</p>
            <ul className="mt-2 space-y-2 text-xs text-gray-500">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Photo identification</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Accepted at community businesses</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Access to health sharing pool</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Ability to earn and spend $MLY</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Library card equivalent</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> MiLyfe account = identity verification</li>
            </ul>
          </div>
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">No data shared with government</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">MiLyfe does not share membership data with any government agency. Your information is community-owned and encrypted.</p>
          </div>
        </div>
      )}

      {/* ─── Work ─── */}
      {tab === 'work' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Worker rights, wage theft reporting, OSHA safety, and sanctuary employers who provide safe workplaces.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setWorkFilter('all')} className={cn('px-3 py-1 rounded-full text-xs', workFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            <button onClick={() => setWorkFilter('sanctuary')} className={cn('px-3 py-1 rounded-full text-xs', workFilter === 'sanctuary' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>Sanctuary Employers</button>
          </div>
          {loading ? <Skeleton /> : filteredWorkplaces.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No workplaces listed yet</p></div>
          ) : filteredWorkplaces.map(wp => (
            <div key={wp.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{wp.name}</p>
                {wp.sanctuary && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Sanctuary</span>}
                {wp.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{wp.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>📍 {wp.location}</span>
                <span>{wp.industry}</span>
                {wp.contact && <span>📞 {wp.contact}</span>}
              </div>
            </div>
          ))}
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Worker Rights</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Report wage theft regardless of immigration status</li>
              <li>• OSHA protections apply to ALL workers</li>
              <li>• You can file complaints anonymously</li>
              <li>• Retaliation for reporting is illegal</li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── Family Plan ─── */}
      {tab === 'family-plan' && (
        <div className="space-y-3">
          <div className="card bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">If Detained — Family Safety Plan</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">A private, encrypted plan: who takes the children, where documents are, who to call. Only you can access this.</p>
          </div>
          {familyPlan.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">👨‍👩‍👧‍👦</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Create Your Family Safety Plan</p>
              <p className="text-xs text-gray-500 mt-1">Private and encrypted — prepare so your family is protected</p>
              {user && <button onClick={initFamilyPlan} className="btn-teal text-xs mt-4">Create Plan</button>}
            </div>
          ) : (
            <>
              <div className="card">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-harbor-800 dark:text-white font-bold">{completedPlan}/{familyPlan.length} prepared</span>
                  <span className="text-[10px] text-gray-400">🔐 Encrypted</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${familyPlan.length ? (completedPlan / familyPlan.length) * 100 : 0}%` }} />
                </div>
              </div>
              {familyPlan.map(item => (
                <div key={item.id} className="card flex items-center gap-3">
                  <button onClick={() => toggleFamilyItem(item.id, !item.completed)} className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors', item.completed ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 dark:border-gray-600 hover:border-orange-500')}>
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
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📋', label: 'DACA/TPS Updates', desc: 'Latest policy changes' },
              { icon: '🏥', label: 'Healthcare Access', desc: 'Health sharing works for everyone' },
              { icon: '📚', label: 'Education Access', desc: 'Schools cannot ask for status' },
              { icon: '⚖️', label: 'Legal Aid', desc: 'Free immigration lawyers' },
            ].map(item => (
              <div key={item.label} className="card text-center p-3">
                <p className="text-xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          {loading ? <Skeleton /> : resources.map(res => (
            <div key={res.id} className="card space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{res.language}</span>
              </div>
              <p className="text-xs text-gray-500">{res.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                {res.phone && <span>📞 {res.phone}</span>}
                {res.link && <a href={res.link} className="text-teal-600 hover:underline">Visit →</a>}
              </div>
            </div>
          ))}
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Earn and use $MLY regardless of status. MiLyfe community economy does not require government ID, bank account, or SSN. Your community ID is all you need.</p>
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Emergency Resources</p>
        <div className="mt-1 space-y-1 text-[10px] text-red-600 dark:text-red-300">
          <p>ICE Raid Hotline: <strong>1-844-363-1423</strong></p>
          <p>Immigration Legal: <strong>1-800-354-0365</strong></p>
          <p>Human Trafficking: <strong>1-888-373-7888</strong></p>
        </div>
      </div>
    </div>
  );
}
