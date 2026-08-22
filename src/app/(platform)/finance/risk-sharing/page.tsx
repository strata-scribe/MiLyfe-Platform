'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface RiskClaim {
  id: string;
  member_id: string;
  category: 'property' | 'vehicle' | 'life' | 'business';
  title: string;
  description: string;
  amount: number;
  evidence_photos: string[];
  neighbor_attestations: number;
  status: 'submitted' | 'verifying' | 'approved' | 'paid' | 'denied';
  created_at: string;
  profiles?: { display_name: string };
}

type RiskCategory = 'property' | 'vehicle' | 'life' | 'business';

const RISK_CATEGORIES = [
  { id: 'property' as RiskCategory, icon: '🏠', label: 'Property', desc: 'Fire, theft, flood, storm damage', monthly: '$20-50', maxCoverage: '$10,000' },
  { id: 'vehicle' as RiskCategory, icon: '🚗', label: 'Vehicle', desc: 'Accidents, theft, breakdown', monthly: '$30-80', maxCoverage: '$15,000' },
  { id: 'life' as RiskCategory, icon: '💐', label: 'Life Transition', desc: 'Burial/transition support for family', monthly: '$5-15', maxCoverage: '$5,000-$25,000' },
  { id: 'business' as RiskCategory, icon: '🏪', label: 'Business', desc: 'Accidents at location, product issues', monthly: '$25-75', maxCoverage: '$10,000' },
];

export default function RiskSharingPage() {
  const [claims, setClaims] = useState<RiskClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState<RiskCategory[]>([]);
  const [showClaim, setShowClaim] = useState(false);

  // Claim form
  const [claimCat, setClaimCat] = useState<RiskCategory>('property');
  const [claimTitle, setClaimTitle] = useState('');
  const [claimDesc, setClaimDesc] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('finance_risk_claims').select('*, profiles!finance_risk_claims_member_id_fkey(display_name)').order('created_at', { ascending: false }).limit(15);
    if (data) setClaims(data as any);
    setLoading(false);
  }

  function toggleEnroll(category: RiskCategory) {
    if (enrolled.includes(category)) {
      setEnrolled(prev => prev.filter(c => c !== category));
    } else {
      setEnrolled(prev => [...prev, category]);
      toast.success(`Enrolled in ${category} protection`);
    }
  }

  async function submitClaim() {
    if (!user || !claimTitle.trim() || !claimAmount) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('finance_risk_claims').insert({
      member_id: user.id, category: claimCat, title: claimTitle.trim(),
      description: claimDesc.trim(), amount: parseFloat(claimAmount),
      evidence_photos: [], neighbor_attestations: 0, status: 'submitted',
    });
    setClaimTitle(''); setClaimDesc(''); setClaimAmount('');
    setShowClaim(false); setSubmitting(false);
    toast.success('Risk claim submitted — needs 2 neighbor attestations');
    loadData();
  }

  async function attest(claimId: string) {
    const supabase = createClient();
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    const newCount = claim.neighbor_attestations + 1;
    const updates: any = { neighbor_attestations: newCount };
    if (newCount >= 2) updates.status = 'verifying';
    await supabase.from('finance_risk_claims').update(updates).eq('id', claimId);
    toast.success('Attestation recorded');
    loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Risk Sharing</h1>
          <p className="text-xs text-gray-500">Community coverage for property, vehicle, life & business</p>
        </div>
        {enrolled.length > 0 && <button onClick={() => setShowClaim(!showClaim)} className="btn-teal text-xs">🆘 File Claim</button>}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Coverage Options</h3>
        {RISK_CATEGORIES.map(cat => (
          <div key={cat.id} className="card flex items-center gap-3">
            <span className="text-2xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{cat.label}</p>
              <p className="text-xs text-gray-500">{cat.desc}</p>
              <p className="text-[10px] text-mly-600 mt-0.5">{cat.monthly} MLY/mo · Max: {cat.maxCoverage}</p>
            </div>
            <button onClick={() => toggleEnroll(cat.id)} className={cn('text-xs px-3 py-1.5 rounded-lg font-medium', enrolled.includes(cat.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-teal-100 hover:text-teal-700')}>
              {enrolled.includes(cat.id) ? '✓ Enrolled' : 'Enroll'}
            </button>
          </div>
        ))}
      </div>

      {/* Submit Claim */}
      {showClaim && (
        <div className="card space-y-3 border-2 border-indigo-200 dark:border-indigo-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">File a Claim</h3>
          <p className="text-xs text-gray-500">Needs 2 neighbor attestations + photo evidence to process.</p>
          <select value={claimCat} onChange={e => setClaimCat(e.target.value as any)} className="input-field">
            {RISK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <input value={claimTitle} onChange={e => setClaimTitle(e.target.value)} placeholder="What happened?" className="input-field" />
          <textarea value={claimDesc} onChange={e => setClaimDesc(e.target.value)} placeholder="Full description of the event, damage, and costs" className="input-field resize-none" rows={3} />
          <input value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="Claim amount ($MLY)" className="input-field" type="number" />
          <button onClick={submitClaim} disabled={!claimTitle.trim() || !claimAmount || submitting} className="btn-teal w-full disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      )}

      {/* Claims */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Recent Claims</h3>
        {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
          claims.length === 0 ? (
            <div className="card text-center py-8"><p className="text-sm text-gray-500">No claims filed yet</p></div>
          ) : claims.map(claim => (
            <div key={claim.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{RISK_CATEGORIES.find(c => c.id === claim.category)?.icon}</span>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{claim.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{(claim.profiles as any)?.display_name} · {claim.neighbor_attestations}/2 attestations</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-mly-600">${claim.amount}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', claim.status === 'paid' ? 'bg-green-100 text-green-700' : claim.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>{claim.status}</span>
                </div>
              </div>
              {claim.status === 'submitted' && user && claim.member_id !== user.id && (
                <button onClick={() => attest(claim.id)} className="w-full py-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                  ✋ I Can Attest ({claim.neighbor_attestations}/2)
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
