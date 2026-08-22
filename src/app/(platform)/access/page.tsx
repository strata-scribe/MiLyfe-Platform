'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Service { id: string; title: string; category: string; description: string; contact: string; location: string; accessible: boolean; }
interface Equipment { id: string; name: string; type: string; condition: string; available: boolean; donor_id: string; description: string; }
interface Violation { id: string; user_id: string; location: string; description: string; status: 'reported' | 'in-review' | 'resolved'; reported_at: string; }
interface CommunityGroup { id: string; name: string; type: string; meeting_schedule: string; description: string; members_count: number; }

type AccessTab = 'home' | 'services' | 'advocacy' | 'equipment' | 'community';

const SERVICE_CATEGORIES = ['SSDI/SSI', 'Housing', 'Personal Care', 'Transportation', 'Employment', 'Healthcare'];
const EQUIPMENT_TYPES = ['Wheelchairs', 'Walkers', 'Adaptive Tech', 'Communication Devices', 'Vision Aids', 'Hearing Aids'];

export default function AccessPage() {
  const [tab, setTab] = useState<AccessTab>('home');
  const [services, setServices] = useState<Service[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [equipFilter, setEquipFilter] = useState('All');
  const [violationForm, setViolationForm] = useState({ location: '', description: '' });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: s } = await supabase.from('pop_access_services').select('*').order('category');
    if (s) setServices(s);
    const { data: eq } = await supabase.from('pop_access_equipment').select('*').eq('available', true);
    if (eq) setEquipment(eq);
    const { data: gr } = await supabase.from('pop_access_groups').select('*').order('members_count', { ascending: false });
    if (gr) setGroups(gr);
    if (user) {
      const { data: v } = await supabase.from('pop_access_violations').select('*').eq('user_id', user.id);
      if (v) setViolations(v);
    }
    setLoading(false);
  }

  async function reportViolation() {
    if (!user || !violationForm.location || !violationForm.description) { toast.error('Please fill in all fields'); return; }
    const supabase = createClient();
    await supabase.from('pop_access_violations').insert({ user_id: user.id, ...violationForm, status: 'reported', reported_at: new Date().toISOString() });
    toast.success('Violation reported. We\u2019ll follow up.');
    setViolationForm({ location: '', description: '' });
    loadData();
  }

  async function requestEquipment(equipId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('pop_access_equipment_requests').insert({ user_id: user.id, equipment_id: equipId, status: 'pending' });
    toast.success('Equipment request submitted!');
  }

  const textSize = fontSize === 'large' ? 'text-base' : fontSize === 'x-large' ? 'text-lg' : 'text-sm';

  return (
    <div className={cn('space-y-4 animate-slide-up', textSize)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Accessibility Services</h1>
          <p className="text-xs text-gray-500">Disability-led support &amp; resources</p>
        </div>
        <div className="flex gap-1">
          {(['normal', 'large', 'x-large'] as const).map(size => (
            <button key={size} onClick={() => setFontSize(size)} className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs', fontSize === size ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')} aria-label={`${size} text`}>
              {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'services', 'advocacy', 'equipment', 'community'] as AccessTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">♿ Access is a right, not a privilege.</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">This space was designed with you, by people like you. Find adaptive tech, connect with disability-led organizations, and advocate for the access you deserve.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📋', label: 'SSDI/SSI Help', action: () => { setTab('services'); setServiceFilter('SSDI/SSI'); } },
              { icon: '🏠', label: 'Accessible Housing', action: () => { setTab('services'); setServiceFilter('Housing'); } },
              { icon: '⚖️', label: 'Know Your Rights', action: () => setTab('advocacy') },
              { icon: '🦽', label: 'Equipment Library', action: () => setTab('equipment') },
              { icon: '🚗', label: 'ADA Transit', action: () => { setTab('services'); setServiceFilter('Transportation'); } },
              { icon: '👥', label: 'Community', action: () => setTab('community') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', ...SERVICE_CATEGORIES].map(f => (
              <button key={f} onClick={() => setServiceFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', serviceFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            services.filter(s => serviceFilter === 'All' || s.category === serviceFilter).map(svc => (
              <div key={svc.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{svc.title}</p>
                  {svc.accessible && <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">♿ Accessible</span>}
                </div>
                <p className="text-xs text-gray-500">{svc.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📍 {svc.location}</span>
                  {svc.contact && <span>📞 {svc.contact}</span>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'advocacy' && (
        <div className="space-y-3">
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Know Your ADA Rights</p>
            <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2"><span className="text-teal-500 font-bold">•</span>Employers must provide reasonable accommodations</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 font-bold">•</span>Public spaces must be wheelchair accessible</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 font-bold">•</span>Housing providers cannot discriminate based on disability</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 font-bold">•</span>You have the right to service animals in all public areas</li>
              <li className="flex items-start gap-2"><span className="text-teal-500 font-bold">•</span>Digital content must be accessible (Section 508)</li>
            </ul>
          </div>
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Report Accessibility Violation</p>
            <div className="space-y-2">
              <input value={violationForm.location} onChange={e => setViolationForm(f => ({ ...f, location: e.target.value }))} className="input-field" placeholder="Location of violation..." />
              <textarea value={violationForm.description} onChange={e => setViolationForm(f => ({ ...f, description: e.target.value }))} className="input-field min-h-[80px]" placeholder="Describe what happened..." />
              <button onClick={reportViolation} className="btn-teal w-full text-xs">Report Violation</button>
            </div>
          </div>
          {violations.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium text-harbor-800 dark:text-white mb-2">My Reports</p>
              {violations.map(v => (
                <div key={v.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                  <div className="flex-1"><p className="text-xs text-harbor-800 dark:text-white truncate">{v.location}</p><p className="text-[10px] text-gray-400">{new Date(v.reported_at).toLocaleDateString()}</p></div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full capitalize', v.status === 'resolved' ? 'bg-green-100 text-green-700' : v.status === 'in-review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>{v.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'equipment' && (
        <div className="space-y-3">
          <div className="card bg-harbor-50 dark:bg-harbor-900/50 border border-harbor-200 dark:border-harbor-700">
            <p className="text-xs text-harbor-600 dark:text-harbor-300">Community equipment exchange and lending library. Request items you need or donate items you no longer use.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', ...EQUIPMENT_TYPES].map(f => (
              <button key={f} onClick={() => setEquipFilter(f)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', equipFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{f}</button>
            ))}
          </div>
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            equipment.filter(e => equipFilter === 'All' || e.type === equipFilter).map(eq => (
              <div key={eq.id} className="card flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-xl">🦽</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{eq.name}</p>
                  <p className="text-xs text-gray-500">{eq.description}</p>
                  <span className="text-[10px] text-teal-600">Condition: {eq.condition}</span>
                </div>
                <button onClick={() => requestEquipment(eq.id)} className="btn-teal text-xs">Request</button>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'community' && (
        <div className="space-y-3">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            groups.map(group => (
              <div key={group.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{group.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">{group.type}</span>
                </div>
                <p className="text-xs text-gray-500">{group.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>📅 {group.meeting_schedule}</span>
                  <span>👥 {group.members_count} members</span>
                </div>
              </div>
            ))
          }
          <div className="card text-center">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Start a Group</p>
            <p className="text-xs text-gray-500 mt-1">Disability-led groups are prioritized. Create a space for your community.</p>
            <button onClick={() => toast.success('Post in the forum to find members and start a group')} className="btn-teal text-xs mt-3">Create Group</button>
          </div>
        </div>
      )}
    </div>
  );
}
