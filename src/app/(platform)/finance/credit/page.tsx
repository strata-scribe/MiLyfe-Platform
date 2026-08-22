'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface CreditFactor {
  name: string;
  score: number;
  max: number;
  description: string;
  icon: string;
}

interface CreditHistory {
  id: string;
  type: 'loan_repaid' | 'loan_defaulted' | 'circle_completed' | 'contribution' | 'verification' | 'dispute_lost';
  description: string;
  impact: number;
  created_at: string;
}

export default function CommunityCreditPage() {
  const [score, setScore] = useState(75);
  const [factors, setFactors] = useState<CreditFactor[]>([]);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadCreditData(); }, []);

  async function loadCreditData() {
    setLoading(true);
    // In production, this aggregates from multiple tables
    setFactors([
      { name: 'Loan Repayment', score: 25, max: 30, description: 'On-time repayments of peer loans', icon: '💰' },
      { name: 'Circle Participation', score: 15, max: 20, description: 'Savings circle contributions & completions', icon: '🫂' },
      { name: 'Community Standing', score: 18, max: 20, description: 'Your overall platform standing score', icon: '⭐' },
      { name: 'Contribution History', score: 10, max: 15, description: 'Emergency fund & mutual aid contributions', icon: '💝' },
      { name: 'Account Age', score: 7, max: 15, description: 'Time as an active community member', icon: '📅' },
    ]);
    setHistory([]);
    setScore(75);
    setLoading(false);
  }

  function getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-teal-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Building';
  }

  function getScoreRing(score: number): string {
    if (score >= 90) return 'border-green-500';
    if (score >= 70) return 'border-teal-500';
    if (score >= 50) return 'border-yellow-500';
    return 'border-red-500';
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Community Credit Score</h1>
        <p className="text-xs text-gray-500">Your reputation in the community financial system</p>
      </div>

      {/* Score Circle */}
      <div className="card text-center py-6">
        <div className={cn('w-32 h-32 mx-auto rounded-full border-8 flex items-center justify-center', getScoreRing(score))}>
          <div>
            <p className={cn('text-3xl font-bold', getScoreColor(score))}>{score}</p>
            <p className="text-[10px] text-gray-500">out of 100</p>
          </div>
        </div>
        <p className={cn('text-sm font-medium mt-3', getScoreColor(score))}>{getScoreLabel(score)}</p>
        <p className="text-xs text-gray-500 mt-1">Based on your community financial activity</p>
      </div>

      {/* What this means */}
      <div className="card bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
        <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed">
          <strong>This is NOT a traditional credit score.</strong> It reflects how reliable you are within the MiLyfe community. It affects: loan approval speed, savings circle priority, and access to higher-tier mutual aid.
        </p>
      </div>

      {/* Factor Breakdown */}
      <div className="card space-y-3">
        <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex items-center justify-between w-full">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Score Breakdown</h3>
          <span className="text-xs text-gray-400">{showBreakdown ? '▼' : '▶'}</span>
        </button>
        {showBreakdown && (
          <div className="space-y-3">
            {factors.map(factor => (
              <div key={factor.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{factor.icon}</span>
                    <span className="text-xs font-medium text-harbor-800 dark:text-white">{factor.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{factor.score}/{factor.max}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(factor.score / factor.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-gray-400">{factor.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Improve */}
      <div className="card space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">📈 How to Improve</h3>
        {[
          { action: 'Repay a peer loan on time', impact: '+3-5 points', icon: '💰' },
          { action: 'Complete a savings circle', impact: '+5-8 points', icon: '🫂' },
          { action: 'Contribute to emergency fund', impact: '+1-3 points', icon: '🚨' },
          { action: 'Maintain Level 4+ standing', impact: '+2-4 points', icon: '⭐' },
          { action: 'Verify your identity', impact: '+5 points (one-time)', icon: '✓' },
        ].map(item => (
          <div key={item.action} className="flex items-center gap-3 py-1.5">
            <span className="text-sm">{item.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-harbor-800 dark:text-white">{item.action}</p>
            </div>
            <span className="text-[10px] text-green-600 font-medium">{item.impact}</span>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Recent Activity</h3>
        {history.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">No credit events yet — start participating!</p>
        ) : history.map(h => (
          <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-harbor-800 last:border-0">
            <p className="text-xs text-harbor-800 dark:text-white">{h.description}</p>
            <span className={cn('text-xs font-bold', h.impact > 0 ? 'text-green-600' : 'text-red-600')}>{h.impact > 0 ? '+' : ''}{h.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
