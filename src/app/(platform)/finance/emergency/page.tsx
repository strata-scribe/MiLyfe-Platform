'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface EmergencyPool {
  total_balance: number;
  total_contributors: number;
  total_disbursed: number;
}

interface EmergencyRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  category: 'eviction' | 'medical' | 'car' | 'utility' | 'funeral';
  amount: number;
  description: string;
  evidence_url: string | null;
  status: 'pending' | 'approved' | 'denied' | 'disbursed';
  votes_for: number;
  votes_against: number;
  created_at: string;
}

interface Disbursement {
  id: string;
  request_id: string;
  requester_name: string;
  category: string;
  amount: number;
  disbursed_at: string;
}

type EmergencyTab = 'overview' | 'request' | 'pending' | 'history';

const CATEGORIES = [
  { value: 'eviction', label: '🏠 Eviction Prevention', icon: '🏠' },
  { value: 'medical', label: '🏥 Medical Emergency', icon: '🏥' },
  { value: 'car', label: '🚗 Car Repair/Accident', icon: '🚗' },
  { value: 'utility', label: '💡 Utility Shutoff', icon: '💡' },
  { value: 'funeral', label: '🕊️ Funeral/Burial', icon: '🕊️' },
];

export default function EmergencyFundPage() {
  const [tab, setTab] = useState<EmergencyTab>('overview');
  const [pool, setPool] = useState<EmergencyPool>({ total_balance: 0, total_contributors: 0, total_disbursed: 0 });
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [history, setHistory] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);

  // Request form
  const [category, setCategory] = useState<EmergencyRequest['category']>('medical');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();
  const isCommittee = (user as any)?.standing_level >= 4;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const [poolRes, requestsRes, historyRes] = await Promise.all([
      supabase.from('emergency_fund').select('amount').single(),
      supabase.from('emergency_requests').select('*, profiles(display_name)').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('emergency_requests').select('*, profiles(display_name)').eq('status', 'disbursed').order('created_at', { ascending: false }).limit(20),
    ]);

    if (poolRes.data) {
      setPool({ total_balance: poolRes.data.amount || 0, total_contributors: 0, total_disbursed: 0 });
    }

    // Get aggregate data
    const { data: aggData } = await supabase.from('emergency_fund_stats').select('*').single();
    if (aggData) {
      setPool(prev => ({ ...prev, total_contributors: aggData.total_contributors || 0, total_disbursed: aggData.total_disbursed || 0 }));
    }

    if (requestsRes.data) {
      setRequests(requestsRes.data.map((r: any) => ({
        ...r,
        requester_name: r.profiles?.display_name || 'Member',
      })));
    }

    if (historyRes.data) {
      setHistory(historyRes.data.map((d: any) => ({
        id: d.id,
        request_id: d.id,
        requester_name: d.profiles?.display_name || 'Member',
        category: d.category,
        amount: d.amount,
        disbursed_at: d.updated_at || d.created_at,
      })));
    }

    setLoading(false);
  }

  async function submitRequest() {
    if (!user || !amount || !description.trim()) return;
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > 2000) {
      toast.error('Amount must be between $1 and $2000');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();

    let evidenceUrl: string | null = null;
    if (evidenceFile) {
      const path = `emergency/${user.id}/${Date.now()}_${evidenceFile.name}`;
      const { data: uploadData } = await supabase.storage.from('documents').upload(path, evidenceFile);
      if (uploadData) evidenceUrl = uploadData.path;
    }

    const { error } = await supabase.from('emergency_requests').insert({
      requester_id: user.id,
      category,
      amount: numAmount,
      description: description.trim(),
      evidence_url: evidenceUrl,
      status: 'pending',
      votes_for: 0,
      votes_against: 0,
    });

    if (error) {
      toast.error('Failed to submit request');
    } else {
      toast.success('Emergency request submitted. Committee will review.');
      setAmount(''); setDescription(''); setEvidenceFile(null);
      setTab('pending');
      loadData();
    }
    setSubmitting(false);
  }

  async function voteOnRequest(requestId: string, approve: boolean) {
    if (!user || !isCommittee) return;
    const supabase = createClient();
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const updates = approve
      ? { votes_for: request.votes_for + 1 }
      : { votes_against: request.votes_against + 1 };

    // Auto-approve at 3 votes for, auto-deny at 3 votes against
    if (approve && request.votes_for + 1 >= 3) {
      Object.assign(updates, { status: 'approved' });
    } else if (!approve && request.votes_against + 1 >= 3) {
      Object.assign(updates, { status: 'denied' });
    }

    const { error } = await supabase.from('emergency_requests').update(updates).eq('id', requestId);

    if (!error) {
      await supabase.from('emergency_votes').insert({ request_id: requestId, voter_id: user.id, vote: approve ? 'for' : 'against' });
      toast.success(approve ? 'Vote: Approve' : 'Vote: Deny');
      loadData();
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Emergency Fund</h1>
        <p className="text-xs text-gray-500">Community safety net — when life hits hard, we catch each other</p>
      </div>

      {/* Pool Balance */}
      <div className="card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Pool Balance</p>
          <p className="text-2xl font-bold text-harbor-800 dark:text-white">${pool.total_balance.toLocaleString()} <span className="text-sm font-normal text-gray-500">MLY</span></p>
          <div className="flex justify-center gap-4 text-[10px] text-gray-500">
            <span>{pool.total_contributors} contributors</span>
            <span>${pool.total_disbursed.toLocaleString()} disbursed all-time</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['overview', 'request', 'pending', 'history'] as EmergencyTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'request' ? '🚨 Help' : t === 'pending' ? `Review (${requests.length})` : t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">How It Works</h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p>1. Community members contribute to the emergency pool</p>
              <p>2. When someone faces a crisis, they submit a request (up to $2,000)</p>
              <p>3. Committee members (Level 4+) review and vote</p>
              <p>4. 3 approvals = funds disbursed immediately</p>
            </div>
          </div>
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Eligible Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <div key={cat.value} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{cat.icon}</span>
                  <span>{cat.label.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
          {isCommittee && (
            <div className="card bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-400">
                ✨ You are a committee member (Level 4+). You can review and vote on requests.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Request Help */}
      {tab === 'request' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to request help</p>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Request Emergency Help</h3>
              <p className="text-xs text-gray-500">Describe your situation. Up to $2,000 available per request.</p>

              <select value={category} onChange={e => setCategory(e.target.value as any)} className="input-field">
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount needed (up to $2000)" className="input-field" type="number" max={2000} />

              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your situation — what happened and how the funds will help..." className="input-field resize-none" rows={4} />

              <div>
                <label className="text-xs text-gray-500 block mb-1">Evidence (optional — bill, notice, estimate)</label>
                <input type="file" accept="image/*,.pdf" onChange={e => setEvidenceFile(e.target.files?.[0] || null)} className="input-field text-xs" />
              </div>

              <button onClick={submitRequest} disabled={!amount || !description.trim() || submitting} className="btn-teal w-full disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {tab === 'pending' && (
        <div className="space-y-2">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-28" />) :
            requests.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-500">No pending requests</p>
              </div>
            ) : requests.map(request => (
              <div key={request.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{CATEGORIES.find(c => c.value === request.category)?.icon}</span>
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{request.requester_name}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 capitalize">{request.category} · {new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">${request.amount}</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{request.description}</p>
                {request.evidence_url && (
                  <p className="text-[10px] text-blue-500">📎 Evidence attached</p>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-harbor-800">
                  <span className="text-[10px] text-gray-400">Votes: {request.votes_for} for / {request.votes_against} against</span>
                  {isCommittee && (
                    <div className="flex gap-2">
                      <button onClick={() => voteOnRequest(request.id, true)} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded hover:bg-green-200">✓ Approve</button>
                      <button onClick={() => voteOnRequest(request.id, false)} className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded hover:bg-red-200">✗ Deny</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-14" />) :
            history.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">No disbursements yet</p>
              </div>
            ) : history.map(d => (
              <div key={d.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{CATEGORIES.find(c => c.value === d.category)?.icon || '💸'}</span>
                  <div>
                    <p className="text-xs font-medium text-harbor-800 dark:text-white">{d.requester_name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{d.category} · {new Date(d.disbursed_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-teal-600">${d.amount}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
