'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    // Gather all user data
    const [profile, transactions, issues, checkins, listings, orders, interactions, goals, habits, journal, vaultDocs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('mly_transactions').select('*').or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
      supabase.from('city_issues').select('*').eq('reporter_id', user.id),
      supabase.from('health_checkins').select('*').eq('user_id', user.id),
      supabase.from('shop_listings').select('*').eq('seller_id', user.id),
      supabase.from('shop_orders').select('*').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
      supabase.from('police_interactions').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('journal_entries').select('*').eq('user_id', user.id),
      supabase.from('vault_documents').select('id,title,type,created_at').eq('user_id', user.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      platform: 'MiLyfe',
      notice: 'This is your complete personal data. It was generated on request and belongs to you.',
      profile: profile.data,
      financial: { transactions: transactions.data },
      city_activity: { issues_reported: issues.data },
      health: { checkins: checkins.data },
      shop: { listings: listings.data, orders: orders.data },
      rights: { police_interactions: interactions.data },
      personal_development: { goals: goals.data, habits: habits.data, journal: journal.data },
      vault: { documents: vaultDocs.data },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milyfe-data-${user.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
    setDone(true);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/profile')} className="text-teal-500 text-sm">← Profile</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Export My Data</h1>
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-harbor-800 dark:text-white">Your Right to Your Data</h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          The MiLyfe Constitution guarantees your right to leave with all your data. This export includes everything: profile, transactions, health records, police interactions, journal entries, documents, goals, and more.
        </p>
        <p className="text-xs text-gray-500">Format: JSON (readable by any text editor or developer tool)</p>
      </div>

      <div className="card space-y-2">
        <p className="text-sm font-medium text-harbor-800 dark:text-white">What&apos;s included:</p>
        {['Profile & settings', '$MLY transaction history', 'Health check-ins', 'City issues reported', 'Police interaction log', 'Shop listings & orders', 'Goals, habits, journal (private)', 'Vault document records'].map(item => (
          <div key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="text-teal-500">✓</span> {item}
          </div>
        ))}
      </div>

      {done ? (
        <div className="card text-center py-6 bg-teal-50 dark:bg-teal-900/20">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Download started</p>
          <p className="text-xs text-gray-500 mt-1">Check your downloads folder.</p>
          <button onClick={() => { setDone(false); router.push('/profile'); }} className="btn-primary mt-4 text-sm">Back to Profile</button>
        </div>
      ) : (
        <button onClick={handleExport} disabled={exporting} className="btn-teal w-full disabled:opacity-50">
          {exporting ? 'Gathering your data...' : '⬇️ Download My Data (JSON)'}
        </button>
      )}

      <p className="text-[10px] text-gray-400 text-center">Vault file contents require separate download via MiVault. Document records are included here.</p>
    </div>
  );
}
