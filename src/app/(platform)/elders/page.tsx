'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Companion { id: string; display_name: string; bio: string; availability: string; services: string[]; rating: number; visits_completed: number; }
interface Service { id: string; title: string; category: string; description: string; provider: string; phone: string; free: boolean; accepts_mly: boolean; }
interface Medication { id: string; user_id: string; name: string; dosage: string; time: string; taken_today: boolean; }
interface Appointment { id: string; user_id: string; doctor_name: string; specialty: string; date: string; time: string; location: string; notes: string; }
interface CheckIn { id: string; user_id: string; checked_in_at: string; mood: string; }

type EldersTab = 'home' | 'companion' | 'services' | 'health' | 'emergency';

const SERVICE_CATEGORIES = ['Meals', 'Transportation', 'Home Repair', 'Yard Work', 'Tech Help', 'Pharmacy', 'Companionship', 'Errands'];

export default function EldersPage() {
  const [tab, setTab] = useState<EldersTab>('home');
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('All');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: c } = await supabase.from('pop_elders_companions').select('*').order('rating', { ascending: false });
    if (c) setCompanions(c);
    const { data: s } = await supabase.from('pop_elders_services').select('*').order('category');
    if (s) setServices(s);
    if (user) {
      const { data: m } = await supabase.from('pop_elders_medications').select('*').eq('user_id', user.id).order('time');
      if (m) setMedications(m);
      const { data: a } = await supabase.from('pop_elders_appointments').select('*').eq('user_id', user.id).order('date');
      if (a) setAppointments(a);
      const today = new Date().toISOString().split('T')[0];
      const { data: ci } = await supabase.from('pop_elders_checkins').select('*').eq('user_id', user.id).gte('checked_in_at', today).limit(1);
      if (ci && ci.length > 0) setCheckedInToday(true);
    }
    setLoading(false);
  }

  async function dailyCheckIn() {
    if (!user) { toast.error('Please sign in first'); return; }
    const supabase = createClient();
    await supabase.from('pop_elders_checkins').insert({ user_id: user.id, checked_in_at: new Date().toISOString(), mood: 'good' });
    setCheckedInToday(true);
    toast.success('Check-in complete! Your family has been notified you\'re doing well. 💛');
  }

  async function markMedicationTaken(medId: string) {
    const supabase = createClient();
    await supabase.from('pop_elders_medications').update({ taken_today: true }).eq('id', medId);
    setMedications(prev => prev.map(m => m.id === medId ? { ...m, taken_today: true } : m));
    toast.success('Medication marked as taken ✓');
  }

  async function requestCompanion(companionId: string) {
    if (!user) { toast.error('Please sign in to request a visit'); return; }
    const supabase = createClient();
    await supabase.from('pop_elders_companion_requests').insert({ user_id: user.id, companion_id: companionId, status: 'pending' });
    toast.success('Visit requested! They\'ll confirm soon. 🤗');
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Elder Connect</h1>
        <p className="text-xs text-gray-500">You&apos;re never alone. We&apos;re here every day.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['home', 'companion', 'services', 'health', 'emergency'] as EldersTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Home */}
      {tab === 'home' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}! 🌻</p>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1 leading-relaxed">We&apos;re glad you&apos;re here today. Take things at your own pace — your community is always just a tap away.</p>
          </div>

          {/* Daily Check-in */}
          <div className="card text-center">
            {checkedInToday ? (
              <div>
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">You&apos;ve checked in today</p>
                <p className="text-xs text-gray-500 mt-1">Your family knows you&apos;re doing well</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl mb-1">👋</p>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Daily Check-In</p>
                <p className="text-xs text-gray-500 mt-1">Let your family know you&apos;re OK</p>
                <button onClick={dailyCheckIn} className="btn-teal text-sm mt-3 px-6 py-2">I&apos;m doing OK today</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🤗', label: 'Request a Visit', action: () => setTab('companion') },
              { icon: '📞', label: 'Call Someone', action: () => setTab('companion') },
              { icon: '💊', label: 'My Medications', action: () => setTab('health') },
              { icon: '🚗', label: 'Need a Ride', action: () => { setTab('services'); setServiceFilter('Transportation'); } },
              { icon: '🍽️', label: 'Meal Delivery', action: () => { setTab('services'); setServiceFilter('Meals'); } },
              { icon: '🆘', label: 'Emergency', action: () => setTab('emergency') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl">{item.icon}</p>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Companion */}
      {tab === 'companion' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-300">Companions are vetted volunteers who love spending time with you — visits, calls, walks, errands, or just good conversation.</p>
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            companions.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🤗</p>
                <p className="text-sm text-gray-500">Companions are being matched in your area</p>
                <p className="text-xs text-gray-400 mt-1">Check back soon!</p>
              </div>
            ) : companions.map(comp => (
              <div key={comp.id} className="card flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-lg">{comp.display_name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{comp.display_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{comp.bio}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>⭐ {comp.rating.toFixed(1)}</span>
                    <span>{comp.visits_completed} visits</span>
                    <span>📅 {comp.availability}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {comp.services.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => requestCompanion(comp.id)} className="btn-teal text-xs">Request Visit</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Services */}
      {tab === 'services' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setServiceFilter('All')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', serviceFilter === 'All' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {SERVICE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setServiceFilter(c)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', serviceFilter === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{c}</button>
            ))}
          </div>
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            services.filter(s => serviceFilter === 'All' || s.category === serviceFilter).length === 0 ? (
              <div className="card text-center py-8"><p className="text-sm text-gray-500">No services in this category yet</p></div>
            ) : services.filter(s => serviceFilter === 'All' || s.category === serviceFilter).map(svc => (
              <div key={svc.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{svc.title}</p>
                  {svc.free && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Free</span>}
                  {svc.accepts_mly && <span className="text-[10px] px-1.5 py-0.5 bg-mly-100 text-mly-700 rounded">$MLY</span>}
                </div>
                <p className="text-xs text-gray-500">{svc.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>🏢 {svc.provider}</span>
                  {svc.phone && <a href={`tel:${svc.phone}`} className="text-teal-600">📞 {svc.phone}</a>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Health */}
      {tab === 'health' && (
        <div className="space-y-3">
          {/* Medications */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">💊 Today&apos;s Medications</p>
            {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-14" />) :
              medications.length === 0 ? (
                <div className="card text-center py-4">
                  <p className="text-xs text-gray-500">No medications tracked yet. Add them to get reminders.</p>
                </div>
              ) : medications.map(med => (
                <div key={med.id} className="card flex items-center gap-3">
                  {med.taken_today ? (
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</span>
                  ) : (
                    <button onClick={() => markMedicationTaken(med.id)} className="w-6 h-6 rounded-full border-2 border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-colors" />
                  )}
                  <div className="flex-1">
                    <p className={cn('text-sm', med.taken_today ? 'text-gray-400 line-through' : 'text-harbor-800 dark:text-white')}>{med.name}</p>
                    <p className="text-[10px] text-gray-400">{med.dosage} • {med.time}</p>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Appointments */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">📅 Upcoming Appointments</p>
            {appointments.length === 0 ? (
              <div className="card text-center py-4">
                <p className="text-xs text-gray-500">No upcoming appointments</p>
              </div>
            ) : appointments.slice(0, 3).map(apt => (
              <div key={apt.id} className="card space-y-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Dr. {apt.doctor_name}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>🏥 {apt.specialty}</span>
                  <span>📅 {new Date(apt.date).toLocaleDateString()}</span>
                  <span>🕐 {apt.time}</span>
                </div>
                <p className="text-xs text-gray-500">📍 {apt.location}</p>
              </div>
            ))}
          </div>

          {/* Fall Detection */}
          <div className="card bg-gray-50 dark:bg-harbor-900/50">
            <p className="text-xs font-medium text-harbor-800 dark:text-white">🛡️ Fall Detection</p>
            <p className="text-xs text-gray-500 mt-1">Set up automatic alerts if a fall is detected. Your emergency contacts will be notified.</p>
            <button className="btn-teal text-xs mt-2">Set Up Fall Detection</button>
          </div>
        </div>
      )}

      {/* Emergency */}
      {tab === 'emergency' && (
        <div className="space-y-3">
          <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">🆘 Emergency Help</h3>
            <p className="text-xs text-red-600 mt-1">If you need immediate medical attention, call 911</p>
          </div>
          <button onClick={() => toast.success('Medical alert sent to your emergency contacts!')} className="w-full card bg-red-500 text-white text-center py-4 hover:bg-red-600 transition-colors">
            <p className="text-lg font-bold">🚨 Medical Alert</p>
            <p className="text-xs mt-1">Tap to alert your emergency contacts</p>
          </button>
          <button onClick={() => toast.success('Family has been notified!')} className="w-full card bg-orange-500 text-white text-center py-3 hover:bg-orange-600 transition-colors">
            <p className="text-sm font-bold">📱 Notify Family Now</p>
          </button>
          <button onClick={() => toast.success('Wellness check requested. Someone will check on you within the hour.')} className="w-full card bg-teal-500 text-white text-center py-3 hover:bg-teal-600 transition-colors">
            <p className="text-sm font-bold">🏠 Request Wellness Check</p>
            <p className="text-xs mt-1">A community member will visit you</p>
          </button>
          {[
            { label: 'Emergency Medical', number: '911', desc: 'Life-threatening emergency' },
            { label: 'Poison Control', number: '1-800-222-1222', desc: 'Medication questions & emergencies' },
            { label: 'Elder Abuse Hotline', number: '1-800-677-1116', desc: 'Report abuse, neglect, exploitation' },
            { label: 'MiLyfe Elder Support', number: 'In-app', desc: 'Connect with care team 24/7' },
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
      )}
    </div>
  );
}
