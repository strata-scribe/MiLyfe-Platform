'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface PredatoryLender {
  id: string;
  business_name: string;
  lender_type: 'payday' | 'title' | 'rent_to_own' | 'buy_here_pay_here' | 'other';
  true_apr: number;
  location: string;
  reports_count: number;
  avg_rating: number;
  last_reported: string;
}

type PredatoryTab = 'browse' | 'report' | 'calculator' | 'alternatives';

const LENDER_TYPES = [
  { value: 'payday', label: 'Payday Loan', icon: '💸' },
  { value: 'title', label: 'Title Loan', icon: '🚗' },
  { value: 'rent_to_own', label: 'Rent-to-Own', icon: '🏠' },
  { value: 'buy_here_pay_here', label: 'Buy Here Pay Here', icon: '🏪' },
  { value: 'other', label: 'Other', icon: '⚠️' },
];

export default function PredatoryLenderPage() {
  const [tab, setTab] = useState<PredatoryTab>('browse');
  const [lenders, setLenders] = useState<PredatoryLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Report form
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<string>('payday');
  const [reportTerms, setReportTerms] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportAPR, setReportAPR] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculator
  const [calcAmount, setCalcAmount] = useState('');
  const [calcFee, setCalcFee] = useState('');
  const [calcTerm, setCalcTerm] = useState('14');
  const [calcResult, setCalcResult] = useState<{ apr: number; totalCost: number; totalPaid: number } | null>(null);

  const { user } = useAppStore();

  useEffect(() => { loadLenders(); }, []);

  async function loadLenders() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('predatory_lenders')
      .select('*')
      .order('reports_count', { ascending: false });
    if (data) setLenders(data);
    setLoading(false);
  }

  async function reportLender() {
    if (!user || !reportName.trim() || !reportLocation.trim()) return;
    setSubmitting(true);
    const supabase = createClient();

    // Check if lender already exists
    const { data: existing } = await supabase
      .from('predatory_lenders')
      .select('id, reports_count')
      .ilike('business_name', reportName.trim())
      .single();

    if (existing) {
      // Increment reports count
      await supabase.from('predatory_lenders').update({ reports_count: existing.reports_count + 1, last_reported: new Date().toISOString() }).eq('id', existing.id);
      await supabase.from('predatory_lender_reports').insert({
        lender_id: existing.id,
        reporter_id: user.id,
        terms_offered: reportTerms,
        stated_apr: reportAPR ? parseFloat(reportAPR) : null,
      });
      toast.success('Report added! Thank you for protecting the community.');
    } else {
      // Create new entry
      const { data: newLender } = await supabase.from('predatory_lenders').insert({
        business_name: reportName.trim(),
        lender_type: reportType,
        true_apr: reportAPR ? parseFloat(reportAPR) : 0,
        location: reportLocation.trim(),
        reports_count: 1,
        last_reported: new Date().toISOString(),
      }).select().single();

      if (newLender) {
        await supabase.from('predatory_lender_reports').insert({
          lender_id: newLender.id,
          reporter_id: user.id,
          terms_offered: reportTerms,
          stated_apr: reportAPR ? parseFloat(reportAPR) : null,
        });
      }
      toast.success('Lender reported! Community is now warned.');
    }

    setReportName(''); setReportTerms(''); setReportLocation(''); setReportAPR('');
    setTab('browse');
    loadLenders();
    setSubmitting(false);
  }

  function calculateTrueCost() {
    if (!calcAmount || !calcFee) return;
    const principal = parseFloat(calcAmount);
    const fee = parseFloat(calcFee);
    const termDays = parseInt(calcTerm);

    const totalPaid = principal + fee;
    const totalCost = fee;
    const apr = (fee / principal) * (365 / termDays) * 100;

    setCalcResult({ apr: Math.round(apr), totalCost, totalPaid });
  }

  const filteredLenders = lenders.filter(l => {
    const matchesSearch = !searchQuery || l.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || l.lender_type === filterType;
    return matchesSearch && matchesType;
  });

  function getLenderTypeInfo(type: string) {
    return LENDER_TYPES.find(t => t.value === type) || LENDER_TYPES[4];
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Predatory Lender Database</h1>
        <p className="text-xs text-gray-500">Community-flagged bad actors — know before you go</p>
      </div>

      {/* Warning Banner */}
      <div className="card bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
        <p className="text-xs text-orange-700 dark:text-orange-400">
          ⚠️ <strong>Before you borrow from strangers:</strong> Check if they are on this list. The average payday loan has a 400% APR. You have better options within your community.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['browse', 'report', 'calculator', 'alternatives'] as PredatoryTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'calculator' ? '🧮 Cost' : t === 'alternatives' ? '✅ Better' : t}
          </button>
        ))}
      </div>

      {/* Browse */}
      {tab === 'browse' && (
        <div className="space-y-2">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or location..." className="input-field" />
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('all')} className={cn('text-[10px] px-2 py-1 rounded-full whitespace-nowrap', filterType === 'all' ? 'bg-harbor-800 text-white dark:bg-white dark:text-harbor-800' : 'bg-gray-100 text-gray-600 dark:bg-harbor-800 dark:text-gray-400')}>All</button>
            {LENDER_TYPES.map(type => (
              <button key={type.value} onClick={() => setFilterType(type.value)} className={cn('text-[10px] px-2 py-1 rounded-full whitespace-nowrap', filterType === type.value ? 'bg-harbor-800 text-white dark:bg-white dark:text-harbor-800' : 'bg-gray-100 text-gray-600 dark:bg-harbor-800 dark:text-gray-400')}>
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            filteredLenders.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-500">{searchQuery ? 'No results found' : 'No lenders reported yet'}</p>
              </div>
            ) : filteredLenders.map(lender => {
              const typeInfo = getLenderTypeInfo(lender.lender_type);
              return (
                <div key={lender.id} className="card space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-harbor-800 dark:text-white">{lender.business_name}</p>
                        <p className="text-[10px] text-gray-400">{typeInfo.label} · {lender.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{lender.true_apr}% APR</p>
                      <p className="text-[10px] text-gray-400">{lender.reports_count} reports</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((lender.true_apr / 600) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-red-600">
                    A $500 loan at {lender.true_apr}% APR costs ${Math.round(500 * (lender.true_apr / 100) * (14/365))} in just 2 weeks
                  </p>
                </div>
              );
            })
          }
        </div>
      )}

      {/* Report */}
      {tab === 'report' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to report a lender</p>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Report a Predatory Lender</h3>
              <p className="text-xs text-gray-500">Help protect the community by reporting businesses with exploitative terms.</p>

              <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Business name" className="input-field" />
              <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-field">
                {LENDER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                ))}
              </select>
              <textarea value={reportTerms} onChange={e => setReportTerms(e.target.value)} placeholder="What terms did they offer? (fees, interest, penalties...)" className="input-field resize-none" rows={3} />
              <div className="grid grid-cols-2 gap-2">
                <input value={reportLocation} onChange={e => setReportLocation(e.target.value)} placeholder="City, State" className="input-field" />
                <input value={reportAPR} onChange={e => setReportAPR(e.target.value)} placeholder="True APR (if known)" className="input-field" type="number" />
              </div>
              <button onClick={reportLender} disabled={!reportName.trim() || !reportLocation.trim() || submitting} className="btn-teal w-full disabled:opacity-50">
                {submitting ? 'Reporting...' : 'Report Lender'}
              </button>
            </>
          )}
        </div>
      )}

      {/* True Cost Calculator */}
      {tab === 'calculator' && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">True Cost Calculator</h3>
            <p className="text-xs text-gray-500">Enter a loan's terms to see the real APR and total cost.</p>
            <input value={calcAmount} onChange={e => setCalcAmount(e.target.value)} placeholder="Loan amount ($)" className="input-field" type="number" />
            <input value={calcFee} onChange={e => setCalcFee(e.target.value)} placeholder="Total fees/interest charged ($)" className="input-field" type="number" />
            <select value={calcTerm} onChange={e => setCalcTerm(e.target.value)} className="input-field">
              <option value="7">7 days</option>
              <option value="14">14 days (typical payday)</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
            </select>
            <button onClick={calculateTrueCost} disabled={!calcAmount || !calcFee} className="btn-teal w-full disabled:opacity-50">Calculate True Cost</button>
          </div>

          {calcResult && (
            <div className="card bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-2">
              <h4 className="text-sm font-bold text-red-700 dark:text-red-400">The Real Numbers</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold text-red-600">{calcResult.apr}%</p>
                  <p className="text-[10px] text-gray-500">True APR</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-harbor-800 dark:text-white">${calcResult.totalCost}</p>
                  <p className="text-[10px] text-gray-500">Cost of Borrowing</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-harbor-800 dark:text-white">${calcResult.totalPaid}</p>
                  <p className="text-[10px] text-gray-500">Total to Repay</p>
                </div>
              </div>
              {calcResult.apr > 100 && (
                <p className="text-xs text-red-700 dark:text-red-400 font-medium text-center">
                  🚨 This APR is {Math.round(calcResult.apr / 20)}x higher than a typical credit card!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alternatives */}
      {tab === 'alternatives' && (
        <div className="space-y-2">
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Better Options Within MiLyfe</h3>
            <p className="text-xs text-gray-500">Before you go to a predatory lender, try these community alternatives:</p>
          </div>

          <Link href="/finance/emergency" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">🚨</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Emergency Fund</p>
              <p className="text-xs text-gray-500">Up to $2,000 for urgent needs. No repayment required.</p>
            </div>
            <span className="text-xs text-teal-600 font-medium">0% APR</span>
          </Link>

          <Link href="/finance/lending" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">🤝</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Peer Lending</p>
              <p className="text-xs text-gray-500">Borrow up to $1,000 from community members.</p>
            </div>
            <span className="text-xs text-teal-600 font-medium">0% APR</span>
          </Link>

          <Link href="/finance/circles" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-xl">🫂</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Savings Circles</p>
              <p className="text-xs text-gray-500">Get a lump sum payout through rotation. No interest.</p>
            </div>
            <span className="text-xs text-teal-600 font-medium">0% APR</span>
          </Link>

          <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-center py-4">
            <p className="text-sm font-bold text-green-700 dark:text-green-400">Community &gt; Corporations</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">All MiLyfe financial services: 0% APR, 0 fees, 100% community trust.</p>
          </div>
        </div>
      )}
    </div>
  );
}
