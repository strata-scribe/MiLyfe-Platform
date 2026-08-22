'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Violation {
  id: string;
  type: string;
  tier: number;
  description: string;
  status: string;
  action_taken: string | null;
  standing_penalty: number;
  mly_penalty: number;
  created_at: string;
}

interface Restriction {
  id: string;
  type: string;
  reason: string;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
}

interface Appeal {
  id: string;
  violation_id: string;
  statement: string;
  status: string;
  outcome: string | null;
  created_at: string;
}

const TIER_INFO = [
  { tier: 1, name: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10', action: '24hr feature restriction' },
  { tier: 2, name: 'Restriction', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', action: '7-day feature lock + standing reduction' },
  { tier: 3, name: 'Suspension', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10', action: '30-day suspension + community tribunal' },
  { tier: 4, name: 'Ban', color: 'text-red-900', bg: 'bg-red-100 dark:bg-red-900/20', action: 'Permanent ban (appealable after 6 months)' },
];

export default function AccountabilityPage() {
  const [tab, setTab] = useState<'status' | 'history' | 'appeal' | 'policy'>('status');
  const [violations, setViolations] = useState<Violation[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Appeal form
  const [appealViolationId, setAppealViolationId] = useState<string | null>(null);
  const [appealStatement, setAppealStatement] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const { user } = useAppStore();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    const supabase = createClient();

    const [violationsRes, restrictionsRes, appealsRes] = await Promise.all([
      supabase.from('violations').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('user_restrictions').select('*').eq('user_id', user!.id).eq('active', true),
      supabase.from('appeals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    ]);

    if (violationsRes.data) setViolations(violationsRes.data);
    if (restrictionsRes.data) setRestrictions(restrictionsRes.data);
    if (appealsRes.data) setAppeals(appealsRes.data);
    setLoading(false);
  }

  async function submitAppeal() {
    if (!user || !appealViolationId || !appealStatement.trim()) return;
    setSubmittingAppeal(true);

    const supabase = createClient();
    await supabase.from('appeals').insert({
      violation_id: appealViolationId,
      user_id: user.id,
      statement: appealStatement.trim(),
    });

    // Update violation status
    await supabase.from('violations').update({ status: 'appealed' }).eq('id', appealViolationId);

    setAppealViolationId(null);
    setAppealStatement('');
    setSubmittingAppeal(false);
    loadData();
  }

  const activeRestrictions = restrictions.filter((r) => r.active);
  const hasCleanRecord = violations.length === 0 && activeRestrictions.length === 0;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Account Standing</h1>
        <p className="text-xs text-gray-500">Your accountability status and violation history</p>
      </div>

      {/* Status banner */}
      {hasCleanRecord ? (
        <div className="card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-center py-6">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Clean Record</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">No violations or restrictions on your account.</p>
        </div>
      ) : activeRestrictions.length > 0 ? (
        <div className="card bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">⚠️ Active Restriction</p>
          {activeRestrictions.map((r) => (
            <div key={r.id} className="mt-2 text-xs text-red-600 dark:text-red-400">
              <p><strong>Type:</strong> {r.type.replace(/_/g, ' ')}</p>
              <p><strong>Reason:</strong> {r.reason}</p>
              {r.ends_at && <p><strong>Ends:</strong> {new Date(r.ends_at).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'status', label: 'Status' },
          { key: 'history', label: `History (${violations.length})` },
          { key: 'appeal', label: 'Appeals' },
          { key: 'policy', label: 'Policy' },
        ] as { key: typeof tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status tab */}
      {tab === 'status' && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Tier System</h3>
            <div className="space-y-2">
              {TIER_INFO.map((tier) => (
                <div key={tier.tier} className={cn('p-3 rounded-lg border', tier.bg)}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm font-bold', tier.color)}>Tier {tier.tier}: {tier.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{tier.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Your Stats</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-harbor-800 dark:text-white">{violations.length}</p>
                <p className="text-xs text-gray-500">Violations</p>
              </div>
              <div>
                <p className="text-xl font-bold text-harbor-800 dark:text-white">{activeRestrictions.length}</p>
                <p className="text-xs text-gray-500">Active Restrictions</p>
              </div>
              <div>
                <p className="text-xl font-bold text-harbor-800 dark:text-white">{appeals.length}</p>
                <p className="text-xs text-gray-500">Appeals Filed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {violations.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No violations on record. Keep it up! 🎉</p>
            </div>
          ) : violations.map((v) => {
            const tierInfo = TIER_INFO.find((t) => t.tier === v.tier);
            const canAppeal = v.status === 'confirmed' && !appeals.some((a) => a.violation_id === v.id);

            return (
              <div key={v.id} className={cn('card border-l-4', tierInfo?.color === 'text-amber-600' ? 'border-l-amber-500' : tierInfo?.color === 'text-orange-600' ? 'border-l-orange-500' : 'border-l-red-500')}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={cn('text-xs font-bold', tierInfo?.color)}>
                      Tier {v.tier} — {tierInfo?.name}
                    </span>
                    <p className="text-sm text-harbor-800 dark:text-white mt-1">{v.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500 mt-1">{v.description}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    v.status === 'confirmed' ? 'bg-red-100 text-red-600' :
                    v.status === 'appealed' ? 'bg-amber-100 text-amber-600' :
                    v.status === 'dismissed' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    {v.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{new Date(v.created_at).toLocaleDateString()}</span>
                  {v.standing_penalty > 0 && <span>-{v.standing_penalty} standing</span>}
                  {v.mly_penalty > 0 && <span>-${v.mly_penalty} MLY</span>}
                </div>
                {canAppeal && (
                  <button
                    onClick={() => setAppealViolationId(v.id)}
                    className="mt-2 text-xs text-teal-600 font-medium hover:underline"
                  >
                    File Appeal →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Appeal tab */}
      {tab === 'appeal' && (
        <div className="space-y-3">
          {appealViolationId && (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">File an Appeal</h3>
              <p className="text-xs text-gray-500">Explain why you believe this violation was incorrect. A community jury will review.</p>
              <textarea
                value={appealStatement}
                onChange={(e) => setAppealStatement(e.target.value)}
                placeholder="Your statement (be factual and specific)..."
                className="input-field resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="flex gap-2">
                <button onClick={submitAppeal} disabled={!appealStatement.trim() || submittingAppeal} className="btn-teal flex-1 text-sm">
                  {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                </button>
                <button onClick={() => setAppealViolationId(null)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}

          {appeals.length === 0 && !appealViolationId ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No appeals filed.</p>
            </div>
          ) : appeals.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  a.status === 'accepted' ? 'bg-green-100 text-green-600' :
                  a.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                )}>
                  {a.status}
                </span>
              </div>
              <p className="text-sm text-harbor-800 dark:text-white mt-2">{a.statement}</p>
              {a.outcome && <p className="text-xs text-gray-500 mt-2 italic">Outcome: {a.outcome}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Policy tab */}
      {tab === 'policy' && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Community Standards</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              MiLyfe is built on mutual respect. We use a transparent, proportional consequence system
              with community oversight. All enforcement is logged publicly (anonymized) and can be appealed.
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">What Gets You Violations</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <li>• <strong>Spam:</strong> Repeated unwanted messages or listings (Tier 1)</li>
              <li>• <strong>Harassment:</strong> Targeting individuals with hostile behavior (Tier 2)</li>
              <li>• <strong>Hate speech:</strong> Content attacking protected groups (Tier 2-3)</li>
              <li>• <strong>False reports:</strong> Knowingly filing false flags or recordings (Tier 2)</li>
              <li>• <strong>Doxxing:</strong> Revealing private information (Tier 3)</li>
              <li>• <strong>Scams:</strong> Fraudulent listings or transactions (Tier 3)</li>
              <li>• <strong>Illegal activity:</strong> Using platform for illegal purposes (Tier 4)</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Your Rights</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <li>• You will always be notified of violations</li>
              <li>• You can appeal any decision</li>
              <li>• Appeals are reviewed by a random community jury (Level 3+)</li>
              <li>• All enforcement is logged on the transparency dashboard</li>
              <li>• Standing can be rebuilt through positive participation</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
