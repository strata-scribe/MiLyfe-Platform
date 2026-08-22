'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface Service {
  id: string; title: string; category: string; description: string;
  provider: string; phone: string; accepts_mly: boolean; eligibility: string;
}
interface Equipment {
  id: string; name: string; category: string; description: string;
  available: boolean; condition: string; lender: string; location: string;
}
interface TransportRequest {
  id: string; user_id: string; pickup: string; destination: string;
  date: string; time: string; accessible_vehicle: boolean;
  status: 'pending' | 'confirmed' | 'completed';
}
interface Job {
  id: string; title: string; company: string; description: string;
  remote: boolean; flexible_schedule: boolean; accommodations: string[];
  mly_pay: boolean; hourly_range: string;
}
interface AdvocacyTemplate {
  id: string; title: string; type: string; description: string;
  template_content: string;
}

type Tab = 'services' | 'equipment' | 'transport' | 'employment' | 'advocacy';

const TABS: { key: Tab; label: string }[] = [
  { key: 'services', label: 'Services' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'transport', label: 'Transport' },
  { key: 'employment', label: 'Employment' },
  { key: 'advocacy', label: 'Advocacy' },
];

const SERVICE_CATEGORIES = ['SSI/SSDI', 'PCA', 'Caregiver', 'Therapy', 'Home Mod', 'Benefits Nav'];
const EQUIPMENT_CATEGORIES = ['Mobility', 'Bathroom', 'Communication', 'Home', 'Vehicle'];

/* ─── Component ─── */
export default function AccessPage() {
  const [tab, setTab] = useState<Tab>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [transports, setTransports] = useState<TransportRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<AdvocacyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState<'all' | 'remote' | 'flexible'>('all');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [svcResult, eqResult, jobResult, tmplResult] = await Promise.all([
      supabase.from('access_services').select('*'),
      supabase.from('access_equipment').select('*'),
      supabase.from('access_jobs').select('*'),
      supabase.from('access_advocacy_templates').select('*'),
    ]);
    if (svcResult.data) setServices(svcResult.data);
    if (eqResult.data) setEquipment(eqResult.data);
    if (jobResult.data) setJobs(jobResult.data);
    if (tmplResult.data) setTemplates(tmplResult.data);

    if (user) {
      const { data: transportData } = await supabase.from('access_transport_requests').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (transportData) setTransports(transportData);
    }
    setLoading(false);
  }

  async function borrowEquipment(equipId: string) {
    if (!user) { toast.error('Sign in to borrow'); return; }
    const { error } = await supabase.from('access_equipment_loans').insert({ user_id: user.id, equipment_id: equipId, borrowed_at: new Date().toISOString() });
    if (error) { toast.error('Could not process request'); return; }
    toast.success('Borrow request submitted! The lender will confirm.');
    loadData();
  }

  async function requestTransport(pickup: string, destination: string, date: string, time: string, accessible: boolean) {
    if (!user) { toast.error('Sign in to request transport'); return; }
    const { error } = await supabase.from('access_transport_requests').insert({
      user_id: user.id, pickup, destination, date, time, accessible_vehicle: accessible, status: 'pending',
    });
    if (error) { toast.error('Request failed'); return; }
    toast.success('Transport request submitted! A driver will confirm.');
    loadData();
  }

  const filteredServices = services.filter(s => serviceFilter === 'all' || s.category.toLowerCase() === serviceFilter.toLowerCase());
  const filteredEquipment = equipment.filter(e => equipmentFilter === 'all' || e.category.toLowerCase() === equipmentFilter.toLowerCase());
  const filteredJobs = jobs.filter(j => {
    if (jobFilter === 'remote') return j.remote;
    if (jobFilter === 'flexible') return j.flexible_schedule;
    return true;
  });

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiAccess</h1>
        <p className="text-xs text-gray-500 mt-0.5">Services, equipment, transport, employment, and advocacy for people with disabilities.</p>
      </div>

      {/* Accessibility Settings Shortcut */}
      <Link href="/settings" className="card flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
        <span className="text-xl">⚙️</span>
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Platform Accessibility</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400">Large text, voice control, high contrast, reduced motion</p>
        </div>
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all px-2', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Services ─── */}
      {tab === 'services' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-700 dark:text-teal-300">Navigate SSI/SSDI benefits, find PCAs, match with caregivers, and access services — all in one place.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setServiceFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', serviceFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {SERVICE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setServiceFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', serviceFilter.toLowerCase() === c.toLowerCase() ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredServices.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No services in this category</p></div>
          ) : filteredServices.map(svc => (
            <div key={svc.id} className="card space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{svc.title}</p>
                {svc.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{svc.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>{svc.provider}</span>
                {svc.phone && <span>📞 {svc.phone}</span>}
              </div>
              {svc.eligibility && <p className="text-[10px] text-gray-400">Eligibility: {svc.eligibility}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ─── Equipment ─── */}
      {tab === 'equipment' && (
        <div className="space-y-3">
          <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Community Lending Library</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Borrow mobility equipment, bathroom aids, communication devices, and more — free from community members.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setEquipmentFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', equipmentFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {EQUIPMENT_CATEGORIES.map(c => (
              <button key={c} onClick={() => setEquipmentFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', equipmentFilter.toLowerCase() === c.toLowerCase() ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredEquipment.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No equipment available in this category</p></div>
          ) : filteredEquipment.map(eq => (
            <div key={eq.id} className="card flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{eq.name}</p>
                  {eq.available ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Available</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">On Loan</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{eq.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>Condition: {eq.condition}</span>
                  <span>📍 {eq.location}</span>
                  <span>From: {eq.lender}</span>
                </div>
              </div>
              {eq.available && <button onClick={() => borrowEquipment(eq.id)} className="btn-teal text-xs">Borrow</button>}
            </div>
          ))}
        </div>
      )}

      {/* ─── Transport ─── */}
      {tab === 'transport' && (
        <div className="space-y-3">
          <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Accessible Transport</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Request accessible rideshares and medical transport coordination from community drivers.</p>
          </div>
          <div className="card space-y-3">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Request a Ride</p>
            <input type="text" placeholder="Pickup location" className="input-field w-full" id="pickup" />
            <input type="text" placeholder="Destination" className="input-field w-full" id="destination" />
            <div className="flex gap-2">
              <input type="date" className="input-field flex-1" id="ride-date" />
              <input type="time" className="input-field flex-1" id="ride-time" />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <input type="checkbox" id="accessible-vehicle" className="rounded" />
              Accessible vehicle required (ramp/lift)
            </label>
            <button onClick={() => {
              const pickup = (document.getElementById('pickup') as HTMLInputElement)?.value;
              const dest = (document.getElementById('destination') as HTMLInputElement)?.value;
              const date = (document.getElementById('ride-date') as HTMLInputElement)?.value;
              const time = (document.getElementById('ride-time') as HTMLInputElement)?.value;
              const accessible = (document.getElementById('accessible-vehicle') as HTMLInputElement)?.checked;
              if (pickup && dest && date && time) requestTransport(pickup, dest, date, time, accessible || false);
              else toast.error('Fill in all fields');
            }} className="btn-teal w-full">Request Ride</button>
          </div>
          {transports.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Your Requests</p>
              {transports.map(t => (
                <div key={t.id} className="card flex items-center gap-3">
                  <span className={cn('w-3 h-3 rounded-full', t.status === 'completed' ? 'bg-green-500' : t.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500')} />
                  <div className="flex-1">
                    <p className="text-xs text-harbor-800 dark:text-white">{t.pickup} → {t.destination}</p>
                    <p className="text-[10px] text-gray-400">{t.date} at {t.time} • {t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Employment ─── */}
      {tab === 'employment' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['all', 'remote', 'flexible'] as const).map(f => (
              <button key={f} onClick={() => setJobFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', jobFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? <Skeleton /> : filteredJobs.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No jobs matching this filter</p></div>
          ) : filteredJobs.map(job => (
            <div key={job.id} className="card space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{job.title}</p>
                {job.remote && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Remote</span>}
                {job.flexible_schedule && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Flexible</span>}
                {job.mly_pay && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">$MLY</span>}
              </div>
              <p className="text-xs text-gray-500">{job.description}</p>
              <p className="text-[10px] text-gray-400">{job.company} • {job.hourly_range}</p>
              {job.accommodations?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.accommodations.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded">{a}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Advocacy ─── */}
      {tab === 'advocacy' && (
        <div className="space-y-3">
          <div className="card bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Know Your Rights</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">ADA complaint templates, discrimination reporting, and community witnesses for violations.</p>
          </div>
          {loading ? <Skeleton /> : templates.map(tmpl => (
            <div key={tmpl.id} className="card space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{tmpl.title}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded capitalize">{tmpl.type}</span>
              </div>
              <p className="text-xs text-gray-500">{tmpl.description}</p>
              <button className="text-xs text-teal-600 hover:underline">Use Template →</button>
            </div>
          ))}
          <div className="card space-y-2">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Community Witnesses</p>
            <p className="text-xs text-gray-500">Request a community member to witness and document ADA violations or discrimination. Reports can be filed through MiLyfe with evidence.</p>
            <button className="btn-teal text-xs w-full">Request Witness</button>
          </div>
          <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">$MLY Integration</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">Equipment lending is free. Transport and services may accept $MLY. Community advocacy earns $MLY for helping others navigate.</p>
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-700 dark:text-red-400">Emergency</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-red-600 dark:text-red-300">
          <span>911: <strong>Emergency</strong></span>
          <span>988: <strong>Crisis Line</strong></span>
          <span>ADA Info: <strong>1-800-514-0301</strong></span>
        </div>
      </div>
    </div>
  );
}
