'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface EmergencyRequest {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  amount_needed: number;
  amount_raised: number;
  category: 'medical' | 'housing' | 'food' | 'transportation' | 'childcare' | 'legal' | 'other';
  urgency: 'critical' | 'high' | 'moderate';
  status: 'pending' | 'approved' | 'funded' | 'denied';
  evidence_url: string | null;
  committee_votes: { for: number; against: number };
  created_at: string;
  profiles?: { display_name: string };
}

interface PoolStats {
  total_pool: number;
  members_count: number;
  monthly_contribution: number;
  requests_this_month: number;
}

export default function EmergencyFundPage() {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [stats, setStats] = useState<PoolStats>({ total_pool: 0, members_count: 0, monthly_contribution: 25, requests_this_month: 0 });
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);

  // Request form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<EmergencyRequest['category']>('other');
  const [urgency, setUrgency] = useState<EmergencyRequest['urgency']>('moderate');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('finance_emergency').select('*, profiles!finance_emergency_requester_id_fkey(display_name)').order('created_at', { ascending: false });
    if (data) setRequests(data as any);
    setLoading(false);
  }

  async function submitRequest() {
    if (!user || !title.trim() || !amount) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('finance_emergency').insert({
      requester_id: user.id, title: title.trim(), description: desc.trim(),
      amount_needed: parseFloat(amount), amount_raised: 0, category, urgency,
      status: 'pending', committee_votes: { for: 0, against: 0 },
    });
    setTitle(''); setDesc(''); setAmount(''); setShowRequest(false); setSubmitting(false);
    toast.success('Emergency request submitted for committee review');
    loadData();
  }

  async function contribute(requestId: string, amt: number) {
    if (!user) return;
    const supabase = createClient();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    await supabase.from('finance_emergency').update({ amount_raised: req.amount_raised + amt }).eq('id', requestId);
    toast.success(`Contributed $${amt} MLY`);
    loadData();
  }

  const URGENCY_COLORS: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Emergency Fund</h1>
          <p className="text-xs text-gray-500">Community safety net for crisis moments</p>
        </div>
        {user && <button onClick={() => setShowRequest(!showRequest)} className="btn-teal text-xs">🆘 Request Help</button>}
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card text-center py-3 bg-green-50 dark:bg-green-900/10">
          <p className="text-lg font-bold text-green-700 dark:text-green-400">${stats.total_pool.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">Pool Balance (MLY)</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{stats.members_count}</p>
          <p className="text-[10px] text-gray-500">Contributing Members</p>
        </div>
      </div>

      {/* Request Form */}
      {showRequest && (
        <div className="card space-y-3 border-2 border-red-200 dark:border-red-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">🆘 Request Emergency Assistance</h3>
          <p className="text-xs text-gray-500">A committee of Level 4+ members will review within 48 hours.</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What happened?" className="input-field" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Explain your situation — the committee needs context to help." className="input-field resize-none" rows={4} />
          <div className="grid grid-cols-2 gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount needed ($MLY)" className="input-field" type="number" />
            <select value={urgency} onChange={e => setUrgency(e.target.value as any)} className="input-field">
              <option value="critical">Critical (24hr)</option>
              <option value="high">High (48hr)</option>
              <option value="moderate">Moderate (1 week)</option>
            </select>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="input-field">
            <option value="medical">Medical Emergency</option>
            <option value="housing">Housing Crisis</option>
            <option value="food">Food Insecurity</option>
            <option value="transportation">Transportation</option>
            <option value="childcare">Childcare</option>
            <option value="legal">Legal Emergency</option>
            <option value="other">Other</option>
          </select>
          <button onClick={submitRequest} disabled={!title.trim() || !amount || submitting} className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      )}

      {/* Active Requests */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Active Requests</h3>
        {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-28" />) :
          requests.filter(r => r.status !== 'denied').length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">💚</p>
              <p className="text-sm text-gray-500">No emergency requests right now</p>
            </div>
          ) : requests.filter(r => r.status !== 'denied').map(req => (
            <div key={req.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize', URGENCY_COLORS[req.urgency])}>{req.urgency}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{req.category}</span>
                  </div>
                  <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1">{req.title}</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize',
                  req.status === 'approved' ? 'bg-green-100 text-green-700' :
                  req.status === 'funded' ? 'bg-teal-100 text-teal-700' :
                  'bg-gray-100 text-gray-600'
                )}>{req.status}</span>
              </div>
              {req.description && <p className="text-xs text-gray-500 line-clamp-2">{req.description}</p>}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">${req.amount_raised} / ${req.amount_needed} raised</span>
                <span className="text-mly-600 font-bold">{Math.round((req.amount_raised / req.amount_needed) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (req.amount_raised / req.amount_needed) * 100)}%` }} />
              </div>
              {req.status === 'approved' && user && req.requester_id !== user.id && (
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map(amt => (
                    <button key={amt} onClick={() => contribute(req.id, amt)} className="flex-1 py-1.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200">
                      ${amt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
