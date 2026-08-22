'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

/* ─── Types ─── */
interface HelpRequest {
  id: string; user_id: string; category: string; description: string;
  status: 'pending' | 'accepted' | 'completed'; volunteer_name: string | null;
  created_at: string;
}
interface Companion {
  id: string; display_name: string; avatar_url: string | null;
  bio: string; schedule: string; visits_completed: number; phone: string;
}
interface CheckIn {
  id: string; user_id: string; status: 'okay' | 'need_help'; checked_in_at: string;
}
interface MedicationReminder {
  id: string; user_id: string; name: string; dosage: string;
  time: string; taken_today: boolean;
}
interface EmergencyContact {
  id: string; user_id: string; name: string; phone: string; relationship: string;
}

type Tab = 'checkin' | 'help' | 'companions' | 'legacy' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'checkin', label: 'Check-in' },
  { key: 'help', label: 'Help' },
  { key: 'companions', label: 'Companions' },
  { key: 'legacy', label: 'Legacy' },
  { key: 'settings', label: 'Settings' },
];

const HELP_CATEGORIES = ['Groceries', 'Errands', 'Home Repair', 'Transport', 'Tech Help', 'Yard Work', 'Companionship'];

/* ─── Component ─── */
export default function EldersPage() {
  const [tab, setTab] = useState<Tab>('checkin');
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpCategory, setHelpCategory] = useState('');
  const [helpDescription, setHelpDescription] = useState('');
  const [largeText, setLargeText] = useState(true);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    if (user) {
      const [checkResult, helpResult, compResult, medResult, ecResult] = await Promise.all([
        supabase.from('elders_checkins').select('*').eq('user_id', user.id).order('checked_in_at', { ascending: false }).limit(1),
        supabase.from('elders_help_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('elders_companions').select('*').eq('user_id', user.id),
        supabase.from('elders_medications').select('*').eq('user_id', user.id),
        supabase.from('elders_emergency_contacts').select('*').eq('user_id', user.id),
      ]);
      if (checkResult.data?.[0]) setLastCheckIn(checkResult.data[0]);
      if (helpResult.data) setHelpRequests(helpResult.data);
      if (compResult.data) setCompanions(compResult.data);
      if (medResult.data) setMedications(medResult.data);
      if (ecResult.data) setEmergencyContacts(ecResult.data);
    }
    setLoading(false);
  }

  async function checkIn(status: 'okay' | 'need_help') {
    if (!user) return;
    const { error } = await supabase.from('elders_checkins').insert({ user_id: user.id, status, checked_in_at: new Date().toISOString() });
    if (error) { toast.error('Check-in failed — try again'); return; }
    if (status === 'okay') toast.success('Checked in! Your community knows you are well.');
    else toast.success('Help alert sent to your companions and emergency contacts.');
    loadData();
  }

  async function submitHelpRequest() {
    if (!user || !helpCategory) return;
    const { error } = await supabase.from('elders_help_requests').insert({
      user_id: user.id, category: helpCategory, description: helpDescription, status: 'pending',
    });
    if (error) { toast.error('Could not submit request'); return; }
    toast.success('Help request posted — a volunteer will respond soon.');
    setHelpCategory('');
    setHelpDescription('');
    loadData();
  }

  async function toggleMedication(id: string, taken: boolean) {
    await supabase.from('elders_medications').update({ taken_today: taken }).eq('id', id);
    if (taken) toast.success('Medication marked as taken');
    loadData();
  }

  const textSize = largeText ? 'text-base' : 'text-sm';
  const headingSize = largeText ? 'text-2xl' : 'text-xl';

  const Skeleton = () => (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-harbor-800 rounded-xl" />)}</div>
  );

  return (
    <div className={cn('space-y-4 animate-slide-up', largeText && 'text-base')}>
      {/* Header */}
      <div>
        <h1 className={cn(headingSize, 'font-bold text-harbor-800 dark:text-white')}>MiElders</h1>
        <p className={cn(textSize, 'text-gray-500 mt-0.5')}>Your community checks on you. You are never alone.</p>
      </div>

      {/* Voice-first hint */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <p className={cn('text-blue-700 dark:text-blue-300', textSize)}>🎙️ Tip: You can use voice commands on your device to navigate this page.</p>
      </div>

      {/* Tabs — large touch targets */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-3 rounded-lg font-medium whitespace-nowrap transition-all px-3', largeText ? 'text-sm' : 'text-xs', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {/* ─── Check-in ─── */}
      {tab === 'checkin' && (
        <div className="space-y-4">
          <div className="card text-center py-8">
            <p className={cn('font-bold text-harbor-800 dark:text-white mb-6', headingSize)}>How are you today?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => checkIn('okay')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-10 rounded-2xl text-xl transition-colors shadow-lg">
                ✓ I&apos;m Okay
              </button>
              <button onClick={() => checkIn('need_help')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-10 rounded-2xl text-xl transition-colors shadow-lg">
                🆘 I Need Help
              </button>
            </div>
            {lastCheckIn && (
              <p className={cn('text-gray-400 mt-4', textSize)}>
                Last check-in: {new Date(lastCheckIn.checked_in_at).toLocaleString()} — {lastCheckIn.status === 'okay' ? '✓ Okay' : '🆘 Needed help'}
              </p>
            )}
          </div>
          {/* Medication reminders */}
          {medications.length > 0 && (
            <div className="card">
              <p className={cn('font-bold text-harbor-800 dark:text-white mb-3', textSize)}>Today&apos;s Medications</p>
              {medications.map(med => (
                <div key={med.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                  <button onClick={() => toggleMedication(med.id, !med.taken_today)} className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-colors', med.taken_today ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 hover:border-teal-500')}>
                    {med.taken_today && '✓'}
                  </button>
                  <div>
                    <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>{med.name}</p>
                    <p className="text-xs text-gray-400">{med.dosage} — {med.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Help ─── */}
      {tab === 'help' && (
        <div className="space-y-3">
          <div className="card">
            <p className={cn('font-bold text-harbor-800 dark:text-white mb-3', textSize)}>Request Help</p>
            <p className={cn('text-gray-500 mb-3', textSize)}>Community volunteers will respond. What do you need?</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {HELP_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setHelpCategory(cat)} className={cn('py-3 px-3 rounded-xl text-center transition-all', textSize, helpCategory === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
                  {cat}
                </button>
              ))}
            </div>
            <textarea value={helpDescription} onChange={e => setHelpDescription(e.target.value)} placeholder="Any details (optional)..." className={cn('input-field w-full', textSize)} rows={3} />
            <button onClick={submitHelpRequest} disabled={!helpCategory} className="btn-teal w-full mt-3 py-3 text-base">Submit Request</button>
          </div>
          {helpRequests.length > 0 && (
            <div className="space-y-2">
              <p className={cn('font-bold text-harbor-800 dark:text-white', textSize)}>Your Requests</p>
              {helpRequests.map(req => (
                <div key={req.id} className="card flex items-center gap-3">
                  <span className={cn('w-3 h-3 rounded-full', req.status === 'completed' ? 'bg-green-500' : req.status === 'accepted' ? 'bg-yellow-500' : 'bg-gray-300')} />
                  <div className="flex-1">
                    <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>{req.category}</p>
                    <p className="text-xs text-gray-400">{req.status} {req.volunteer_name && `• ${req.volunteer_name}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Companions ─── */}
      {tab === 'companions' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className={cn('text-teal-700 dark:text-teal-300', textSize)}>Your matched companions check on you weekly. They are real community members who care.</p>
          </div>
          {loading ? <Skeleton /> : companions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">👋</p>
              <p className={cn('text-gray-500', textSize)}>No companions matched yet</p>
              <p className={cn('text-gray-400 mt-1', textSize)}>The community is working on finding you a great match</p>
            </div>
          ) : companions.map(comp => (
            <div key={comp.id} className="card flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xl font-bold text-teal-700">
                {comp.display_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className={cn('font-bold text-harbor-800 dark:text-white', textSize)}>{comp.display_name}</p>
                <p className={cn('text-gray-500 mt-1', textSize)}>{comp.bio}</p>
                <p className={cn('text-gray-400 mt-1', textSize)}>📅 {comp.schedule}</p>
                <p className={cn('text-gray-400', textSize)}>✓ {comp.visits_completed} visits completed</p>
                {comp.phone && <a href={`tel:${comp.phone}`} className={cn('text-teal-600 font-medium mt-1 inline-block', textSize)}>📞 Call</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Legacy ─── */}
      {tab === 'legacy' && (
        <div className="space-y-3">
          <div className="card">
            <p className={cn('font-bold text-harbor-800 dark:text-white mb-2', textSize)}>Legacy Planning</p>
            <p className={cn('text-gray-500 mb-4', textSize)}>Make sure your wishes are documented and your loved ones are prepared.</p>
            <div className="space-y-2">
              <Link href="/finance/will" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
                <span className="text-2xl">📜</span>
                <div>
                  <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>Will Builder</p>
                  <p className="text-xs text-gray-400">Create or update your will</p>
                </div>
              </Link>
              <Link href="/vault" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
                <span className="text-2xl">🔐</span>
                <div>
                  <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>Document Vault</p>
                  <p className="text-xs text-gray-400">Store important documents securely</p>
                </div>
              </Link>
              <div className="card flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>Beneficiary Management</p>
                  <p className="text-xs text-gray-400">Who receives your $MLY and assets</p>
                </div>
              </div>
              <div className="card flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>Final Wishes Document</p>
                  <p className="text-xs text-gray-400">Care preferences, ceremony wishes, messages</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings ─── */}
      {tab === 'settings' && (
        <div className="space-y-3">
          <div className="card space-y-4">
            <p className={cn('font-bold text-harbor-800 dark:text-white', textSize)}>Accessibility Settings</p>
            <label className="flex items-center justify-between">
              <span className={cn('text-harbor-800 dark:text-white', textSize)}>Large Text Mode</span>
              <input type="checkbox" checked={largeText} onChange={e => setLargeText(e.target.checked)} className="w-6 h-6 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className={cn('text-harbor-800 dark:text-white', textSize)}>High Contrast</span>
              <input type="checkbox" className="w-6 h-6 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className={cn('text-harbor-800 dark:text-white', textSize)}>Reduced Motion</span>
              <input type="checkbox" className="w-6 h-6 rounded" />
            </label>
          </div>
          <div className="card space-y-3">
            <p className={cn('font-bold text-harbor-800 dark:text-white', textSize)}>Check-in Reminder</p>
            <p className={cn('text-gray-500', textSize)}>Get a daily reminder to check in so your community knows you are safe.</p>
            <select className={cn('input-field w-full', textSize)}>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>12:00 PM</option>
              <option>3:00 PM</option>
              <option>6:00 PM</option>
            </select>
          </div>
          <div className="card space-y-3">
            <p className={cn('font-bold text-harbor-800 dark:text-white', textSize)}>Emergency Contacts</p>
            {emergencyContacts.length === 0 ? (
              <p className={cn('text-gray-500', textSize)}>No emergency contacts added yet</p>
            ) : emergencyContacts.map(ec => (
              <div key={ec.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-harbor-800 last:border-0">
                <div>
                  <p className={cn('font-medium text-harbor-800 dark:text-white', textSize)}>{ec.name}</p>
                  <p className="text-xs text-gray-400">{ec.relationship} • {ec.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Footer */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className={cn('font-bold text-red-700 dark:text-red-400', textSize)}>Emergency</p>
        <div className="mt-1 space-y-1">
          <p className={cn('text-red-600 dark:text-red-300', textSize)}>911 — Immediate danger</p>
          <p className={cn('text-red-600 dark:text-red-300', textSize)}>988 — Crisis Lifeline</p>
          <p className={cn('text-red-600 dark:text-red-300', textSize)}>211 — Social services</p>
        </div>
      </div>
    </div>
  );
}
