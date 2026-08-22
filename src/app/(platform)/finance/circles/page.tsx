'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface SavingsCircle {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  contribution_amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  max_members: number;
  members_count: number;
  current_round: number;
  total_rounds: number;
  total_pool: number;
  invite_code: string;
  status: 'forming' | 'active' | 'completed';
  next_payout_date: string | null;
  created_at: string;
}

interface CircleMember {
  id: string;
  user_id: string;
  circle_id: string;
  position: number;
  display_name: string;
  has_received_payout: boolean;
}

interface CircleContribution {
  id: string;
  user_id: string;
  circle_id: string;
  amount: number;
  round: number;
  paid_at: string;
  display_name: string;
}

type CircleTab = 'my' | 'create' | 'join' | 'detail';

export default function SavingsCirclesPage() {
  const [tab, setTab] = useState<CircleTab>('my');
  const [circles, setCircles] = useState<SavingsCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircle, setSelectedCircle] = useState<SavingsCircle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [contributions, setContributions] = useState<CircleContribution[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<SavingsCircle['frequency']>('monthly');
  const [maxMembers, setMaxMembers] = useState('10');
  const [creating, setCreating] = useState(false);

  // Join form
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadCircles(); }, []);

  async function loadCircles() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('savings_circles')
      .select('*')
      .or(`creator_id.eq.${user.id},id.in.(select circle_id from circle_members where user_id = '${user.id}')`)
      .order('created_at', { ascending: false });
    if (data) setCircles(data);
    setLoading(false);
  }

  async function loadCircleDetail(circle: SavingsCircle) {
    setSelectedCircle(circle);
    setDetailLoading(true);
    setTab('detail');
    const supabase = createClient();

    const [membersRes, contribRes] = await Promise.all([
      supabase.from('circle_members').select('*, profiles(display_name)').eq('circle_id', circle.id).order('position'),
      supabase.from('circle_contributions').select('*, profiles(display_name)').eq('circle_id', circle.id).order('paid_at', { ascending: false }).limit(20),
    ]);

    if (membersRes.data) {
      setMembers(membersRes.data.map((m: any) => ({ ...m, display_name: m.profiles?.display_name || 'Member' })));
    }
    if (contribRes.data) {
      setContributions(contribRes.data.map((c: any) => ({ ...c, display_name: c.profiles?.display_name || 'Member' })));
    }
    setDetailLoading(false);
  }

  async function createCircle() {
    if (!user || !name.trim() || !amount) return;
    setCreating(true);
    const supabase = createClient();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const totalRounds = parseInt(maxMembers);

    const { error } = await supabase.from('savings_circles').insert({
      creator_id: user.id,
      name: name.trim(),
      description: desc.trim(),
      contribution_amount: parseFloat(amount),
      frequency,
      max_members: parseInt(maxMembers),
      members_count: 1,
      current_round: 0,
      total_rounds: totalRounds,
      total_pool: 0,
      invite_code: code,
      status: 'forming',
    });

    if (error) {
      toast.error('Failed to create circle');
    } else {
      toast.success('Savings circle created! Invite code: ' + code);
      setName(''); setDesc(''); setAmount('');
      setTab('my');
      loadCircles();
    }
    setCreating(false);
  }

  async function joinByCode() {
    if (!user || !inviteCode.trim()) return;
    setJoining(true);
    const supabase = createClient();

    const { data: circle } = await supabase
      .from('savings_circles')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (!circle) {
      toast.error('Circle not found. Check your invite code.');
      setJoining(false);
      return;
    }

    if (circle.members_count >= circle.max_members) {
      toast.error('This circle is full.');
      setJoining(false);
      return;
    }

    const { error } = await supabase.from('circle_members').insert({
      circle_id: circle.id,
      user_id: user.id,
      position: circle.members_count + 1,
      has_received_payout: false,
    });

    if (!error) {
      await supabase.from('savings_circles').update({ members_count: circle.members_count + 1 }).eq('id', circle.id);
      toast.success(`Joined "${circle.name}"!`);
      setInviteCode('');
      setTab('my');
      loadCircles();
    } else {
      toast.error('Already a member or error joining.');
    }
    setJoining(false);
  }

  async function makeContribution(circle: SavingsCircle) {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from('circle_contributions').insert({
      circle_id: circle.id,
      user_id: user.id,
      amount: circle.contribution_amount,
      round: circle.current_round,
    });

    if (error) {
      toast.error('Payment failed');
    } else {
      toast.success(`Contributed $${circle.contribution_amount} MLY`);
      if (selectedCircle?.id === circle.id) loadCircleDetail(circle);
    }
  }

  const FREQ_LABELS: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly' };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Savings Circles</h1>
        <p className="text-xs text-gray-500">Tandas — everyone contributes, everyone gets paid out in rotation</p>
      </div>

      {/* How it works */}
      <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
        <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mb-1">How it works:</p>
        <p className="text-xs text-teal-600 dark:text-teal-300 leading-relaxed">
          10 people each put in $100/month. Each month, one person gets $1000. After 10 months, everyone has received a payout. Zero interest. Zero fees. Community trust.
        </p>
      </div>

      {/* Tabs */}
      {tab !== 'detail' && (
        <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
          {(['my', 'create', 'join'] as CircleTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
              {t === 'my' ? 'My Circles' : t === 'create' ? '+ Create' : '🔑 Join'}
            </button>
          ))}
        </div>
      )}

      {/* My Circles */}
      {tab === 'my' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-20" />) :
            circles.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🫂</p>
                <p className="text-sm text-gray-500">No circles yet — create one or join with an invite code!</p>
              </div>
            ) : circles.map(circle => (
              <button key={circle.id} onClick={() => loadCircleDetail(circle)} className="card w-full text-left space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{circle.name}</p>
                    <p className="text-xs text-gray-500">{circle.description}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize',
                    circle.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    circle.status === 'forming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-600'
                  )}>{circle.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>${circle.contribution_amount} MLY / {FREQ_LABELS[circle.frequency]}</span>
                  <span>·</span>
                  <span>{circle.members_count}/{circle.max_members} members</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Round {circle.current_round}/{circle.total_rounds}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(circle.current_round / circle.total_rounds) * 100}%` }} />
                  </div>
                </div>
              </button>
            ))
          }
        </div>
      )}

      {/* Circle Detail */}
      {tab === 'detail' && selectedCircle && (
        <div className="space-y-3">
          <button onClick={() => { setTab('my'); setSelectedCircle(null); }} className="text-xs text-gray-400 hover:text-gray-600">← Back to My Circles</button>

          <div className="card space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{selectedCircle.name}</h3>
              <span className="text-[10px] bg-gray-100 dark:bg-harbor-800 px-2 py-0.5 rounded">Code: {selectedCircle.invite_code}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-bold text-teal-600">${selectedCircle.contribution_amount}</p>
                <p className="text-[10px] text-gray-500">{FREQ_LABELS[selectedCircle.frequency]}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-harbor-800 dark:text-white">{selectedCircle.current_round}/{selectedCircle.total_rounds}</p>
                <p className="text-[10px] text-gray-500">Round</p>
              </div>
              <div>
                <p className="text-sm font-bold text-mly-600">${selectedCircle.total_pool}</p>
                <p className="text-[10px] text-gray-500">Pool</p>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          {selectedCircle.status === 'active' && (
            <button onClick={() => makeContribution(selectedCircle)} className="btn-teal w-full">
              Pay ${selectedCircle.contribution_amount} MLY Contribution
            </button>
          )}

          {/* Members & Payout Order */}
          <div className="card space-y-2">
            <h4 className="text-xs font-bold text-harbor-800 dark:text-white">Members & Payout Order</h4>
            {detailLoading ? <div className="skeleton h-20" /> : members.length === 0 ? (
              <p className="text-xs text-gray-500">No members loaded</p>
            ) : members.map((member, idx) => (
              <div key={member.id} className={cn('flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-harbor-800 last:border-0', idx === selectedCircle.current_round ? 'bg-teal-50 dark:bg-teal-900/20 -mx-2 px-2 rounded' : '')}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">#{member.position}</span>
                  <span className="text-xs text-harbor-800 dark:text-white">{member.display_name}</span>
                  {idx === selectedCircle.current_round && <span className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-1.5 py-0.5 rounded">Next Payout</span>}
                </div>
                {member.has_received_payout && <span className="text-[10px] text-green-600">✓ Received</span>}
              </div>
            ))}
          </div>

          {/* Contribution History */}
          <div className="card space-y-2">
            <h4 className="text-xs font-bold text-harbor-800 dark:text-white">Recent Contributions</h4>
            {contributions.length === 0 ? (
              <p className="text-xs text-gray-500">No contributions yet</p>
            ) : contributions.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                <span className="text-harbor-800 dark:text-white">{c.display_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600">${c.amount} MLY</span>
                  <span className="text-gray-400">R{c.round}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create */}
      {tab === 'create' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to create a circle</p>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Start a Savings Circle</h3>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Circle name" className="input-field" />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description — what's this circle for?" className="input-field resize-none" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contribution ($MLY)" className="input-field" type="number" />
                <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="input-field">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <input value={maxMembers} onChange={e => setMaxMembers(e.target.value)} placeholder="Max members" className="input-field" type="number" />
              <button onClick={createCircle} disabled={!name.trim() || !amount || creating} className="btn-teal w-full disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Circle'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Join */}
      {tab === 'join' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to join a circle</p>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Join by Invite Code</h3>
              <p className="text-xs text-gray-500">Got an invite code from a friend? Enter it below to join their circle.</p>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Enter invite code (e.g. ABC123)" className="input-field uppercase" />
              <button onClick={joinByCode} disabled={!inviteCode.trim() || joining} className="btn-teal w-full disabled:opacity-50">
                {joining ? 'Joining...' : 'Join Circle'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
