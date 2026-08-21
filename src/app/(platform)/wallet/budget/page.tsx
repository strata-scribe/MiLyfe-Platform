'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Budget { category: string; limit: number; spent: number; icon: string; color: string; }
interface SavingsPot { id: string; name: string; target: number; saved: number; icon: string; }

const defaultBudgets: Budget[] = [
  { category: 'Food', limit: 200, spent: 0, icon: '🍽️', color: '#00C1AE' },
  { category: 'Transport', limit: 100, spent: 0, icon: '🚗', color: '#FFC107' },
  { category: 'Shopping', limit: 150, spent: 0, icon: '🛍️', color: '#8b5cf6' },
  { category: 'Services', limit: 100, spent: 0, icon: '🔧', color: '#1e3a6e' },
  { category: 'Other', limit: 50, spent: 0, icon: '📦', color: '#ef4444' },
];

const defaultPots: SavingsPot[] = [
  { id: '1', name: 'Emergency Fund', target: 500, saved: 120, icon: '🛡️' },
  { id: '2', name: 'New Phone', target: 300, saved: 45, icon: '📱' },
];

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>(defaultBudgets);
  const [pots, setPots] = useState<SavingsPot[]>(defaultPots);
  const [editing, setEditing] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [newPotTarget, setNewPotTarget] = useState('');
  const [showAddPot, setShowAddPot] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Load actual spending from transactions this month
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: txs } = await supabase
        .from('mly_transactions')
        .select('*')
        .eq('from_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (txs) {
        // Categorize spending
        const spending: Record<string, number> = {};
        txs.forEach(tx => {
          const desc = (tx.description || '').toLowerCase();
          if (desc.includes('food') || desc.includes('tamale') || desc.includes('meal')) spending['Food'] = (spending['Food'] || 0) + tx.amount;
          else if (desc.includes('ride') || desc.includes('transport')) spending['Transport'] = (spending['Transport'] || 0) + tx.amount;
          else if (desc.includes('purchased') || desc.includes('buy')) spending['Shopping'] = (spending['Shopping'] || 0) + tx.amount;
          else if (desc.includes('service') || desc.includes('repair')) spending['Services'] = (spending['Services'] || 0) + tx.amount;
          else spending['Other'] = (spending['Other'] || 0) + tx.amount;
        });

        setBudgets(prev => prev.map(b => ({ ...b, spent: spending[b.category] || 0 })));
      }

      // Load saved budgets/pots from localStorage (user-specific)
      const savedBudgets = localStorage.getItem(`milyfe-budgets-${user.id}`);
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
      const savedPots = localStorage.getItem(`milyfe-pots-${user.id}`);
      if (savedPots) setPots(JSON.parse(savedPots));
    };
    load();
  }, [user, supabase]);

  const saveBudgets = (b: Budget[]) => {
    setBudgets(b);
    if (user) localStorage.setItem(`milyfe-budgets-${user.id}`, JSON.stringify(b));
  };

  const savePots = (p: SavingsPot[]) => {
    setPots(p);
    if (user) localStorage.setItem(`milyfe-pots-${user.id}`, JSON.stringify(p));
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Progress ring SVG helper
  const ProgressRing = ({ pct, color, size = 60 }: { pct: number; color: string; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-harbor-700" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
      </svg>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/wallet')} className="text-teal-500 text-sm">← Wallet</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Budget & Savings</h1>
      </div>

      {/* Overview Donut */}
      <div className="card flex items-center gap-4">
        <div className="w-20 h-20 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ value: totalSpent }, { value: Math.max(0, totalRemaining) }]} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={38} strokeWidth={0} startAngle={90} endAngle={-270}>
                <Cell fill="#ef4444" />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-harbor-800 dark:text-white">{Math.round((totalSpent / totalBudget) * 100)}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Monthly Budget</p>
          <p className="text-xs text-gray-500">${totalSpent.toFixed(0)} of ${totalBudget} spent</p>
          <p className={cn('text-sm font-bold mt-0.5', totalRemaining >= 0 ? 'text-teal-500' : 'text-red-500')}>
            ${Math.abs(totalRemaining).toFixed(0)} {totalRemaining >= 0 ? 'remaining' : 'over budget'}
          </p>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">Categories</h2>
          <button onClick={() => setEditing(!editing)} className="text-xs text-teal-500 font-medium">{editing ? 'Done' : 'Edit'}</button>
        </div>

        {budgets.map((b, i) => {
          const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
          const overBudget = pct > 100;
          return (
            <div key={b.category} className="card flex items-center gap-3">
              <div className="relative">
                <ProgressRing pct={pct} color={overBudget ? '#ef4444' : b.color} />
                <span className="absolute inset-0 flex items-center justify-center text-lg">{b.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{b.category}</p>
                  <p className={cn('text-xs font-bold', overBudget ? 'text-red-500' : 'text-gray-600 dark:text-gray-300')}>
                    ${b.spent.toFixed(0)} / ${b.limit}
                  </p>
                </div>
                {editing ? (
                  <input
                    type="number"
                    value={b.limit}
                    onChange={e => { const nb = [...budgets]; nb[i] = { ...b, limit: parseInt(e.target.value) || 0 }; saveBudgets(nb); }}
                    className="input-field !py-1 text-xs mt-1 w-24"
                    min="0"
                  />
                ) : (
                  <div className="w-full bg-gray-200 dark:bg-harbor-700 rounded-full h-1.5 mt-1.5">
                    <div className={cn('h-1.5 rounded-full transition-all', overBudget ? 'bg-red-500' : '')} style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: overBudget ? undefined : b.color }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Savings Pots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">Savings Pots</h2>
          <button onClick={() => setShowAddPot(!showAddPot)} className="text-xs text-teal-500 font-medium">+ Add</button>
        </div>

        {showAddPot && (
          <div className="card space-y-2 border-2 border-dashed border-teal-200 dark:border-teal-800">
            <input type="text" value={newPotName} onChange={e => setNewPotName(e.target.value)} className="input-field !py-2 text-sm" placeholder="Saving for... (e.g., New Tools)" />
            <input type="number" value={newPotTarget} onChange={e => setNewPotTarget(e.target.value)} className="input-field !py-2 text-sm" placeholder="Target amount ($)" min="1" />
            <button onClick={() => {
              if (newPotName && newPotTarget) {
                const np = [...pots, { id: Date.now().toString(), name: newPotName, target: parseInt(newPotTarget), saved: 0, icon: '🎯' }];
                savePots(np);
                setNewPotName(''); setNewPotTarget(''); setShowAddPot(false);
              }
            }} className="btn-teal w-full text-sm !py-2">Create Pot</button>
          </div>
        )}

        {pots.map(pot => {
          const pct = pot.target > 0 ? (pot.saved / pot.target) * 100 : 0;
          return (
            <div key={pot.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{pot.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{pot.name}</p>
                    <p className="text-xs text-gray-500">${pot.saved} of ${pot.target}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-teal-500">{Math.round(pct)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-harbor-700 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all relative" style={{ width: `${Math.min(pct, 100)}%` }}>
                  {pct >= 10 && <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">${pot.saved}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const np = pots.map(p => p.id === pot.id ? { ...p, saved: p.saved + 5 } : p); savePots(np); }} className="flex-1 text-xs py-1.5 bg-teal-100 dark:bg-teal-900/20 text-teal-600 rounded-lg font-medium">+$5</button>
                <button onClick={() => { const np = pots.map(p => p.id === pot.id ? { ...p, saved: p.saved + 10 } : p); savePots(np); }} className="flex-1 text-xs py-1.5 bg-teal-100 dark:bg-teal-900/20 text-teal-600 rounded-lg font-medium">+$10</button>
                <button onClick={() => { const np = pots.map(p => p.id === pot.id ? { ...p, saved: p.saved + 25 } : p); savePots(np); }} className="flex-1 text-xs py-1.5 bg-teal-100 dark:bg-teal-900/20 text-teal-600 rounded-lg font-medium">+$25</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link to full wallet */}
      <Link href="/wallet" className="btn-primary w-full text-sm text-center block">← Back to Wallet</Link>
    </div>
  );
}
