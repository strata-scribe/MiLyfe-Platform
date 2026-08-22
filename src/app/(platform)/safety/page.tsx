'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow, differenceInHours } from 'date-fns';

type Section = 'checkin' | 'contacts' | 'walk' | 'tips' | 'emergency';

interface SafetyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string;
  notify_on_missed_checkin: boolean;
  created_at: string;
}

interface CheckIn {
  id: string;
  user_id: string;
  status: 'ok' | 'need_help' | 'emergency';
  note: string | null;
  created_at: string;
}

const sections: { key: Section; label: string; icon: string }[] = [
  { key: 'checkin', label: 'Check-In', icon: '✓' },
  { key: 'contacts', label: 'Contacts', icon: '👥' },
  { key: 'walk', label: 'Walk', icon: '🚶' },
  { key: 'tips', label: 'Tips', icon: '💡' },
  { key: 'emergency', label: '🆘', icon: '🆘' },
];

const emergencyNumbers = [
  { name: '911', description: 'Police, Fire, Medical Emergency', phone: '911', color: 'bg-red-500', icon: '🚨' },
  { name: '988 Crisis', description: 'Suicide & Crisis Lifeline — 24/7', phone: '988', color: 'bg-purple-500', icon: '💜' },
  { name: 'DV Hotline', description: 'National Domestic Violence Hotline', phone: '1-800-799-7233', color: 'bg-amber-500', icon: '🛡️' },
  { name: 'Hubbard House', description: 'Local Jacksonville DV Center', phone: '904-354-3114', color: 'bg-blue-500', icon: '🏠' },
];

const tipCategories = ['safety', 'crime', 'abuse', 'neglect', 'other'] as const;

export default function SafetyPage() {
  const [section, setSection] = useState<Section>('checkin');
  const [lastCheckin, setLastCheckin] = useState<CheckIn | null>(null);
  const [contacts, setContacts] = useState<SafetyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [mlyAwarded, setMlyAwarded] = useState(false);

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  // Tip form
  const [tipCategory, setTipCategory] = useState<typeof tipCategories[number]>('safety');
  const [tipDescription, setTipDescription] = useState('');
  const [tipLocation, setTipLocation] = useState('');
  const [submittingTip, setSubmittingTip] = useState(false);
  const [tipSubmitted, setTipSubmitted] = useState(false);

  // Walk session
  const [activeWalkSession, setActiveWalkSession] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: checkins } = await supabase
      .from('safety_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkins && checkins.length > 0) setLastCheckin(checkins[0]);

    const { data: contactsData } = await supabase
      .from('safety_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (contactsData) setContacts(contactsData);

    // Check for active walk session
    const { data: walkData } = await supabase
      .from('walk_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (walkData && walkData.length > 0) setActiveWalkSession(true);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckin = async (status: 'ok' | 'need_help' | 'emergency') => {
    if (!user) return;
    setCheckingIn(true);

    if (status === 'emergency') {
      setShowEmergencyAlert(true);
      // Still record the check-in
      await supabase.from('safety_checkins').insert({
        user_id: user.id,
        status: 'emergency',
        note: null,
      });

      // Notify all contacts
      for (const contact of contacts) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'emergency',
          title: 'Emergency Alert Triggered',
          body: `Emergency check-in triggered. Contact ${contact.name} at ${contact.phone}.`,
          link: '/safety',
        });
      }
    } else {
      await supabase.from('safety_checkins').insert({
        user_id: user.id,
        status,
        note: null,
      });

      if (status === 'ok') {
        // Award MLY
        await supabase.from('mly_transactions').insert({
          user_id: user.id,
          amount: 2,
          type: 'checkin_reward',
          description: 'Daily safety check-in reward',
        });
        setMlyAwarded(true);
        setTimeout(() => setMlyAwarded(false), 3000);
      }
    }

    // Refresh last check-in
    const { data } = await supabase
      .from('safety_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) setLastCheckin(data[0]);

    setCheckingIn(false);
  };

  const handleAddContact = async () => {
    if (!user || !contactName.trim() || !contactPhone.trim()) return;
    setAddingContact(true);

    await supabase.from('safety_contacts').insert({
      user_id: user.id,
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRelationship.trim() || 'Other',
      notify_on_missed_checkin: true,
    });

    setContactName('');
    setContactPhone('');
    setContactRelationship('');
    setAddingContact(false);

    // Refresh contacts
    const { data } = await supabase
      .from('safety_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setContacts(data);
  };

  const handleDeleteContact = async (id: string) => {
    await supabase.from('safety_contacts').delete().eq('id', id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmitTip = async () => {
    if (!tipDescription.trim()) return;
    setSubmittingTip(true);

    await supabase.from('anonymous_tips').insert({
      category: tipCategory,
      description: tipDescription.trim(),
      location: tipLocation.trim() || null,
    });

    setTipDescription('');
    setTipLocation('');
    setSubmittingTip(false);
    setTipSubmitted(true);
    setTimeout(() => setTipSubmitted(false), 5000);
  };

  const hoursSinceLastCheckin = lastCheckin
    ? differenceInHours(new Date(), new Date(lastCheckin.created_at))
    : null;

  const missedCheckin = hoursSinceLastCheckin !== null && hoursSinceLastCheckin > 24;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Safety & Wellness</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Your safety tools. Check in, stay connected, get help.
        </p>
      </div>

      {/* Section Nav */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={cn(
              'flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-[60px]',
              section === s.key
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Emergency Alert Modal */}
      {showEmergencyAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-harbor-800 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-slide-up">
            <div className="text-center">
              <p className="text-5xl mb-3">🚨</p>
              <h2 className="text-xl font-bold text-red-600">Emergency Alert Sent</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your contacts have been notified. If you are in immediate danger:
              </p>
            </div>
            <a
              href="tel:911"
              className="block w-full py-4 bg-red-600 text-white text-center rounded-xl font-bold text-lg hover:bg-red-700 transition-colors"
            >
              📞 Call 911 Now
            </a>
            <button
              onClick={() => setShowEmergencyAlert(false)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              I&apos;m safe — dismiss
            </button>
          </div>
        </div>
      )}

      {/* MLY Award Toast */}
      {mlyAwarded && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg animate-slide-up flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="text-sm font-medium">+$2 MLY earned for checking in!</span>
        </div>
      )}

      {/* Check-In Section */}
      {section === 'checkin' && (
        <div className="space-y-4">
          {/* Warning for missed check-in */}
          {missedCheckin && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  It&apos;s been over 24 hours since your last check-in.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Your contacts may be notified if you don&apos;t check in soon.
                </p>
              </div>
            </div>
          )}

          {/* Last check-in info */}
          {lastCheckin && (
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">Last check-in</p>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                  lastCheckin.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {lastCheckin.status === 'ok' ? '✓ OK' : lastCheckin.status}
                </span>
              </div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1">
                {formatDistanceToNow(new Date(lastCheckin.created_at), { addSuffix: true })}
              </p>
            </div>
          )}

          {/* Check-in buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleCheckin('ok')}
              disabled={checkingIn}
              className="w-full py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">✓</span>
                <span>I&apos;m OK</span>
              </span>
              <span className="block text-xs font-normal opacity-80 mt-1">+$2 MLY</span>
            </button>

            <button
              onClick={() => handleCheckin('need_help')}
              disabled={checkingIn}
              className="w-full py-6 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">⚠️</span>
                <span>Need Help</span>
              </span>
              <span className="block text-xs font-normal opacity-80 mt-1">Contacts will be alerted</span>
            </button>

            <button
              onClick={() => handleCheckin('emergency')}
              disabled={checkingIn}
              className="w-full py-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">🚨</span>
                <span>Emergency</span>
              </span>
              <span className="block text-xs font-normal opacity-80 mt-1">Immediate alert + 911 info</span>
            </button>
          </div>
        </div>
      )}

      {/* Contacts Section */}
      {section === 'contacts' && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>How it works:</strong> If you miss a check-in for 24+ hours, your trusted contacts
              will be notified via SMS/email that you haven&apos;t checked in. Keep your list updated.
            </p>
          </div>

          {/* Contacts list */}
          {loading ? (
            [1, 2].map((i) => <div key={i} className="card skeleton h-16" />)
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">👥</p>
              <p className="text-sm text-gray-500">No trusted contacts yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-400">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{contact.name}</p>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${contact.phone}`} className="text-xs text-teal-600 dark:text-teal-400">{contact.phone}</a>
                      <span className="text-xs text-gray-400">· {contact.relationship}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add contact form */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Add Trusted Contact</h3>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="input-field"
              placeholder="Name"
            />
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="input-field"
              placeholder="Phone number"
            />
            <input
              type="text"
              value={contactRelationship}
              onChange={(e) => setContactRelationship(e.target.value)}
              className="input-field"
              placeholder="Relationship (e.g. Sister, Friend)"
            />
            <button
              onClick={handleAddContact}
              disabled={addingContact || !contactName.trim() || !contactPhone.trim()}
              className="btn-teal w-full disabled:opacity-50"
            >
              {addingContact ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </div>
      )}

      {/* Walk-With-Me Section */}
      {section === 'walk' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-2xl">
                🚶
              </div>
              <div>
                <h3 className="text-base font-bold text-harbor-800 dark:text-white">Walk With Me</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time safety for your walks</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">📍</span>
                <p>GPS tracking shares your location with trusted contacts</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">⏰</span>
                <p>10-minute check-in alerts — miss one and contacts are notified</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">🔔</span>
                <p>One-tap SOS button during your walk</p>
              </div>
            </div>

            {activeWalkSession ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Walk session active</p>
                </div>
                <a href="/safety/walk" className="btn-teal w-full mt-3 text-center block">
                  View Active Session →
                </a>
              </div>
            ) : (
              <a
                href="/safety/walk"
                className="btn-teal w-full text-center block"
              >
                Start Walk Session
              </a>
            )}

            {contacts.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                ⚠️ Add at least one trusted contact before starting a walk session.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Anonymous Tips Section */}
      {section === 'tips' && (
        <div className="space-y-4">
          {tipSubmitted ? (
            <div className="card text-center space-y-3 py-8">
              <p className="text-5xl">✓</p>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Tip Submitted</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Your tip has been recorded. It is <strong>fully anonymous</strong> — no personal information,
                IP address, or account data is attached.
              </p>
              <button
                onClick={() => setTipSubmitted(false)}
                className="text-xs text-teal-600 hover:underline"
              >
                Submit another tip
              </button>
            </div>
          ) : (
            <div className="card space-y-4">
              <div>
                <h3 className="text-base font-bold text-harbor-800 dark:text-white">Anonymous Safety Tip</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Report something safely. No login required, no trace stored.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {tipCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTipCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                        tipCategory === cat
                          ? 'bg-harbor-800 text-white dark:bg-white dark:text-harbor-800'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={tipDescription}
                onChange={(e) => setTipDescription(e.target.value)}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe what you've observed..."
              />

              <input
                type="text"
                value={tipLocation}
                onChange={(e) => setTipLocation(e.target.value)}
                className="input-field"
                placeholder="Location (optional)"
              />

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🔒 <strong>100% Anonymous.</strong> No account info, IP address, or device info is stored with this tip.
                  We cannot trace it back to you.
                </p>
              </div>

              <button
                onClick={handleSubmitTip}
                disabled={submittingTip || !tipDescription.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submittingTip ? 'Submitting...' : 'Submit Anonymous Tip'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Emergency Section */}
      {section === 'emergency' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tap to call. These numbers are always available to you.
          </p>

          {emergencyNumbers.map((num) => (
            <a
              key={num.phone}
              href={`tel:${num.phone.replace(/-/g, '')}`}
              className="card flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl text-white', num.color)}>
                {num.icon}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-harbor-800 dark:text-white">{num.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{num.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-harbor-800 dark:text-white">{num.phone}</p>
                <p className="text-xs text-teal-600">Tap to call</p>
              </div>
            </a>
          ))}

          <div className="card bg-gray-50 dark:bg-gray-800/50 mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              If you are in immediate danger, call 911 first. These resources are here for you 24/7.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
