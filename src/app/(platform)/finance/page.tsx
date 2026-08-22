'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface FinanceSummary {
  circles_joined: number;
  loans_active: number;
  emergency_pool: number;
  health_pool: number;
  credit_score: number;
}

const FINANCIAL_SERVICES = [
  { href: '/finance/circles', icon: '🫂', label: 'Savings Circles', desc: 'Tandas — pool & rotate savings', color: 'bg-teal-50 dark:bg-teal-900/20' },
  { href: '/finance/lending', icon: '🤝', label: 'Peer Lending', desc: 'Borrow & lend within community', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { href: '/finance/emergency', icon: '🚨', label: 'Emergency Fund', desc: 'Community safety net', color: 'bg-red-50 dark:bg-red-900/20' },
  { href: '/finance/splitting', icon: '✂️', label: 'Bill Splitting', desc: 'Split expenses fairly', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { href: '/finance/will', icon: '📜', label: 'Will & POA', desc: 'Create legal documents', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { href: '/finance/credit', icon: '📊', label: 'Community Credit', desc: 'Your community reputation score', color: 'bg-green-50 dark:bg-green-900/20' },
  { href: '/finance/health-sharing', icon: '❤️‍🩹', label: 'Health Sharing', desc: 'Pool for medical costs', color: 'bg-pink-50 dark:bg-pink-900/20' },
  { href: '/finance/risk-sharing', icon: '🛡️', label: 'Risk Sharing', desc: 'Property, vehicle & life coverage', color: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { href: '/finance/predatory', icon: '⚠️', label: 'Predatory Lenders', desc: 'Community-flagged bad actors', color: 'bg-orange-50 dark:bg-orange-900/20' },
  { href: '/finance/coaching', icon: '🎓', label: 'Financial Coaching', desc: 'Free peer coaching sessions', color: 'bg-cyan-50 dark:bg-cyan-900/20' },
];

export default function FinanceHubPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    // Simulated summary — in production, aggregate from multiple tables
    setSummary({ circles_joined: 0, loans_active: 0, emergency_pool: 0, health_pool: 0, credit_score: 75 });
    setLoading(false);
  }, []);

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Financial Services</h1>
        <p className="text-xs text-gray-500">Community-powered. No banks. No middlemen. Just people helping people.</p>
      </div>

      {/* Quick Stats */}
      {!loading && summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-mly-600">{summary.credit_score}</p>
            <p className="text-[10px] text-gray-500">Credit Score</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-teal-600">{summary.circles_joined}</p>
            <p className="text-[10px] text-gray-500">Circles</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{summary.loans_active}</p>
            <p className="text-[10px] text-gray-500">Active Loans</p>
          </div>
        </div>
      )}

      {/* Constitutional Notice */}
      <div className="card bg-harbor-50 dark:bg-harbor-900/50 border border-harbor-200 dark:border-harbor-700">
        <p className="text-xs text-harbor-700 dark:text-harbor-300 leading-relaxed">
          <strong>Protected by the Constitution.</strong> These are voluntary mutual aid agreements between consenting adults — not regulated financial products. 1st, 9th, 10th, and 14th Amendment rights. No filings. No permission needed.
        </p>
      </div>

      {/* Services Grid */}
      <div className="space-y-2">
        {FINANCIAL_SERVICES.map(service => (
          <Link key={service.href} href={service.href} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', service.color)}>
              <span className="text-xl">{service.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{service.label}</p>
              <p className="text-xs text-gray-500">{service.desc}</p>
            </div>
            <span className="text-gray-300 dark:text-gray-600">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
