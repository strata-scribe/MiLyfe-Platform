'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { format, formatDistanceToNow, startOfWeek, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Section = 'account' | 'moderation' | 'report' | 'transparency';

interface ModerationEntry {
  id: string;
  action: string;
  reason: string;
  created_at: string;
}

interface FraudFlag {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const sections: { key: Section; label: string; icon: string }[] = [
  { key: 'account', label: 'Account', icon: '🔐' },
  { key: 'moderation', label: 'Moderation', icon: '⚖️' },
  { key: 'report', label: 'Report', icon: '🚩' },
  { key: 'transparency', label: 'Transparency', icon: '📊' },
];

const reportCategories = ['harassment', 'scam', 'spam', 'impersonation', 'other'] as const;

const enforcementLadder = [
  { step: 1, action: 'Warning', description: 'First-time minor violation — written notice sent', color: 'bg-yellow-400' },
  { step: 2, action: '24h Mute', description: 'Repeat violation — posting privileges suspended', color: 'bg-orange-400' },
  { step: 3, action: '7-Day Suspension', description: 'Serious violation — full platform access revoked', color: 'bg-red-400' },
  { step: 4, action: 'Permanent Ban', description: 'Severe/repeated violations — account terminated', color: 'bg-red-600' },
];

export default function SecurityPage() {
  const [section, setSection] = useState<Section>('account');
  const [modLog, setModLog] = useState<ModerationEntry[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // Report form state
  const [reportUsername, setReportUsername] = useState('');
  const [reportCategory, setReportCategory] = useState<typeof reportCategories[number]>('harassment');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: modData } = await supabase
      .from('moderation_log')
      .select('id, action, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (modData) setModLog(modData);

    const { data: flagsData } = await supabase
      .from('fraud_flags')
      .select('id, type, description, status, created_at')
      .order('created_at', { ascending: false });

    if (flagsData) setFraudFlags(flagsData);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitReport = async () => {
    if (!user || !reportUsername.trim() || !reportDescription.trim()) return;
    setSubmittingReport(true);

    await supabase.from('fraud_flags').insert({
      user_id: user.id,
      type: 'report',
      description: `[${reportCategory.toUpperCase()}] Reported user: ${reportUsername.trim()} — ${reportDescription.trim()}`,
      severity: reportCategory === 'harassment' || reportCategory === 'scam' ? 'high' : 'medium',
      status: 'open',
    });

    setReportUsername('');
    setReportDescription('');
    setSubmittingReport(false);
    setReportSubmitted(true);
    setTimeout(() => setReportSubmitted(false), 5000);
  };

  // Weekly moderation summary
  const weekStart = startOfWeek(new Date());
  const thisWeekLogs = modLog.filter((l) => isAfter(new Date(l.created_at), weekStart));
  const weeklyWarnings = thisWeekLogs.filter((l) => l.action === 'warning').length;
  const weeklyRemovals = thisWeekLogs.filter((l) => l.action === 'removal' || l.action === 'remove').length;
  const weeklySuspensions = thisWeekLogs.filter((l) => l.action === 'suspension' || l.action === 'suspend').length;

  // Fraud flags by status for chart
  const statusCounts = fraudFlags.reduce((acc, flag) => {
    acc[flag.status] = (acc[flag.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'Open', value: statusCounts['open'] || 0, color: '#f59e0b' },
    { name: 'Investigating', value: statusCounts['investigating'] || 0, color: '#3b82f6' },
    { name: 'Resolved', value: statusCounts['resolved'] || 0, color: '#10b981' },
    { name: 'Dismissed', value: statusCounts['dismissed'] || 0, color: '#6b7280' },
  ];

  // Device info
  const getDeviceInfo = () => {
    if (typeof navigator === 'undefined') return 'Unknown device';
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone (Safari)';
    if (ua.includes('Android')) return 'Android (Chrome)';
    if (ua.includes('Mac')) return 'macOS (Desktop)';
    if (ua.includes('Windows')) return 'Windows (Desktop)';
    if (ua.includes('Linux')) return 'Linux (Desktop)';
    return 'Unknown device';
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Security</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Account security, platform moderation, and transparency.
        </p>
      </div>

      {/* Section Nav */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={cn(
              'flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all',
              section === s.key
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <span className="hidden sm:inline">{s.icon} </span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Account Section */}
      {section === 'account' && (
        <div className="space-y-4">
          {/* Profile summary */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs">🔐</span>
              Account Overview
            </h3>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500">Email</span>
                  <span className="text-sm font-medium text-harbor-800 dark:text-white">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500">Member since</span>
                  <span className="text-sm text-harbor-800 dark:text-white">
                    {format(new Date(user.joined_at), 'MMMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500">Role</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 font-medium">
                    Community Member
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Log in to view account details.</p>
            )}
          </div>

          {/* 2FA Card */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Two-Factor Authentication</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account. 2FA requires a code from your phone
              in addition to your password when logging in.
            </p>
          </div>

          {/* Active Sessions */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Active Sessions</h3>
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{getDeviceInfo()}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Current session</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <a href="/profile" className="card flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔑</span>
                <span className="text-sm font-medium text-harbor-800 dark:text-white">Change Password</span>
              </div>
              <span className="text-gray-400">→</span>
            </a>

            <a href="/profile/export" className="card flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-lg">📥</span>
                <span className="text-sm font-medium text-harbor-800 dark:text-white">Export My Data</span>
              </div>
              <span className="text-gray-400">→</span>
            </a>

            <a href="/profile" className="card flex items-center justify-between hover:shadow-md transition-shadow border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</span>
                  <p className="text-xs text-gray-400">Permanently removes all data</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </a>
          </div>
        </div>
      )}

      {/* Moderation Section */}
      {section === 'moderation' && (
        <div className="space-y-4">
          {/* Weekly summary */}
          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">This Week</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">{weeklyWarnings}</p>
                <p className="text-xs text-gray-500">Warnings</p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{weeklyRemovals}</p>
                <p className="text-xs text-gray-500">Removals</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{weeklySuspensions}</p>
                <p className="text-xs text-gray-500">Suspensions</p>
              </div>
            </div>
          </div>

          {/* Enforcement ladder */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Enforcement Ladder</h3>
            <div className="space-y-2">
              {enforcementLadder.map((level) => (
                <div key={level.step} className="flex items-center gap-3">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', level.color)}>
                    {level.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{level.action}</p>
                    <p className="text-xs text-gray-500">{level.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public moderation log */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Public Moderation Log</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anonymized log of all moderation actions taken on the platform.
            </p>

            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)
            ) : modLog.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No moderation actions recorded.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {modLog.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                      entry.action === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      entry.action === 'removal' || entry.action === 'remove' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {entry.action}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{entry.reason}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Section */}
      {section === 'report' && (
        <div className="space-y-4">
          {reportSubmitted ? (
            <div className="card text-center space-y-3 py-8">
              <p className="text-5xl">✓</p>
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Report Submitted</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Our moderation team will review your report within 24 hours. Thank you for helping keep the community safe.
              </p>
            </div>
          ) : (
            <div className="card space-y-4">
              <div>
                <h3 className="text-base font-bold text-harbor-800 dark:text-white">Report a User</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reports are reviewed by our moderation team within 24 hours.
                </p>
              </div>

              <input
                type="text"
                value={reportUsername}
                onChange={(e) => setReportUsername(e.target.value)}
                className="input-field"
                placeholder="Username or email of person to report"
              />

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {reportCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setReportCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                        reportCategory === cat
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe what happened..."
              />

              <button
                onClick={handleSubmitReport}
                disabled={submittingReport || !reportUsername.trim() || !reportDescription.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transparency Section */}
      {section === 'transparency' && (
        <div className="space-y-4">
          {/* Fraud flags chart */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Reports by Status</h3>
            <p className="text-xs text-gray-500">All community reports, tracked transparently.</p>

            {fraudFlags.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400 text-sm">No reports filed yet.</p>
            )}

            {/* Status counts */}
            <div className="grid grid-cols-4 gap-2">
              {chartData.map((item) => (
                <div key={item.name} className="text-center">
                  <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs text-gray-500">{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform rules */}
          <a href="/constitution/policy" className="card flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-harbor-800 dark:bg-white flex items-center justify-center">
                <span className="text-white dark:text-harbor-800 text-lg">📜</span>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">Platform Rules & Policy</p>
                <p className="text-xs text-gray-500">Community standards and governance docs</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </a>

          {/* Trust statement */}
          <div className="card bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="text-sm font-bold text-teal-800 dark:text-teal-400">Our Commitment</p>
                <p className="text-xs text-teal-700 dark:text-teal-500 mt-1">
                  MiLyfe operates transparently. All moderation is logged publicly (anonymized),
                  fraud reports are tracked with full status updates, and community rules are set by democratic vote.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
