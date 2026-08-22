'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface LoanRequest {
  id: string;
  borrower_id: string;
  borrower_name: string;
  borrower_standing: number;
  amount: number;
  purpose: string;
  repayment_timeline: string;
  status: 'open' | 'funded' | 'repaying' | 'completed' | 'defaulted';
  created_at: string;
}

interface PeerLoan {
  id: string;
  request_id: string;
  borrower_id: string;
  lender_id: string;
  amount: number;
  purpose: string;
  repayment_timeline: string;
  total_repaid: number;
  monthly_payment: number;
  status: 'active' | 'completed' | 'defaulted';
  borrower_name: string;
  lender_name: string;
  created_at: string;
}

type LendingTab = 'borrow' | 'lend' | 'my-loans';

export default function PeerLendingPage() {
  const [tab, setTab] = useState<LendingTab>('lend');
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [myLoans, setMyLoans] = useState<PeerLoan[]>([]);
  const [loading, setLoading] = useState(true);

  // Borrow form
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [timeline, setTimeline] = useState('3 months');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    if (tab === 'lend') {
      const { data } = await supabase
        .from('loan_requests')
        .select('*, profiles(display_name, standing_level)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (data) {
        setRequests(data.map((r: any) => ({
          ...r,
          borrower_name: r.profiles?.display_name || 'Community Member',
          borrower_standing: r.profiles?.standing_level || 1,
        })));
      }
    } else if (tab === 'my-loans' && user) {
      const { data } = await supabase
        .from('peer_loans')
        .select('*, borrower:profiles!borrower_id(display_name), lender:profiles!lender_id(display_name)')
        .or(`borrower_id.eq.${user.id},lender_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (data) {
        setMyLoans(data.map((l: any) => ({
          ...l,
          borrower_name: l.borrower?.display_name || 'Borrower',
          lender_name: l.lender?.display_name || 'Lender',
        })));
      }
    }
    setLoading(false);
  }

  async function submitLoanRequest() {
    if (!user || !amount || !purpose.trim()) return;
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > 1000) {
      toast.error('Amount must be between $1 and $1000 MLY');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('loan_requests').insert({
      borrower_id: user.id,
      amount: numAmount,
      purpose: purpose.trim(),
      repayment_timeline: timeline,
      status: 'open',
    });

    if (error) {
      toast.error('Failed to submit request');
    } else {
      toast.success('Loan request posted!');
      setAmount(''); setPurpose('');
      setTab('lend');
    }
    setSubmitting(false);
  }

  async function acceptLoanRequest(request: LoanRequest) {
    if (!user) return;
    const supabase = createClient();

    const monthsMatch = request.repayment_timeline.match(/(\d+)/);
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 3;
    const monthlyPayment = Math.ceil(request.amount / months);

    const { error } = await supabase.from('peer_loans').insert({
      request_id: request.id,
      borrower_id: request.borrower_id,
      lender_id: user.id,
      amount: request.amount,
      purpose: request.purpose,
      repayment_timeline: request.repayment_timeline,
      total_repaid: 0,
      monthly_payment: monthlyPayment,
      status: 'active',
    });

    if (!error) {
      await supabase.from('loan_requests').update({ status: 'funded' }).eq('id', request.id);
      toast.success('Loan funded! You are now a lender.');
      loadData();
    } else {
      toast.error('Failed to fund loan');
    }
  }

  async function makePayment(loan: PeerLoan) {
    if (!user) return;
    const supabase = createClient();
    const newTotal = loan.total_repaid + loan.monthly_payment;
    const isComplete = newTotal >= loan.amount;

    const { error } = await supabase.from('peer_loans').update({
      total_repaid: newTotal,
      status: isComplete ? 'completed' : 'active',
    }).eq('id', loan.id);

    if (!error) {
      await supabase.from('loan_payments').insert({
        loan_id: loan.id,
        payer_id: user.id,
        amount: loan.monthly_payment,
      });
      toast.success(isComplete ? 'Loan fully repaid!' : `Payment of $${loan.monthly_payment} MLY made`);
      loadData();
    } else {
      toast.error('Payment failed');
    }
  }

  function getStandingBadge(level: number) {
    const labels = ['', 'Seedling', 'Growing', 'Rooted', 'Pillar', 'Elder'];
    const colors = ['', 'bg-gray-100 text-gray-600', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'];
    return { label: labels[level] || 'New', color: colors[level] || colors[1] };
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Peer Micro-Lending</h1>
        <p className="text-xs text-gray-500">Borrow up to $1000 MLY from your community. No banks, no credit checks.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['borrow', 'lend', 'my-loans'] as LendingTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'my-loans' ? 'My Loans' : t === 'borrow' ? 'Borrow' : 'Lend'}
          </button>
        ))}
      </div>

      {/* Borrow Tab */}
      {tab === 'borrow' && (
        <div className="card space-y-3">
          {!user ? (
            <p className="text-sm text-gray-500 text-center py-4">Sign in to request a loan</p>
          ) : (
            <>
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Request a Loan</h3>
              <p className="text-xs text-gray-500">Community members will see your request and can choose to fund it.</p>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (up to 1000 $MLY)" className="input-field" type="number" max={1000} />
              <textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="What do you need it for?" className="input-field resize-none" rows={3} />
              <select value={timeline} onChange={e => setTimeline(e.target.value)} className="input-field">
                <option value="1 month">Repay in 1 month</option>
                <option value="2 months">Repay in 2 months</option>
                <option value="3 months">Repay in 3 months</option>
                <option value="6 months">Repay in 6 months</option>
              </select>
              <button onClick={submitLoanRequest} disabled={!amount || !purpose.trim() || submitting} className="btn-teal w-full disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Post Loan Request'}
              </button>
              <p className="text-[10px] text-gray-400 text-center">Zero interest. Repayment is trust-based. Your community credit score is affected.</p>
            </>
          )}
        </div>
      )}

      {/* Lend Tab */}
      {tab === 'lend' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            requests.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🤝</p>
                <p className="text-sm text-gray-500">No open loan requests right now</p>
              </div>
            ) : requests.map(request => {
              const badge = getStandingBadge(request.borrower_standing);
              return (
                <div key={request.id} className="card space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">{request.borrower_name}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', badge.color)}>{badge.label}</span>
                    </div>
                    <p className="text-sm font-bold text-teal-600">${request.amount} MLY</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{request.purpose}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Repay: {request.repayment_timeline}</span>
                    {user && user.id !== request.borrower_id && (
                      <button onClick={() => acceptLoanRequest(request)} className="btn-teal text-xs px-3 py-1">Fund This Loan</button>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* My Loans Tab */}
      {tab === 'my-loans' && (
        <div className="space-y-2">
          {!user ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Sign in to view your loans</p>
            </div>
          ) : loading ? [1, 2].map(i => <div key={i} className="card skeleton h-24" />) :
            myLoans.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm text-gray-500">No active loans</p>
              </div>
            ) : myLoans.map(loan => {
              const isBorrower = loan.borrower_id === user.id;
              const progress = (loan.total_repaid / loan.amount) * 100;
              return (
                <div key={loan.id} className="card space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{isBorrower ? 'Borrowed from' : 'Lent to'}</p>
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">
                        {isBorrower ? loan.lender_name : loan.borrower_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-harbor-800 dark:text-white">${loan.amount} MLY</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize',
                        loan.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        loan.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      )}>{loan.status}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{loan.purpose}</p>
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>${loan.total_repaid} repaid</span>
                      <span>${loan.amount - loan.total_repaid} remaining</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  {/* Payment button for borrower */}
                  {isBorrower && loan.status === 'active' && (
                    <button onClick={() => makePayment(loan)} className="btn-teal w-full text-xs">
                      Make Payment (${loan.monthly_payment} MLY)
                    </button>
                  )}
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}
