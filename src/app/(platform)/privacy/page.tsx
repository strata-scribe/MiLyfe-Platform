'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface ConsentRecord { category: string; granted: boolean; }

const CONSENT_CATEGORIES = [
  { key: 'analytics', label: 'Analytics', desc: 'Anonymous usage data to improve the platform', icon: '📊' },
  { key: 'push_notifications', label: 'Push Notifications', desc: 'Alerts when you\'re not in the app', icon: '🔔' },
  { key: 'email', label: 'Email Communications', desc: 'Digests, updates, and alerts via email', icon: '📧' },
  { key: 'data_sharing', label: 'Community Data Sharing', desc: 'Anonymized data for transparency dashboards', icon: '🔄' },
  { key: 'ai_training', label: 'AI Improvement', desc: 'Your interactions help Mi get smarter (anonymized)', icon: '🤖' },
  { key: 'location', label: 'Location Services', desc: 'GPS for map reports, walk-with-me, check-ins', icon: '📍' },
];

export default function PrivacyPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { user } = useAppStore();

  useEffect(() => { if (user) loadConsents(); }, [user]);

  async function loadConsents() {
    const supabase = createClient();
    const { data } = await supabase.from('consent_records').select('category, granted').eq('user_id', user!.id);
    if (data) setConsents(data);
    setLoading(false);
  }

  async function toggleConsent(category: string, granted: boolean) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('consent_records').upsert({ user_id: user.id, category, granted, updated_at: new Date().toISOString() }, { onConflict: 'user_id,category' });
    setConsents(prev => { const existing = prev.find(c => c.category === category); if (existing) return prev.map(c => c.category === category ? { ...c, granted } : c); return [...prev, { category, granted }]; });
  }

  async function requestExport() {
    if (!user) return;
    setExportStatus('processing');
    const supabase = createClient();
    await supabase.from('data_export_requests').insert({ user_id: user.id });
    setTimeout(() => setExportStatus('ready'), 3000); // Simulate processing
  }

  async function requestDeletion() {
    if (!user) return;
    const supabase = createClient();
    const gracePeriod = new Date(); gracePeriod.setDate(gracePeriod.getDate() + 30);
    await supabase.from('deletion_requests').insert({ user_id: user.id, status: 'grace_period', grace_period_ends: gracePeriod.toISOString() });
    setDeleteConfirm(false);
    alert('Account deletion scheduled. You have 30 days to cancel. After that, all data will be permanently removed.');
  }

  function isGranted(category: string): boolean {
    const record = consents.find(c => c.category === category);
    return record?.granted ?? false;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div><h1 className="text-xl font-bold text-harbor-800 dark:text-white">🔒 Privacy & Data</h1><p className="text-xs text-gray-500">Your data belongs to you. Control exactly what&apos;s collected and shared.</p></div>

      {/* Consent Management */}
      <div className="card space-y-1">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Data Consent</h3>
        {CONSENT_CATEGORIES.map(cat => (
          <div key={cat.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-harbor-800 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">{cat.icon}</span>
              <div><p className="text-sm text-harbor-800 dark:text-white">{cat.label}</p><p className="text-xs text-gray-500">{cat.desc}</p></div>
            </div>
            <button onClick={() => toggleConsent(cat.key, !isGranted(cat.key))} className={cn('w-10 h-6 rounded-full transition-colors relative', isGranted(cat.key) ? 'bg-teal-500' : 'bg-gray-300 dark:bg-harbor-700')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', isGranted(cat.key) ? 'left-[18px]' : 'left-0.5')} />
            </button>
          </div>
        ))}
      </div>

      {/* Data Export */}
      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">📦 Export Your Data</h3>
        <p className="text-xs text-gray-500 mb-3">Download all your data in JSON format. Includes: profile, posts, messages, transactions, health data, and all activity.</p>
        {exportStatus === 'ready' ? (
          <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg"><p className="text-xs text-green-700 dark:text-green-400">✓ Export ready! Check your email for the download link.</p></div>
        ) : (
          <button onClick={requestExport} disabled={exportStatus === 'processing'} className="btn-teal w-full text-sm">{exportStatus === 'processing' ? '⏳ Processing...' : '📥 Request Data Export'}</button>
        )}
      </div>

      {/* Account Deletion */}
      <div className="card border-2 border-red-200 dark:border-red-800">
        <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">⚠️ Delete Account</h3>
        <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all associated data. This includes: profile, $MLY balance, posts, messages, health records, and all activity. This cannot be undone after the 30-day grace period.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">Request Account Deletion</button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-medium">Are you sure? This will schedule your account for permanent deletion in 30 days.</p>
            <div className="flex gap-2">
              <button onClick={requestDeletion} className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg">Yes, Delete My Account</button>
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* What we collect */}
      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">What We Collect</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><p className="font-medium text-green-600 mb-1">✓ Collected</p><ul className="text-gray-500 space-y-0.5"><li>• Email (for login)</li><li>• Posts & content you create</li><li>• Transaction history</li><li>• App usage (if consented)</li></ul></div>
          <div><p className="font-medium text-red-600 mb-1">✗ Never Collected</p><ul className="text-gray-500 space-y-0.5"><li>• Browsing history</li><li>• Contact list</li><li>• Biometric data</li><li>• Data sold to third parties</li></ul></div>
        </div>
      </div>
    </div>
  );
}
