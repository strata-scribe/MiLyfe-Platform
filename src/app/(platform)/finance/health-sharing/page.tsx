'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface HealthPool {
  total_balance: number;
  total_members: number;
  recent_claims_count: number;
}

interface HealthTier {
  id: string;
  name: string;
  monthly_cost: number;
  max_claim: number;
  icon: string;
  description: string;
}

interface HealthClaim {
  id: string;
  user_id: string;
  claimant_name: string;
  category: 'medical' | 'dental' | 'vision' | 'rx' | 'emergency';
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'community_vote';
  evidence_url: string | null;
  votes_for: number;
  votes_against: number;
  created_at: string;
}

interface MyEnrollment {
  tier_name: string;
  monthly_cost: number;
  enrolled_at: string;
}

type HealthTab = 'overview' | 'enroll' | 'claim' | 'my-claims';

const TIERS: HealthTier[] = [
  { id: 'seed', name: 'Seed', monthly_cost: 25, max_claim: 2500, icon: '🌱', description: 'Basic coverage for preventive care and minor procedures' },
  { id: 'root', name: 'Root', monthly_cost: 75, max_claim: 7500, icon: '🌿', description: 'Standard coverage including specialist visits and imaging' },
  { id: 'tree', name: 'Tree', monthly_cost: 150, max_claim: 15000, icon: '🌳', description: 'Comprehensive coverage for most medical needs' },
  { id: 'forest', name: 'Forest', monthly_cost: 250, max_claim: 25000, icon: '🌲', description: 'Maximum coverage including major surgeries and extended care' },
];

const CLAIM_CATEGORIES = [
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'dental', label: 'Dental', icon: '🦷' },
  { value: 'vision', label: 'Vision', icon: '👁️' },
  { value: 'rx', label: 'Prescription', icon: '💊' },
  { value: 'emergency', label: 'Emergency', icon: '🚑' },
];

export default function HealthSharingPage() {
  const [tab, setTab] = useState<HealthTab>('overview');
  const [pool, setPool] = useState<HealthPool>({ total_balance: 0, total_members: 0, recent_claims_count: 0 });
  const [enrollment, setEnrollment] = useState<MyEnrollment | null>(null);
  const [claims, setClaims] = useState<HealthClaim[]>([]);
  const [communityVoteClaims, setCommunityVoteClaims] = useState<HealthClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim form
  const [claimCategory, setClaimCategory] = useState<HealthClaim['category']>('medical');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimEvidence, setClaimEvidence] = useState<File | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const { user } = useAppStore();
  const canVote = (user as any)?.standing_level >= 4;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();

    const [poolRes, enrollmentRes, claimsRes, votesRes] = await Promise.all([
      supabase.from('health_sharing_pool').select('*').single(),
      supabase.from('health_sharing_enrollments').select('*').eq('user_id', user.id).single(),
      supabase.from('health_sharing_claims').select('*, profiles(display_name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('health_sharing_claims').select('*, profiles(display_name)').eq('status', 'community_vote').order('created_at', { ascending: false }),
    ]);

    if (poolRes.data) {
      setPool({ total_balance: poolRes.data.balance || 0, total_members: poolRes.data.members_count || 0, recent_claims_count: poolRes.data.recent_claims || 0 });
    }
    if (enrollmentRes.data) {
      setEnrollment({ tier_name: enrollmentRes.data.tier_name, monthly_cost: enrollmentRes.data.monthly_cost, enrolled_at: enrollmentRes.data.created_at });
    }
    if (claimsRes.data) {
      setClaims(claimsRes.data.map((c: any) => ({ ...c, claimant_name: c.profiles?.display_name || 'Member' })));
    }
    if (votesRes.data) {
      setCommunityVoteClaims(votesRes.data.map((c: any) => ({ ...c, claimant_name: c.profiles?.display_name || 'Member' })));
    }
    setLoading(false);
  }

  async function enrollInTier(tier: HealthTier) {
    if (!user) return;
    const supabase = createClient();

    if (enrollment) {
      // Update tier
      const { error } = await supabase.from('health_sharing_enrollments').update({ tier_name: tier.name, monthly_cost: tier.monthly_cost }).eq('user_id', user.id);
      if (!error) {
        toast.success(`Switched to ${tier.name} tier ($${tier.monthly_cost}/mo)`);
        setEnrollment({ tier_name: tier.name, monthly_cost: tier.monthly_cost, enrolled_at: enrollment.enrolled_at });
      }
    } else {
      // New enrollment
      const { error } = await supabase.from('health_sharing_enrollments').insert({ user_id: user.id, tier_name: tier.name, monthly_cost: tier.monthly_cost });
      if (!error) {
        toast.success(`Enrolled in ${tier.name} tier!`);
        setEnrollment({ tier_name: tier.name, monthly_cost: tier.monthly_cost, enrolled_at: new Date().toISOString() });
        setTab('overview');
      }
    }
  }

  async function submitClaim() {
    if (!user || !claimDescription.trim() || !claimAmount) return;
    const amount = parseFloat(claimAmount);
    setSubmittingClaim(true);
    const supabase = createClient();

    let evidenceUrl: string | null = null;
    if (claimEvidence) {
      const path = `health-claims/${user.id}/${Date.now()}_${claimEvidence.name}`;
      const { data: uploadData } = await supabase.storage.from('documents').upload(path, claimEvidence);
      if (uploadData) evidenceUrl = uploadData.path;
    }

    // Claims over $5000 go to community vote
    const status = amount > 5000 ? 'community_vote' : 'pending';

    const { error } = await supabase.from('health_sharing_claims').insert({
      user_id: user.id,
      category: claimCategory,
      description: claimDescription.trim(),
      amount,
      status,
      evidence_url: evidenceUrl,
      votes_for: 0,
      votes_against: 0,
    });

    if (error) {
      toast.error('Failed to submit claim');
    } else {
      toast.success(status === 'community_vote' ? 'Claim submitted for community vote (>$5000)' : 'Claim submitted for review');
      setClaimDescription(''); setClaimAmount(''); setClaimEvidence(null);
      setTab('my-claims');
      loadData();
    }
    setSubmittingClaim(false);
  }

  async function voteOnClaim(claimId: string, approve: boolean) {
    if (!user || !canVote) return;
    const supabase = createClient();
    const claim = communityVoteClaims.find(c => c.id === claimId);
    if (!claim) return;

    const updates = approve ? { votes_for: claim.votes_for + 1 } : { votes_against: claim.votes_against + 1 };
    if (approve && claim.votes_for + 1 >= 5) Object.assign(updates, { status: 'approved' });
    if (!approve && claim.votes_against + 1 >= 5) Object.assign(updates, { status: 'denied' });

    await supabase.from('health_sharing_claims').update(updates).eq('id', claimId);
    await supabase.from('health_claim_votes').insert({ claim_id: claimId, voter_id: user.id, vote: approve ? 'for' : 'against' });
    toast.success(approve ? 'Voted to approve' : 'Voted to deny');
    loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Health Sharing Pool</h1>
        <p className="text-xs text-gray-500">Community-funded health coverage — no insurance companies</p>
      </div>

      {/* Pool Overview Card */}
      <div className="card bg-gradient-to-br from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 border border-pink-200 dark:border-pink-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-harbor-800 dark:text-white">${pool.total_balance.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Pool Balance</p>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-600">{pool.total_members}</p>
            <p className="text-[10px] text-gray-500">Members</p>
          </div>
          <div>
            <p className="text-lg font-bold text-pink-600">{pool.recent_claims_count}</p>
            <p className="text-[10px] text-gray-500">Recent Claims</p>
          </div>
        </div>
      </div>

      {/* My enrollment */}
      {enrollment && (
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{TIERS.find(t => t.name === enrollment.tier_name)?.icon || '🌱'}</span>
            <div>
              <p className="text-xs font-medium text-harbor-800 dark:text-white">{enrollment.tier_name} Tier</p>
              <p className="text-[10px] text-gray-400">Member since {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-teal-600">${enrollment.monthly_cost}/mo</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['overview', 'enroll', 'claim', 'my-claims'] as HealthTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'my-claims' ? 'My Claims' : t === 'enroll' ? 'Tiers' : t === 'claim' ? 'Submit' : t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">How It Works</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>1. Choose a tier based on your budget and needs</p>
              <p>2. Monthly contributions go into the shared pool</p>
              <p>3. When you need care, submit a claim with documentation</p>
              <p>4. Claims under $5,000 reviewed by administrators</p>
              <p>5. Claims over $5,000 go to community vote (Level 4+)</p>
            </div>
          </div>

          {/* Community Vote Claims */}
          {canVote && communityVoteClaims.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Claims Needing Your Vote</h3>
              {communityVoteClaims.map(claim => (
                <div key={claim.id} className="card space-y-2 border-l-4 border-purple-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-harbor-800 dark:text-white">{claim.claimant_name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{claim.category} · {new Date(claim.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">${claim.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{claim.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{claim.votes_for} for / {claim.votes_against} against</span>
                    <div className="flex gap-2">
                      <button onClick={() => voteOnClaim(claim.id, true)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Approve</button>
                      <button onClick={() => voteOnClaim(claim.id, false)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Deny</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tiers */}
      {tab === 'enroll' && (
        <div className="space-y-2">
          {TIERS.map(tier => (
            <div key={tier.id} className={cn('card space-y-2', enrollment?.tier_name === tier.name && 'border-2 border-teal-500')}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tier.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{tier.name}</p>
                    <p className="text-xs text-gray-500">{tier.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-harbor-800 dark:text-white">${tier.monthly_cost}/mo</span>
                  <span> · Max claim: ${tier.max_claim.toLocaleString()}</span>
                </div>
                <button onClick={() => enrollInTier(tier)} className={cn('text-xs px-3 py-1 rounded', enrollment?.tier_name === tier.name ? 'bg-gray-100 text-gray-500 cursor-default' : 'btn-teal')}>
                  {enrollment?.tier_name === tier.name ? 'Current' : enrollment ? 'Switch' : 'Enroll'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Claim */}
      {tab === 'claim' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to submit a claim</p>
          ) : !enrollment ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Enroll in a tier first to submit claims</p>
              <button onClick={() => setTab('enroll')} className="btn-teal text-xs mt-2">View Tiers</button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Submit a Health Claim</h3>
              <select value={claimCategory} onChange={e => setClaimCategory(e.target.value as any)} className="input-field">
                {CLAIM_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                ))}
              </select>
              <textarea value={claimDescription} onChange={e => setClaimDescription(e.target.value)} placeholder="Describe the medical need or procedure..." className="input-field resize-none" rows={3} />
              <input value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="Amount ($)" className="input-field" type="number" />
              <div>
                <label className="text-xs text-gray-500 block mb-1">Evidence (receipt, bill, EOB)</label>
                <input type="file" accept="image/*,.pdf" onChange={e => setClaimEvidence(e.target.files?.[0] || null)} className="input-field text-xs" />
              </div>
              {claimAmount && parseFloat(claimAmount) > 5000 && (
                <p className="text-[10px] text-purple-600">⚡ Claims over $5,000 require community vote from Level 4+ members</p>
              )}
              <button onClick={submitClaim} disabled={!claimDescription.trim() || !claimAmount || submittingClaim} className="btn-teal w-full disabled:opacity-50">
                {submittingClaim ? 'Submitting...' : 'Submit Claim'}
              </button>
            </>
          )}
        </div>
      )}

      {/* My Claims */}
      {tab === 'my-claims' && (
        <div className="space-y-2">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-16" />) :
            claims.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">❤️‍🩹</p>
                <p className="text-sm text-gray-500">No claims submitted</p>
              </div>
            ) : claims.map(claim => (
              <div key={claim.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{CLAIM_CATEGORIES.find(c => c.value === claim.category)?.icon || '🏥'}</span>
                  <div>
                    <p className="text-xs font-medium text-harbor-800 dark:text-white">{claim.description.substring(0, 50)}{claim.description.length > 50 ? '...' : ''}</p>
                    <p className="text-[10px] text-gray-400">{new Date(claim.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">${claim.amount}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize',
                    claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                    claim.status === 'denied' ? 'bg-red-100 text-red-700' :
                    claim.status === 'community_vote' ? 'bg-purple-100 text-purple-700' :
                    'bg-yellow-100 text-yellow-700'
                  )}>{claim.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
