'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface ModerationStats {
  warnings: number;
  removals: number;
  total: number;
}

interface FraudStats {
  pending: number;
  reviewed: number;
  dismissed: number;
  total: number;
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [modStats, setModStats] = useState<ModerationStats>({ warnings: 0, removals: 0, total: 0 });
  const [fraudStats, setFraudStats] = useState<FraudStats>({ pending: 0, reviewed: 0, dismissed: 0, total: 0 });

  // Report form
  const [reportUsername, setReportUsername] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState('harassment');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, created_at, display_name')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Moderation stats this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: warningCount } = await supabase
        .from('moderation_log')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'warning')
        .gte('created_at', weekAgo);

      const { count: removalCount } = await supabase
        .from('moderation_log')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'content_removal')
        .gte('created_at', weekAgo);

      const { count: totalModCount } = await supabase
        .from('moderation_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      setModStats({
        warnings: warningCount || 0,
        removals: removalCount || 0,
        total: totalModCount || 0,
      });

      // Fraud flag stats
      const { count: pendingCount } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: reviewedCount } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'reviewed');

      const { count: dismissedCount } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dismissed');

      const { count: totalFraudCount } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true });

      setFraudStats({
        pending: pendingCount || 0,
        reviewed: reviewedCount || 0,
        dismissed: dismissedCount || 0,
        total: totalFraudCount || 0,
      });

      setLoading(false);
    };
    load();
  }, [user]);

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReport(true);
    setReportSuccess(false);

    await supabase.from('fraud_flags').insert({
      reported_by: user.id,
      type: 'report',
      category: reportCategory,
      description: `User: ${reportUsername.trim()} — ${reportDescription.trim()}`,
      status: 'pending',
    });

    setReportSuccess(true);
    setReportUsername('');
    setReportDescription('');
    setReportCategory('harassment');
    setSubmittingReport(false);
  };

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Security & Account</h1>
        <p className="text-xs text-gray-500">Your account security, platform transparency, and reporting tools.</p>
      </div>

      {/* Account Security */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500">Account Security</p>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="text-sm font-bold text-harbor-800 dark:text-white">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
              <p className="text-[10px] text-gray-400">Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔐</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">When available, you&apos;ll be able to enable 2FA via authenticator app or SMS for additional protection on your account.</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <span className="text-lg">📱</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">Active Sessions</p>
              <p className="text-xs text-gray-500">You&apos;re currently signed in on this device.</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Moderation Log */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500">Platform Moderation (This Week)</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-500">{modStats.warnings}</p>
            <p className="text-[10px] text-gray-500">Warnings</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-500">{modStats.removals}</p>
            <p className="text-[10px] text-gray-500">Removals</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-harbor-800 dark:text-white">{modStats.total}</p>
            <p className="text-[10px] text-gray-500">Total Actions</p>
          </div>
        </div>

        <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Platform moderation actions are logged anonymously for transparency. No user names are shown — only action types, dates, and aggregate counts.
          </p>
        </div>
      </div>

      {/* Transparency */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500">Platform Transparency — Reports</p>
        <div className="card">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">Pending Reports</span>
              <span className="text-sm font-bold text-yellow-500">{fraudStats.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">Reviewed</span>
              <span className="text-sm font-bold text-teal-500">{fraudStats.reviewed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">Dismissed</span>
              <span className="text-sm font-bold text-gray-400">{fraudStats.dismissed}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-harbor-800">
              <span className="text-xs font-medium text-harbor-800 dark:text-white">Total Reports</span>
              <span className="text-sm font-bold text-harbor-800 dark:text-white">{fraudStats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report a User */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500">Report a User</p>

        <form onSubmit={submitReport} className="card space-y-3">
          {reportSuccess && <p className="text-xs text-teal-500 font-medium">Report submitted. Our team will review it.</p>}
          <input
            type="text"
            value={reportUsername}
            onChange={e => setReportUsername(e.target.value)}
            className="input-field text-sm"
            placeholder="Username or display name"
            required
          />
          <select
            value={reportCategory}
            onChange={e => setReportCategory(e.target.value)}
            className="input-field text-sm"
          >
            <option value="harassment">Harassment</option>
            <option value="spam">Spam / Scam</option>
            <option value="fraud">Fraud / MLY abuse</option>
            <option value="impersonation">Impersonation</option>
            <option value="threats">Threats / Violence</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={reportDescription}
            onChange={e => setReportDescription(e.target.value)}
            className="input-field text-sm min-h-[80px]"
            placeholder="Describe what happened..."
            required
          />
          <button type="submit" disabled={submittingReport} className="btn-primary w-full text-sm disabled:opacity-50">
            {submittingReport ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
