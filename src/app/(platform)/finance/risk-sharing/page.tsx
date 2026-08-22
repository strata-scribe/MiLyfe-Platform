'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface RiskCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  members_count: number;
  pool_balance: number;
  suggested_contribution: number;
}

interface MyEnrollment {
  id: string;
  category_id: string;
  category_name: string;
  monthly_contribution: number;
  enrolled_at: string;
  total_contributed: number;
}

interface RiskClaim {
  id: string;
  user_id: string;
  claimant_name: string;
  category_name: string;
  description: string;
  amount: number;
  event_date: string;
  photos_url: string | null;
  witness1_name: string;
  witness2_name: string;
  status: 'pending' | 'auto_approved' | 'panel_review' | 'approved' | 'denied';
  created_at: string;
}

type RiskTab = 'categories' | 'my-coverage' | 'report' | 'claims';

const RISK_CATEGORIES: RiskCategory[] = [
  { id: 'property', name: 'Property', icon: '🏠', description: 'Home damage, theft, natural disasters', members_count: 0, pool_balance: 0, suggested_contribution: 50 },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗', description: 'Accidents, breakdowns, theft', members_count: 0, pool_balance: 0, suggested_contribution: 40 },
  { id: 'life_transition', name: 'Life Transition', icon: '🔄', description: 'Job loss, divorce, relocation assistance', members_count: 0, pool_balance: 0, suggested_contribution: 30 },
  { id: 'business', name: 'Business', icon: '💼', description: 'Small business loss, equipment failure', members_count: 0, pool_balance: 0, suggested_contribution: 60 },
];

export default function RiskSharingPage() {
  const [tab, setTab] = useState<RiskTab>('categories');
  const [categories, setCategories] = useState<RiskCategory[]>(RISK_CATEGORIES);
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [claims, setClaims] = useState<RiskClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Enrollment form
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [contribution, setContribution] = useState('');

  // Report form
  const [reportCategory, setReportCategory] = useState('property');
  const [reportDescription, setReportDescription] = useState('');
  const [reportAmount, setReportAmount] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportPhotos, setReportPhotos] = useState<File | null>(null);
  const [witness1, setWitness1] = useState('');
  const [witness2, setWitness2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();

    const [catRes, enrollRes, claimsRes] = await Promise.all([
      supabase.from('risk_sharing_categories').select('*'),
      supabase.from('risk_sharing_enrollments').select('*').eq('user_id', user.id),
      supabase.from('risk_sharing_claims').select('*, profiles(display_name)').or(`user_id.eq.${user.id},status.eq.panel_review`).order('created_at', { ascending: false }),
    ]);

    if (catRes.data) {
      setCategories(catRes.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: RISK_CATEGORIES.find(r => r.id === c.id || r.name === c.name)?.icon || '🛡️',
        description: c.description || '',
        members_count: c.members_count || 0,
        pool_balance: c.pool_balance || 0,
        suggested_contribution: c.suggested_contribution || 40,
      })));
    }
    if (enrollRes.data) {
      setEnrollments(enrollRes.data.map((e: any) => ({
        id: e.id,
        category_id: e.category_id,
        category_name: e.category_name,
        monthly_contribution: e.monthly_contribution,
        enrolled_at: e.created_at,
        total_contributed: e.total_contributed || 0,
      })));
    }
    if (claimsRes.data) {
      setClaims(claimsRes.data.map((c: any) => ({
        ...c,
        claimant_name: c.profiles?.display_name || 'Member',
      })));
    }
    setLoading(false);
  }

  async function enrollInCategory(categoryId: string) {
    if (!user || !contribution) return;
    const supabase = createClient();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    const { error } = await supabase.from('risk_sharing_enrollments').insert({
      user_id: user.id,
      category_id: categoryId,
      category_name: cat.name,
      monthly_contribution: parseFloat(contribution),
      total_contributed: 0,
    });

    if (error) {
      toast.error('Already enrolled or error occurred');
    } else {
      toast.success(`Enrolled in ${cat.name} coverage!`);
      setSelectedCategory('');
      setContribution('');
      loadData();
    }
  }

  async function unenroll(enrollmentId: string) {
    const supabase = createClient();
    await supabase.from('risk_sharing_enrollments').delete().eq('id', enrollmentId);
    toast.success('Coverage removed');
    loadData();
  }

  async function reportEvent() {
    if (!user || !reportDescription.trim() || !reportAmount || !reportDate || !witness1.trim() || !witness2.trim()) {
      toast.error('Fill all fields including 2 witnesses');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const amount = parseFloat(reportAmount);

    let photosUrl: string | null = null;
    if (reportPhotos) {
      const path = `risk-claims/${user.id}/${Date.now()}_${reportPhotos.name}`;
      const { data: uploadData } = await supabase.storage.from('documents').upload(path, reportPhotos);
      if (uploadData) photosUrl = uploadData.path;
    }

    // Under $2000 auto-approved, over goes to panel
    const status = amount <= 2000 ? 'auto_approved' : 'panel_review';

    const { error } = await supabase.from('risk_sharing_claims').insert({
      user_id: user.id,
      category_name: reportCategory,
      description: reportDescription.trim(),
      amount,
      event_date: reportDate,
      photos_url: photosUrl,
      witness1_name: witness1.trim(),
      witness2_name: witness2.trim(),
      status,
    });

    if (error) {
      toast.error('Failed to submit claim');
    } else {
      toast.success(status === 'auto_approved' ? 'Claim auto-approved (under $2000)!' : 'Claim submitted for panel review');
      setReportDescription(''); setReportAmount(''); setReportDate('');
      setWitness1(''); setWitness2(''); setReportPhotos(null);
      setTab('claims');
      loadData();
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Risk Sharing Pool</h1>
        <p className="text-xs text-gray-500">Community coverage for property, vehicle, life transitions & business</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['categories', 'my-coverage', 'report', 'claims'] as RiskTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'my-coverage' ? 'My Coverage' : t === 'report' ? 'Report Event' : t}
          </button>
        ))}
      </div>

      {/* Categories */}
      {tab === 'categories' && (
        <div className="space-y-2">
          <div className="card bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-700 dark:text-indigo-400">
              <strong>How it works:</strong> Choose coverage categories, set your monthly contribution. Claims under $2,000 are auto-approved. Larger claims go to a community panel for review. 2 witnesses required for all claims.
            </p>
          </div>

          {categories.map(cat => {
            const isEnrolled = enrollments.some(e => e.category_id === cat.id || e.category_name === cat.name);
            return (
              <div key={cat.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{cat.name}</p>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  {isEnrolled && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Enrolled</span>}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-gray-400">
                  <span>{cat.members_count} members</span>
                  <span>Pool: ${cat.pool_balance.toLocaleString()}</span>
                  <span>Suggested: ${cat.suggested_contribution}/mo</span>
                </div>
                {!isEnrolled && (
                  selectedCategory === cat.id ? (
                    <div className="flex gap-2">
                      <input value={contribution} onChange={e => setContribution(e.target.value)} placeholder={`$/mo (suggested: ${cat.suggested_contribution})`} className="input-field flex-1" type="number" />
                      <button onClick={() => enrollInCategory(cat.id)} disabled={!contribution} className="btn-teal text-xs px-3 disabled:opacity-50">Join</button>
                      <button onClick={() => setSelectedCategory('')} className="text-xs text-gray-400">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setSelectedCategory(cat.id); setContribution(String(cat.suggested_contribution)); }} className="btn-teal text-xs w-full">Enroll in {cat.name} Coverage</button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* My Coverage */}
      {tab === 'my-coverage' && (
        <div className="space-y-2">
          {enrollments.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🛡️</p>
              <p className="text-sm text-gray-500">No coverage yet</p>
              <button onClick={() => setTab('categories')} className="btn-teal text-xs mt-3">Browse Categories</button>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Monthly Summary</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{enrollments.length} coverage categories</span>
                  <span className="text-sm font-bold text-teal-600">${enrollments.reduce((s, e) => s + e.monthly_contribution, 0)}/mo total</span>
                </div>
              </div>
              {enrollments.map(enrollment => (
                <div key={enrollment.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{RISK_CATEGORIES.find(c => c.name === enrollment.category_name)?.icon || '🛡️'}</span>
                    <div>
                      <p className="text-xs font-medium text-harbor-800 dark:text-white">{enrollment.category_name}</p>
                      <p className="text-[10px] text-gray-400">${enrollment.monthly_contribution}/mo · Total: ${enrollment.total_contributed}</p>
                    </div>
                  </div>
                  <button onClick={() => unenroll(enrollment.id)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Report Event */}
      {tab === 'report' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to report an event</p>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Enroll in a category first</p>
              <button onClick={() => setTab('categories')} className="btn-teal text-xs mt-2">Browse Categories</button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Report an Event</h3>
              <p className="text-xs text-gray-500">Under $2,000 = auto-approved. Over $2,000 = panel review.</p>

              <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="input-field">
                {enrollments.map(e => (
                  <option key={e.category_name} value={e.category_name}>{e.category_name}</option>
                ))}
              </select>

              <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="Describe what happened..." className="input-field resize-none" rows={3} />

              <div className="grid grid-cols-2 gap-2">
                <input value={reportAmount} onChange={e => setReportAmount(e.target.value)} placeholder="Amount ($)" className="input-field" type="number" />
                <input value={reportDate} onChange={e => setReportDate(e.target.value)} className="input-field" type="date" />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Photos/Evidence</label>
                <input type="file" accept="image/*" onChange={e => setReportPhotos(e.target.files?.[0] || null)} className="input-field text-xs" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">2 Community Witnesses (required)</label>
                <input value={witness1} onChange={e => setWitness1(e.target.value)} placeholder="Witness 1 — name (attestation)" className="input-field" />
                <input value={witness2} onChange={e => setWitness2(e.target.value)} placeholder="Witness 2 — name (attestation)" className="input-field" />
              </div>

              {reportAmount && parseFloat(reportAmount) > 2000 && (
                <p className="text-[10px] text-purple-600">⚡ This claim will require panel review (over $2,000)</p>
              )}

              <button onClick={reportEvent} disabled={!reportDescription.trim() || !reportAmount || !reportDate || !witness1 || !witness2 || submitting} className="btn-teal w-full disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Claims */}
      {tab === 'claims' && (
        <div className="space-y-2">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            claims.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">No claims yet</p>
              </div>
            ) : claims.map(claim => (
              <div key={claim.id} className="card space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-harbor-800 dark:text-white">{claim.category_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(claim.event_date).toLocaleDateString()} · {claim.claimant_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-harbor-800 dark:text-white">${claim.amount}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize',
                      claim.status === 'auto_approved' || claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                      claim.status === 'denied' ? 'bg-red-100 text-red-700' :
                      claim.status === 'panel_review' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>{claim.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{claim.description.substring(0, 80)}{claim.description.length > 80 ? '...' : ''}</p>
                <p className="text-[10px] text-gray-400">Witnesses: {claim.witness1_name}, {claim.witness2_name}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
