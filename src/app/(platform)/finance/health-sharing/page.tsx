'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface HealthPool {
  total_balance: number;
  members_count: number;
  claims_this_month: number;
  claims_paid: number;
}

interface HealthClaim {
  id: string;
  member_id: string;
  title: string;
  description: string;
  amount: number;
  category: 'doctor' | 'hospital' | 'rx' | 'dental' | 'vision' | 'mental' | 'emergency';
  status: 'submitted' | 'under_review' | 'approved' | 'paid' | 'denied';
  evidence_url: string | null;
  votes_for: number;
  votes_against: number;
  created_at: string;
  profiles?: { display_name: string };
}

type Tier = 'seed' | 'root' | 'tree' | 'forest';

const TIERS = [
  { id: 'seed' as Tier, label: 'Seed', amount: 25, coverage: 'Telehealth + Rx discounts + emergency only', color: 'bg-green-100 text-green-700' },
  { id: 'root' as Tier, label: 'Root', amount: 75, coverage: 'Full sharing up to $10K/year', color: 'bg-teal-100 text-teal-700' },
  { id: 'tree' as Tier, label: 'Tree', amount: 150, coverage: 'Up to $50K/year + dental + vision', color: 'bg-blue-100 text-blue-700' },
  { id: 'forest' as Tier, label: 'Forest', amount: 250, coverage: 'Unlimited + family + elder care', color: 'bg-purple-100 text-purple-700' },
];

const CATEGORIES = ['doctor', 'hospital', 'rx', 'dental', 'vision', 'mental', 'emergency'];

export default function HealthSharingPage() {
  const [pool, setPool] = useState<HealthPool>({ total_balance: 0, members_count: 0, claims_this_month: 0, claims_paid: 0 });
  const [claims, setClaims] = useState<HealthClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [showClaim, setShowClaim] = useState(false);

  // Claim form
  const [claimTitle, setClaimTitle] = useState('');
  const [claimDesc, setClaimDesc] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimCategory, setClaimCategory] = useState<HealthClaim['category']>('doctor');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('finance_health_claims').select('*, profiles!finance_health_claims_member_id_fkey(display_name)').order('created_at', { ascending: false }).limit(20);
    if (data) setClaims(data as any);
    setLoading(false);
  }

  async function enroll(tier: Tier) {
    if (!user) return;
    setSelectedTier(tier);
    setEnrolled(true);
    toast.success(`Enrolled in ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier!`);
  }

  async function submitClaim() {
    if (!user || !claimTitle.trim() || !claimAmount) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('finance_health_claims').insert({
      member_id: user.id, title: claimTitle.trim(), description: claimDesc.trim(),
      amount: parseFloat(claimAmount), category: claimCategory,
      status: 'submitted', votes_for: 0, votes_against: 0,
    });
    setClaimTitle(''); setClaimDesc(''); setClaimAmount('');
    setShowClaim(false); setSubmitting(false);
    toast.success('Claim submitted for community review');
    loadData();
  }

  async function voteClaim(claimId: string, vote: 'for' | 'against') {
    const supabase = createClient();
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    const field = vote === 'for' ? 'votes_for' : 'votes_against';
    await supabase.from('finance_health_claims').update({ [field]: claim[field] + 1 }).eq('id', claimId);
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, [field]: c[field] + 1 } : c));
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Health Sharing</h1>
          <p className="text-xs text-gray-500">Community pool for medical costs — not insurance, mutual aid</p>
        </div>
        {enrolled && <button onClick={() => setShowClaim(!showClaim)} className="btn-teal text-xs">+ Claim</button>}
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card text-center py-3 bg-pink-50 dark:bg-pink-900/10">
          <p className="text-lg font-bold text-pink-700 dark:text-pink-400">${pool.total_balance.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">Pool Balance</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{pool.members_count}</p>
          <p className="text-[10px] text-gray-500">Members</p>
        </div>
      </div>

      {/* Enrollment */}
      {!enrolled && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Choose Your Tier</h3>
          {TIERS.map(tier => (
            <div key={tier.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold', tier.color)}>{tier.label}</span>
                  <span className="text-sm font-bold text-mly-600">${tier.amount}/mo</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{tier.coverage}</p>
              </div>
              <button onClick={() => enroll(tier.id)} className="btn-teal text-xs">Join</button>
            </div>
          ))}
        </div>
      )}

      {/* Submit Claim */}
      {showClaim && (
        <div className="card space-y-3 border-2 border-pink-200 dark:border-pink-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Submit Health Claim</h3>
          <input value={claimTitle} onChange={e => setClaimTitle(e.target.value)} placeholder="What was the expense?" className="input-field" />
          <textarea value={claimDesc} onChange={e => setClaimDesc(e.target.value)} placeholder="Details (provider, date, what happened)" className="input-field resize-none" rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <input value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="Amount ($)" className="input-field" type="number" />
            <select value={claimCategory} onChange={e => setClaimCategory(e.target.value as any)} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <button onClick={submitClaim} disabled={!claimTitle.trim() || !claimAmount || submitting} className="btn-teal w-full disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      )}

      {/* Claims */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Recent Claims</h3>
        {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-24" />) :
          claims.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No claims yet</p>
            </div>
          ) : claims.map(claim => (
            <div key={claim.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{claim.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{claim.category} · {(claim.profiles as any)?.display_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-mly-600">${claim.amount}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize',
                    claim.status === 'paid' ? 'bg-green-100 text-green-700' :
                    claim.status === 'approved' ? 'bg-teal-100 text-teal-700' :
                    claim.status === 'denied' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  )}>{claim.status.replace('_', ' ')}</span>
                </div>
              </div>
              {claim.status === 'under_review' && user && claim.member_id !== user.id && (
                <div className="flex items-center gap-2">
                  <button onClick={() => voteClaim(claim.id, 'for')} className="flex-1 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg">👍 Approve ({claim.votes_for})</button>
                  <button onClick={() => voteClaim(claim.id, 'against')} className="flex-1 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg">👎 Deny ({claim.votes_against})</button>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
