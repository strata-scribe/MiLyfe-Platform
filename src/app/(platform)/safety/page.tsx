'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type SafetyTab = 'checkin' | 'contacts' | 'tips';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  notify_on_missed_checkin: boolean;
}

export default function SafetyPage() {
  const [tab, setTab] = useState<SafetyTab>('checkin');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'done'>('idle');

  // Add contact form
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRelation, setCRelation] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  // Tip form
  const [tipCategory, setTipCategory] = useState('safety');
  const [tipDesc, setTipDesc] = useState('');
  const [tipLocation, setTipLocation] = useState('');
  const [submittingTip, setSubmittingTip] = useState(false);
  const [tipSent, setTipSent] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: contactData } = await supabase
        .from('safety_contacts')
        .select('*')
        .eq('user_id', user.id);
      if (contactData) setContacts(contactData);

      const { data: lastCheck } = await supabase
        .from('safety_checkins')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastCheck) setLastCheckin(lastCheck.created_at);
    };
    load();
  }, [user, supabase, addingContact]);

  const handleCheckin = async (status: 'ok' | 'need_help' | 'emergency') => {
    if (!user) return;

    if (status === 'emergency') {
      // Immediately show emergency info
      alert('If you are in immediate danger, call 911 NOW.\n\nMental health crisis: 988\nDV hotline: 1-800-799-7233');
    }

    await supabase.from('safety_checkins').insert({ user_id: user.id, status });
    setCheckinStatus('done');
    setLastCheckin(new Date().toISOString());

    if (status === 'ok') {
      await supabase.from('mly_transactions').insert({ to_id: user.id, amount: 2, type: 'earn', description: 'Safety check-in' });
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddingContact(true);
    await supabase.from('safety_contacts').insert({
      user_id: user.id, name: cName.trim(), phone: cPhone.trim(), relationship: cRelation.trim() || null,
    });
    setCName(''); setCPhone(''); setCRelation(''); setAddingContact(false);
  };

  const handleDeleteContact = async (id: string) => {
    await supabase.from('safety_contacts').delete().eq('id', id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTip(true);
    await supabase.from('anonymous_tips').insert({
      category: tipCategory, description: tipDesc.trim(), location: tipLocation.trim() || null,
    });
    setTipDesc(''); setTipLocation(''); setTipSent(true); setSubmittingTip(false);
    setTimeout(() => setTipSent(false), 4000);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Safety & Wellness</h1>
        <p className="text-xs text-gray-500">Check in. Stay connected. Stay safe.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {([{ key: 'checkin', label: 'Check In' }, { key: 'contacts', label: 'Contacts' }, { key: 'tips', label: 'Anonymous Tip' }] as { key: SafetyTab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t.label}</button>
        ))}
      </div>

      {tab === 'checkin' && (
        <div className="space-y-4">
          {checkinStatus === 'done' ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">✅</p>
              <p className="font-bold text-harbor-800 dark:text-white">Checked in.</p>
              <p className="text-xs text-gray-500 mt-1">Your contacts know you&apos;re okay. +2 $MLY.</p>
              <button onClick={() => setCheckinStatus('idle')} className="btn-teal mt-4 text-sm">Done</button>
            </div>
          ) : (
            <>
              <div className="card text-center space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">How are you right now?</p>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => handleCheckin('ok')} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-teal-200 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
                    <span className="text-3xl">👍</span>
                    <span className="text-xs font-medium text-teal-600">I&apos;m OK</span>
                  </button>
                  <button onClick={() => handleCheckin('need_help')} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all">
                    <span className="text-3xl">🆘</span>
                    <span className="text-xs font-medium text-orange-600">Need Help</span>
                  </button>
                  <button onClick={() => handleCheckin('emergency')} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <span className="text-3xl">🚨</span>
                    <span className="text-xs font-medium text-red-600">Emergency</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">+2 $MLY for daily check-in</p>
              </div>
              {lastCheckin && (
                <p className="text-xs text-center text-gray-400">Last check-in: {new Date(lastCheckin).toLocaleString()}</p>
              )}
            </>
          )}

          {/* Emergency Numbers */}
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 space-y-2">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Emergency Numbers</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a href="tel:911" className="p-2 bg-white dark:bg-harbor-900 rounded-lg text-center font-medium text-red-600">🚨 911</a>
              <a href="tel:988" className="p-2 bg-white dark:bg-harbor-900 rounded-lg text-center font-medium text-purple-600">🧠 988 Crisis</a>
              <a href="tel:18007997233" className="p-2 bg-white dark:bg-harbor-900 rounded-lg text-center font-medium text-harbor-600">🛡️ DV Hotline</a>
              <a href="tel:9043543114" className="p-2 bg-white dark:bg-harbor-900 rounded-lg text-center font-medium text-harbor-600">🏠 Hubbard House</a>
            </div>
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Trusted people who get notified if you miss check-ins.</p>

          {contacts.map((c) => (
            <div key={c.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-sm">{c.name.charAt(0)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone} {c.relationship && `· ${c.relationship}`}</p>
              </div>
              <button onClick={() => handleDeleteContact(c.id)} className="text-xs text-red-400">Remove</button>
            </div>
          ))}

          <form onSubmit={handleAddContact} className="card space-y-2 border-2 border-dashed border-gray-200 dark:border-harbor-700">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Add Contact</p>
            <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} className="input-field !py-2 text-sm" placeholder="Name" required />
            <input type="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="input-field !py-2 text-sm" placeholder="Phone number" required />
            <input type="text" value={cRelation} onChange={(e) => setCRelation(e.target.value)} className="input-field !py-2 text-sm" placeholder="Relationship (optional)" />
            <button type="submit" disabled={addingContact} className="btn-teal w-full text-sm !py-2">{addingContact ? 'Adding...' : 'Add Contact'}</button>
          </form>
        </div>
      )}

      {tab === 'tips' && (
        <div className="space-y-4">
          <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">🔒 Completely Anonymous</p>
            <p className="text-xs text-gray-500 mt-0.5">No account info is attached. We cannot trace this back to you.</p>
          </div>

          {tipSent ? (
            <div className="text-center py-8"><p className="text-4xl mb-2">✓</p><p className="text-sm text-teal-500 font-medium">Tip submitted anonymously. Thank you.</p></div>
          ) : (
            <form onSubmit={handleTip} className="card space-y-3">
              <h2 className="font-medium text-harbor-800 dark:text-white">Submit Anonymous Tip</h2>
              <select value={tipCategory} onChange={(e) => setTipCategory(e.target.value)} className="input-field !py-2 text-sm">
                <option value="safety">Safety concern</option><option value="crime">Crime</option><option value="abuse">Abuse/Neglect</option><option value="other">Other</option>
              </select>
              <textarea value={tipDesc} onChange={(e) => setTipDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-24" placeholder="Describe what you've seen or know..." required />
              <input type="text" value={tipLocation} onChange={(e) => setTipLocation(e.target.value)} className="input-field !py-2 text-sm" placeholder="Location (optional)" />
              <button type="submit" disabled={submittingTip} className="btn-primary w-full">{submittingTip ? 'Submitting...' : 'Submit Tip'}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
