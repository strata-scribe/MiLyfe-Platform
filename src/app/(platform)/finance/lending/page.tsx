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
  amount: number;
  purpose: string;
  repayment_months: number;
  interest_rate: number;
  status: 'requesting' | 'funded' | 'repaying' | 'completed' | 'defaulted';
  funded_by: string | null;
  amount_repaid: number;
  monthly_payment: number;
  created_at: string;
  profiles?: { display_name: string };
}

type LendingTab = 'requests' | 'my-loans' | 'request' | 'offer';

export default function PeerLendingPage() {
  const [tab, setTab] = useState<LendingTab>('requests');
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Request form
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [months, setMonths] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadLoans(); }, []);

  async function loadLoans() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('finance_loans').select('*, profiles!finance_loans_borrower_id_fkey(display_name)').order('created_at', { ascending: false }).limit(20);
    if (data) setLoans(data as any);
    setLoading(false);
  }

  async function requestLoan() {
    if (!user || !amount || !purpose.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const amt = parseFloat(amount);
    const mo = parseInt(months);
    await supabase.from('finance_loans').insert({
      borrower_id: user.id, amount: amt, purpose: purpose.trim(),
      repayment_months: mo, interest_rate: 0, status: 'requesting',
      monthly_payment: Math.ceil(amt / mo), amount_repaid: 0,
    });
    setAmount(''); setPurpose(''); setSubmitting(false);
    toast.success('Loan request posted!');
    setTab('requests'); loadLoans();
  }

  async function fundLoan(loanId: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('finance_loans').update({ status: 'funded', funded_by: user.id }).eq('id', loanId);
    toast.success('Loan funded! You\'re helping a neighbor.');
    loadLoans();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Peer Lending</h1>
        <p className="text-xs text-gray-500">Borrow from and lend to your community — zero interest, zero banks</p>
      </div>

      <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
          <strong>How it works:</strong> Request what you need, explain why. A neighbor funds it. You repay monthly. No interest. Your community credit score reflects your reliability.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['requests', 'my-loans', 'request', 'offer'] as LendingTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'my-loans' ? 'My Loans' : t === 'request' ? '+ Borrow' : t === 'offer' ? '+ Lend' : t}</button>
        ))}
      </div>

      {/* Active Requests */}
      {tab === 'requests' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-24" />) :
            loans.filter(l => l.status === 'requesting').length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">No open loan requests</p>
              </div>
            ) : loans.filter(l => l.status === 'requesting').map(loan => (
              <div key={loan.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-mly-600">${loan.amount} MLY</p>
                    <p className="text-sm text-harbor-800 dark:text-white">{loan.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>By: {(loan.profiles as any)?.display_name}</span>
                  <span>·</span>
                  <span>Repay over {loan.repayment_months} months</span>
                  <span>·</span>
                  <span>${loan.monthly_payment}/mo</span>
                </div>
                {user && loan.borrower_id !== user.id && (
                  <button onClick={() => fundLoan(loan.id)} className="btn-teal text-xs w-full">Fund This Loan</button>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* My Loans */}
      {tab === 'my-loans' && (
        <div className="space-y-2">
          {loans.filter(l => l.borrower_id === user?.id || l.funded_by === user?.id).length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No active loans</p>
            </div>
          ) : loans.filter(l => l.borrower_id === user?.id || l.funded_by === user?.id).map(loan => (
            <div key={loan.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{loan.purpose}</p>
                <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize',
                  loan.status === 'repaying' ? 'bg-teal-100 text-teal-700' :
                  loan.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                )}>{loan.status}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">${loan.amount_repaid} / ${loan.amount} repaid</span>
                <span className="text-mly-600 font-bold">{Math.round((loan.amount_repaid / loan.amount) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(loan.amount_repaid / loan.amount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Loan */}
      {tab === 'request' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Request a Loan</h3>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount needed ($MLY)" className="input-field" type="number" />
          <textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="What's this for? Be specific — it helps lenders trust you." className="input-field resize-none" rows={3} />
          <select value={months} onChange={e => setMonths(e.target.value)} className="input-field">
            {[1, 2, 3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>)}
          </select>
          {amount && months && <p className="text-xs text-gray-500">Monthly payment: <strong className="text-mly-600">${Math.ceil(parseFloat(amount || '0') / parseInt(months))} MLY</strong></p>}
          <button onClick={requestLoan} disabled={!amount || !purpose.trim() || submitting} className="btn-teal w-full disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Post Request'}
          </button>
        </div>
      )}

      {/* Offer to Lend */}
      {tab === 'offer' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">💝</p>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Want to help?</p>
          <p className="text-xs text-gray-500 mt-1">Browse the requests tab and fund someone in need.</p>
          <button onClick={() => setTab('requests')} className="btn-teal text-xs mt-4">View Requests →</button>
        </div>
      )}
    </div>
  );
}
