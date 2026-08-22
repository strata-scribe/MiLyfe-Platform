'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Shelter { id: string; name: string; address: string; capacity: number; current_occupancy: number; gender: string; pets_allowed: boolean; check_in_time: string; distance_miles: number; phone: string; has_beds: boolean; }
interface Resource { id: string; title: string; category: string; description: string; address: string; hours: string; walk_in: boolean; }
interface OutreachWorker { id: string; display_name: string; role: string; area: string; phone: string; available: boolean; languages: string[]; }
interface EmergencyCenter { id: string; name: string; type: string; address: string; open_now: boolean; capacity: number; phone: string; }

type ShelterTab = 'home' | 'shelters' | 'resources' | 'outreach' | 'emergency';

const RESOURCE_CATEGORIES = ['Food', 'Hygiene', 'Medical', 'Employment', 'Legal', 'Mail/Address', 'Storage', 'Transportation'];

export default function ShelterPage() {
  const [tab, setTab] = useState<ShelterTab>('home');
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [outreach, setOutreach] = useState<OutreachWorker[]>([]);
  const [emergencyCenters, setEmergencyCenters] = useState<EmergencyCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('All');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: s } = await supabase.from('pop_shelter_locations').select('*').order('distance_miles', { ascending: true });
    if (s) setShelters(s);
    const { data: r } = await supabase.from('pop_shelter_resources').select('*').order('category');
    if (r) setResources(r);
    const { data: o } = await supabase.from('pop_shelter_outreach').select('*').eq('available', true);
    if (o) setOutreach(o);
    const { data: e } = await supabase.from('pop_shelter_emergency').select('*');
    if (e) setEmergencyCenters(e);
    setLoading(false);
  }

  async function requestOutreach(workerId: string) {
    if (!user) { toast.error('Please sign in to connect'); return; }
    const supabase = createClient();
    await supabase.from('pop_shelter_outreach_requests').insert({ user_id: user.id, worker_id: workerId, status: 'pending' });
    toast.success('Request sent. Someone will reach out soon.');
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Shelter & Services</h1>
        <p className="text-xs text-gray-500">You are welcome here. No questions asked.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'shelters', 'resources', 'outreach', 'emergency'] as ShelterTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Home */}
      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">You matter. You belong.</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">No judgment here. Whether you need a bed tonight, a meal, or just someone to talk to — we&apos;re here. Everything is free, confidential, and on your terms.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🛏️', label: 'Find Shelter Tonight', action: () => setTab('shelters') },
              { icon: '🍲', label: 'Food Near Me', action: () => { setTab('resources'); setResourceFilter('Food'); } },
              { icon: '🚿', label: 'Showers', action: () => { setTab('resources'); setResourceFilter('Hygiene'); } },
              { icon: '📬', label: 'Mail Services', action: () => { setTab('resources'); setResourceFilter('Mail/Address'); } },
              { icon: '🔒', label: 'Safe Storage', action: () => { setTab('resources'); setResourceFilter('Storage'); } },
              { icon: '🆘', label: 'Emergency Now', action: () => setTab('emergency') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 leading-relaxed">💡 Tip: You don&apos;t need an ID or address to use these services. If you need help navigating, tap &quot;Outreach&quot; to connect with someone who can walk with you.</p>
          </div>
        </div>
      )}

      {/* Shelters */}
      {tab === 'shelters' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Sorted by distance from you</p>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            shelters.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🛏️</p>
                <p className="text-sm text-gray-500">No shelters listed yet. Call 211 for immediate help.</p>
              </div>
            ) : shelters.map(shelter => (
              <div key={shelter.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{shelter.name}</p>
                    <p className="text-xs text-gray-500">{shelter.address}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', shelter.has_beds ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {shelter.has_beds ? 'Beds Available' : 'Full'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                  <span>📍 {shelter.distance_miles} mi</span>
                  <span>👤 {shelter.gender}</span>
                  <span>🐾 {shelter.pets_allowed ? 'Pets OK' : 'No Pets'}</span>
                  <span>🕐 Check-in: {shelter.check_in_time}</span>
                  <span>🛏️ {shelter.current_occupancy}/{shelter.capacity}</span>
                </div>
                <a href={`tel:${shelter.phone}`} className="btn-teal text-xs inline-block text-center w-full">Call to Reserve</a>
              </div>
            ))
          }
        </div>
      )}

      {/* Resources */}
      {tab === 'resources' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setResourceFilter('All')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === 'All' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {RESOURCE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setResourceFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', resourceFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).length === 0 ? (
              <div className="card text-center py-8"><p className="text-sm text-gray-500">No resources in this category yet</p></div>
            ) : resources.filter(r => resourceFilter === 'All' || r.category === resourceFilter).map(res => (
              <div key={res.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{res.title}</p>
                  {res.walk_in && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Walk-in OK</span>}
                </div>
                <p className="text-xs text-gray-500">{res.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📍 {res.address}</span>
                  <span>🕐 {res.hours}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Outreach */}
      {tab === 'outreach' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-300">Outreach workers and peer navigators meet you where you are — literally. They can help with paperwork, appointments, or just be a friendly face.</p>
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            outreach.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🤝</p>
                <p className="text-sm text-gray-500">No outreach workers available right now</p>
                <p className="text-xs text-gray-400 mt-1">Call 211 for immediate connection</p>
              </div>
            ) : outreach.map(worker => (
              <div key={worker.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm">{worker.display_name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{worker.display_name}</p>
                  <p className="text-xs text-gray-500">{worker.role} • {worker.area}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {worker.languages.map(l => (
                      <span key={l} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded">{l}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => requestOutreach(worker.id)} className="btn-teal text-xs">Connect</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Emergency */}
      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 Immediate Help</h3>
            <p className="text-xs text-red-600 mt-1">If you are in danger, call 911. These resources are available now.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">Crisis Lines</p>
            {[
              { label: 'Emergency Shelter Hotline', number: '211', desc: 'Immediate bed placement 24/7' },
              { label: 'Crisis Mental Health', number: '988', desc: 'Suicide & Crisis Lifeline' },
              { label: 'Domestic Violence Hotline', number: '1-800-799-7233', desc: 'Safety planning & shelter' },
              { label: 'MiLyfe Community SOS', number: 'In-app', desc: 'Alert nearby community members' },
            ].map(item => (
              <div key={item.label} className="card flex items-center gap-3">
                <span className="text-xl">📞</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <a href={`tel:${item.number}`} className="text-xs font-bold text-teal-600">{item.number}</a>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">Warming & Cooling Centers</p>
            {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-16" />) :
              emergencyCenters.length === 0 ? (
                <div className="card text-center py-4"><p className="text-xs text-gray-500">No active centers right now. Call 211 for options.</p></div>
              ) : emergencyCenters.map(center => (
                <div key={center.id} className="card flex items-center gap-3">
                  <span className={cn('w-2 h-2 rounded-full', center.open_now ? 'bg-green-500' : 'bg-red-400')} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{center.name}</p>
                    <p className="text-xs text-gray-500">{center.address}</p>
                  </div>
                  <span className="text-[10px] text-gray-400">{center.type}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
