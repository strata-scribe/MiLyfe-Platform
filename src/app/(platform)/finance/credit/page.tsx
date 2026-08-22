'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface CreditScore {
  total_score: number;
  factors: CreditFactor[];
  history: ScoreHistoryPoint[];
  last_updated: string;
}

interface CreditFactor {
  name: string;
  score: number;
  max_score: number;
  weight: number;
  description: string;
  icon: string;
}

interface ScoreHistoryPoint {
  date: string;
  score: number;
}

interface ImprovementTip {
  factor: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CommunityCreditPage() {
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<ImprovementTip[]>([]);

  const { user } = useAppStore();

  useEffect(() => { loadCreditScore(); }, []);

  async function loadCreditScore() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('community_credit_scores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      const factors: CreditFactor[] = [
        { name: 'Circle Payments', score: data.circle_payment_score || 0, max_score: 25, weight: 25, description: 'On-time savings circle contributions', icon: '🫂' },
        { name: 'Loan Repayment', score: data.loan_repayment_score || 0, max_score: 25, weight: 25, description: 'Peer loan repayment history', icon: '🤝' },
        { name: 'Bill Split Reliability', score: data.bill_split_score || 0, max_score: 20, weight: 20, description: 'Paying your share on time', icon: '✂️' },
        { name: 'Platform Standing', score: data.standing_score || 0, max_score: 15, weight: 15, description: 'Your community standing level', icon: '⭐' },
        { name: 'Time on Platform', score: data.tenure_score || 0, max_score: 15, weight: 15, description: 'How long you have been a member', icon: '📅' },
      ];

      const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

      setCreditScore({
        total_score: totalScore,
        factors,
        history: data.score_history || [],
        last_updated: data.updated_at || new Date().toISOString(),
      });

      // Generate tips based on lowest factors
      generateTips(factors);
    } else {
      // No score yet — show default
      const defaultFactors: CreditFactor[] = [
        { name: 'Circle Payments', score: 0, max_score: 25, weight: 25, description: 'On-time savings circle contributions', icon: '🫂' },
        { name: 'Loan Repayment', score: 0, max_score: 25, weight: 25, description: 'Peer loan repayment history', icon: '🤝' },
        { name: 'Bill Split Reliability', score: 0, max_score: 20, weight: 20, description: 'Paying your share on time', icon: '✂️' },
        { name: 'Platform Standing', score: 0, max_score: 15, weight: 15, description: 'Your community standing level', icon: '⭐' },
        { name: 'Time on Platform', score: 0, max_score: 15, weight: 15, description: 'How long you have been a member', icon: '📅' },
      ];
      setCreditScore({ total_score: 0, factors: defaultFactors, history: [], last_updated: new Date().toISOString() });
      generateTips(defaultFactors);
    }
    setLoading(false);
  }

  function generateTips(factors: CreditFactor[]) {
    const sorted = [...factors].sort((a, b) => (a.score / a.max_score) - (b.score / b.max_score));
    const tips: ImprovementTip[] = [];

    for (const factor of sorted.slice(0, 3)) {
      const ratio = factor.score / factor.max_score;
      if (ratio >= 0.9) continue;

      let tip = '';
      switch (factor.name) {
        case 'Circle Payments':
          tip = 'Join a savings circle and make your contributions on time every period.';
          break;
        case 'Loan Repayment':
          tip = 'If you have active loans, make payments before the due date. Small consistent payments help.';
          break;
        case 'Bill Split Reliability':
          tip = 'When you are part of a bill split, pay your share within 24 hours of creation.';
          break;
        case 'Platform Standing':
          tip = 'Participate in community events, help others, and stay active to increase your standing.';
          break;
        case 'Time on Platform':
          tip = 'This increases naturally. Stay engaged and your tenure score grows each month.';
          break;
      }

      tips.push({
        factor: factor.name,
        tip,
        priority: ratio < 0.3 ? 'high' : ratio < 0.6 ? 'medium' : 'low',
      });
    }
    setTips(tips);
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Building';
    if (score >= 20) return 'Getting Started';
    return 'New';
  }

  function getScoreRingColor(score: number): string {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 60) return 'stroke-teal-500';
    if (score >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/finance" className="text-gray-400 hover:text-gray-600 text-sm">← Financial Services</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Community Credit Score</h1>
        <p className="text-xs text-gray-500">Your reputation within MiLyfe — built on trust, not debt</p>
      </div>

      {/* Privacy Notice */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          🔒 <strong>Internal only</strong> — Your community credit score is never shared outside MiLyfe. It is not a FICO score and has no effect on traditional credit.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="card skeleton h-40" />
          <div className="card skeleton h-32" />
        </div>
      ) : !user ? (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">Sign in to view your community credit score</p>
        </div>
      ) : creditScore && (
        <>
          {/* Score Display */}
          <div className="card text-center space-y-3">
            <div className="relative inline-block">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-harbor-700" />
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round" className={getScoreRingColor(creditScore.total_score)} strokeDasharray={`${(creditScore.total_score / 100) * 314} 314`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={cn('text-3xl font-bold', getScoreColor(creditScore.total_score))}>{creditScore.total_score}</p>
                <p className="text-[10px] text-gray-500">/100</p>
              </div>
            </div>
            <p className={cn('text-sm font-medium', getScoreColor(creditScore.total_score))}>
              {getScoreLabel(creditScore.total_score)}
            </p>
            <p className="text-[10px] text-gray-400">Last updated: {new Date(creditScore.last_updated).toLocaleDateString()}</p>
          </div>

          {/* Score Breakdown */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Score Breakdown</h3>
            {creditScore.factors.map(factor => (
              <div key={factor.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{factor.icon}</span>
                    <span className="text-xs text-harbor-800 dark:text-white">{factor.name}</span>
                  </div>
                  <span className="text-xs font-medium text-harbor-800 dark:text-white">{factor.score}/{factor.max_score}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', factor.score / factor.max_score >= 0.7 ? 'bg-green-500' : factor.score / factor.max_score >= 0.4 ? 'bg-teal-500' : 'bg-orange-500')} style={{ width: `${(factor.score / factor.max_score) * 100}%` }} />
                </div>
                <p className="text-[10px] text-gray-400">{factor.description} · Weight: {factor.weight}%</p>
              </div>
            ))}
          </div>

          {/* Score History Placeholder */}
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Score Over Time</h3>
            {creditScore.history.length === 0 ? (
              <div className="h-24 flex items-center justify-center bg-gray-50 dark:bg-harbor-900 rounded-lg">
                <p className="text-xs text-gray-400">Chart will appear after your first month</p>
              </div>
            ) : (
              <div className="h-24 flex items-end gap-1 bg-gray-50 dark:bg-harbor-900 rounded-lg p-3">
                {creditScore.history.slice(-12).map((point, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full bg-teal-500 rounded-sm" style={{ height: `${(point.score / 100) * 60}px` }} />
                    <span className="text-[8px] text-gray-400">{new Date(point.date).toLocaleDateString('en', { month: 'short' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvement Tips */}
          {tips.length > 0 && (
            <div className="card space-y-2">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">How to Improve</h3>
              {tips.map((tip, i) => (
                <div key={i} className={cn('p-2 rounded-lg text-xs', tip.priority === 'high' ? 'bg-red-50 dark:bg-red-900/10' : tip.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-green-50 dark:bg-green-900/10')}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={cn('w-1.5 h-1.5 rounded-full', tip.priority === 'high' ? 'bg-red-500' : tip.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500')} />
                    <span className="font-medium text-harbor-800 dark:text-white">{tip.factor}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 pl-3">{tip.tip}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
