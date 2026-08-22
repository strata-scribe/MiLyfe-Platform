'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface PredatoryLender {
  id: string;
  reporter_id: string;
  business_name: string;
  business_type: 'payday' | 'title_loan' | 'rent_to_own' | 'pawnshop' | 'debt_collector' | 'other';
  location: string;
  description: string;
  reported_apr: number | null;
  tactics: string[];
  reports_count: number;
  verified: boolean;
  created_at: string;
}

const BUSINESS_TYPES = [
  { value: 'payday', label: '💸 Payday Lender', icon: '💸' },
  { value: 'title_loan', label: '🚗 Title Loan', icon: '🚗' },
  { value: 'rent_to_own', label: '🏠 Rent-to-Own', icon: '🏠' },
  { value: 'pawnshop', label: '🏪 Predatory Pawn', icon: '🏪' },
  { value: 'debt_collector', label: '📞 Abusive Collector', icon: '📞' },
  { value: 'other', label: '⚠️ Other', icon: '⚠️' },
];

const COMMON_TACTICS = [
  'Hidden fees', 'Rollover trap', 'Triple-digit APR', 'Aggressive collection',
  'Targeting vulnerable', 'Deceptive advertising', 'Automatic withdrawal', 'ID theft risk',
];

export default function PredatoryLenderPage() {
  const [lenders, setLenders] = useState<PredatoryLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [filter, setFilter] = useState('all');

  // Report form
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState<PredatoryLender['business_type']>('payday');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [apr, setApr] = useState('');
  const [selectedTactics, setSelectedTactics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('finance_predatory_lenders').select('*').order('reports_count', { ascending: false });
    if (filter !== 'all') query = query.eq('business_type', filter);
    const { data } = await query.limit(30);
    if (data) setLenders(data);
    setLoading(false);
  }

  function toggleTactic(tactic: string) {
    setSelectedTactics(prev => prev.includes(tactic) ? prev.filter(t => t !== tactic) : [...prev, tactic]);
  }

  async function submitReport() {
    if (!user || !bizName.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('finance_predatory_lenders').insert({
      reporter_id: user.id, business_name: bizName.trim(), business_type: bizType,
      location: location.trim(), description: description.trim(),
      reported_apr: apr ? parseInt(apr) : null, tactics: selectedTactics,
      reports_count: 1, verified: false,
    });
    setBizName(''); setLocation(''); setDescription(''); setApr(''); setSelectedTactics([]);
    setShowReport(false); setSubmitting(false);
    toast.success('Report submitted — protecting the community!');
    loadData();
  }

  async function confirmReport(lenderId: string) {
    const supabase = createClient();
    const lender = lenders.find(l => l.id === lenderId);
    if (!lender) return;
    await supabase.from('finance_predatory_lenders').update({ reports_count: lender.reports_count + 1 }).eq('id', lenderId);
    toast.success('Report confirmed');
    loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Predatory Lender Database</h1>
          <p className="text-xs text-gray-500">Community-flagged businesses that exploit our people</p>
        </div>
        {user && <button onClick={() => setShowReport(!showReport)} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium">⚠️ Report</button>}
      </div>

      {/* Warning */}
      <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
          <strong>Before you go to ANY lender:</strong> Check here first. Use MiLyfe peer lending instead — 0% interest, community-backed. These businesses charge 300-800% APR and trap you in debt cycles.
        </p>
      </div>

      {/* Report Form */}
      {showReport && (
        <div className="card space-y-3 border-2 border-red-200 dark:border-red-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Report Predatory Business</h3>
          <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Business name" className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <select value={bizType} onChange={e => setBizType(e.target.value as any)} className="input-field">
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input value={apr} onChange={e => setApr(e.target.value)} placeholder="APR % (if known)" className="input-field" type="number" />
          </div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location / address" className="input-field" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened? How were you or someone you know affected?" className="input-field resize-none" rows={3} />
          <div>
            <p className="text-xs text-gray-500 mb-2">Tactics used:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_TACTICS.map(t => (
                <button key={t} onClick={() => toggleTactic(t)} className={cn('text-[10px] px-2 py-1 rounded-full border transition-colors', selectedTactics.includes(t) ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-200 dark:border-harbor-700 text-gray-500')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={submitReport} disabled={!bizName.trim() || submitting} className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', filter === 'all' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
        {BUSINESS_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilter(t.value)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', filter === t.value ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{t.icon}</button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
          lenders.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No reports in this category yet</p></div>
          ) : lenders.map(lender => (
            <div key={lender.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{BUSINESS_TYPES.find(t => t.value === lender.business_type)?.icon}</span>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{lender.business_name}</p>
                    {lender.verified && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Verified ⚠️</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{lender.location}</p>
                </div>
                <div className="text-right">
                  {lender.reported_apr && <p className="text-sm font-bold text-red-600">{lender.reported_apr}% APR</p>}
                  <p className="text-[10px] text-gray-400">{lender.reports_count} reports</p>
                </div>
              </div>
              {lender.tactics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lender.tactics.slice(0, 4).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded">{t}</span>
                  ))}
                </div>
              )}
              {user && (
                <button onClick={() => confirmReport(lender.id)} className="text-[10px] text-red-600 hover:underline">I can confirm this ↑</button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
