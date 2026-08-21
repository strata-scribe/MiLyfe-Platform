'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Prefs { ubi: boolean; message: boolean; upvote: boolean; order_update: boolean; event: boolean; system_alert: boolean; quiet_hours_start: number; quiet_hours_end: number; }

const defaults: Prefs = { ubi: true, message: true, upvote: true, order_update: true, event: true, system_alert: true, quiet_hours_start: 22, quiet_hours_end: 7 };

export default function NotifPrefsPage() {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => { if (data) setPrefs(data); });
  }, [user, supabase]);

  const toggle = (key: keyof Prefs) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('notification_preferences').upsert({ user_id: user.id, ...prefs });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleItems = [
    { key: 'ubi' as const, icon: '💰', label: 'UBI Drops', desc: 'When your daily $MLY arrives' },
    { key: 'message' as const, icon: '💬', label: 'Messages', desc: 'New direct messages and group chat' },
    { key: 'upvote' as const, icon: '👍', label: 'Upvotes', desc: 'When someone upvotes your issue' },
    { key: 'order_update' as const, icon: '🛍️', label: 'Orders', desc: 'Shop order status updates' },
    { key: 'event' as const, icon: '📅', label: 'Events', desc: 'Event reminders and MLY earned' },
    { key: 'system_alert' as const, icon: '🔔', label: 'System Alerts', desc: 'Platform updates and safety alerts' },
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/notifications')} className="text-teal-500 text-sm">← Notifications</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Preferences</h1>
      </div>

      <div className="card space-y-4">
        {toggleItems.map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <button onClick={() => toggle(item.key)} className={cn('w-12 h-7 rounded-full transition-colors relative', prefs[item.key] ? 'bg-teal-500' : 'bg-gray-300 dark:bg-harbor-700')} role="switch" aria-checked={prefs[item.key]}>
              <div className={cn('absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform', prefs[item.key] ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-harbor-800 dark:text-white">Quiet Hours</h2>
        <p className="text-xs text-gray-500">No notifications sent during these hours (except safety alerts).</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start (no notifs after)</label>
            <select value={prefs.quiet_hours_start} onChange={e => setPrefs(p => ({ ...p, quiet_hours_start: parseInt(e.target.value) }))} className="input-field !py-2 text-sm">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End (notifs resume at)</label>
            <select value={prefs.quiet_hours_end} onChange={e => setPrefs(p => ({ ...p, quiet_hours_end: parseInt(e.target.value) }))} className="input-field !py-2 text-sm">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400">Current setting: No notifications from {prefs.quiet_hours_start > 12 ? `${prefs.quiet_hours_start - 12}PM` : `${prefs.quiet_hours_start}AM`} to {prefs.quiet_hours_end > 12 ? `${prefs.quiet_hours_end - 12}PM` : `${prefs.quiet_hours_end}AM`}</p>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-teal w-full disabled:opacity-50">
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
      </button>
    </div>
  );
}
