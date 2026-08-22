'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Utility {
  id: string;
  home_id: string;
  type: string;
  provider: string;
  account_number: string | null;
  amount: number;
  due_date: string;
  status: 'paid' | 'due' | 'overdue';
  month: string;
  usage: number | null;
  usage_unit: string | null;
  created_at: string;
}

interface UtilitySummary {
  type: string;
  total_spent: number;
  avg_monthly: number;
  last_amount: number;
  trend: 'up' | 'down' | 'stable';
}

type UtilityTab = 'bills' | 'usage' | 'providers';

const UTILITY_ICONS: Record<string, string> = {
  electric: '⚡', water: '💧', gas: '🔥', internet: '🌐',
  trash: '🗑️', sewer: '🚿', phone: '📱', insurance: '🛡️',
};

const UTILITY_TYPES = ['electric', 'water', 'gas', 'internet', 'trash', 'sewer', 'phone', 'insurance'];

export default function UtilitiesPage() {
  const [tab, setTab] = useState<UtilityTab>('bills');
  const [bills, setBills] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Add bill form
  const [billType, setBillType] = useState('electric');
  const [billProvider, setBillProvider] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDue, setBillDue] = useState('');
  const [billUsage, setBillUsage] = useState('');
  const [adding, setAdding] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [filterType]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('mihome_utilities').select('*').order('due_date', { ascending: false }).limit(50);
    if (filterType !== 'all') query = query.eq('type', filterType);
    const { data } = await query;
    if (data) setBills(data);
    setLoading(false);
  }

  async function addBill() {
    if (!user || !billAmount || !billDue) return;
    setAdding(true);
    const supabase = createClient();
    await supabase.from('mihome_utilities').insert({
      home_id: null, type: billType, provider: billProvider.trim(),
      amount: parseFloat(billAmount), due_date: billDue, status: 'due',
      month: billDue.substring(0, 7), usage: parseFloat(billUsage) || null,
      usage_unit: billType === 'electric' ? 'kWh' : billType === 'water' ? 'gal' : billType === 'gas' ? 'therms' : null,
    });
    setBillProvider(''); setBillAmount(''); setBillDue(''); setBillUsage('');
    setShowAdd(false); setAdding(false);
    loadData();
  }

  async function markPaid(billId: string) {
    const supabase = createClient();
    await supabase.from('mihome_utilities').update({ status: 'paid' }).eq('id', billId);
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'paid' } : b));
  }

  const totalDue = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
  const overdueCount = bills.filter(b => b.status === 'overdue').length;

  // Group by type for summary
  const summaryByType = UTILITY_TYPES.map(type => {
    const typeBills = bills.filter(b => b.type === type);
    const total = typeBills.reduce((s, b) => s + b.amount, 0);
    return { type, count: typeBills.length, total, avg: typeBills.length ? total / typeBills.length : 0 };
  }).filter(s => s.count > 0);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Utilities</h1>
          <p className="text-xs text-gray-500">Bills, usage & providers</p>
        </div>
        {user && <button onClick={() => setShowAdd(!showAdd)} className="btn-teal text-xs">+ Bill</button>}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-red-600">${totalDue.toFixed(0)}</p>
          <p className="text-[10px] text-gray-500">Due</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-green-600">${totalPaid.toFixed(0)}</p>
          <p className="text-[10px] text-gray-500">Paid</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-orange-600">{overdueCount}</p>
          <p className="text-[10px] text-gray-500">Overdue</p>
        </div>
      </div>

      {/* Add Bill Form */}
      {showAdd && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Add Bill</h3>
          <select value={billType} onChange={e => setBillType(e.target.value)} className="input-field">
            {UTILITY_TYPES.map(t => <option key={t} value={t}>{UTILITY_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input value={billProvider} onChange={e => setBillProvider(e.target.value)} placeholder="Provider name" className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <input value={billAmount} onChange={e => setBillAmount(e.target.value)} placeholder="Amount ($)" className="input-field" type="number" />
            <input value={billDue} onChange={e => setBillDue(e.target.value)} className="input-field" type="date" />
          </div>
          <input value={billUsage} onChange={e => setBillUsage(e.target.value)} placeholder="Usage (optional)" className="input-field" type="number" />
          <button onClick={addBill} disabled={!billAmount || !billDue || adding} className="btn-teal w-full disabled:opacity-50">
            {adding ? 'Adding...' : 'Add Bill'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['bills', 'usage', 'providers'] as UtilityTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Bills Tab */}
      {tab === 'bills' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('all')} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap', filterType === 'all' ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>All</button>
            {UTILITY_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={cn('px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize', filterType === t ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>{UTILITY_ICONS[t]} {t}</button>
            ))}
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            bills.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📄</p>
                <p className="text-sm text-gray-500">No bills tracked yet</p>
              </div>
            ) : bills.map(bill => (
              <div key={bill.id} className="card flex items-center gap-3">
                <span className="text-xl">{UTILITY_ICONS[bill.type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{bill.type}</p>
                  <p className="text-xs text-gray-500">{bill.provider || 'Unknown'} · Due {new Date(bill.due_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">${bill.amount.toFixed(2)}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize',
                      bill.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      bill.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    )}>{bill.status}</span>
                  </div>
                  {bill.status !== 'paid' && (
                    <button onClick={() => markPaid(bill.id)} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200">Pay</button>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Usage Tab */}
      {tab === 'usage' && (
        <div className="space-y-3">
          {summaryByType.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">Add bills to see usage breakdown</p>
            </div>
          ) : summaryByType.map(s => (
            <div key={s.type} className="card">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{UTILITY_ICONS[s.type]}</span>
                <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{s.type}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">${s.total.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">${s.avg.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-500">Average</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">{s.count}</p>
                  <p className="text-[10px] text-gray-500">Bills</p>
                </div>
              </div>
              {/* Simple bar */}
              <div className="mt-2 h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min((s.avg / (summaryByType[0]?.avg || 1)) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Providers Tab */}
      {tab === 'providers' && (
        <div className="space-y-3">
          {(() => {
            const providers = Array.from(new Set(bills.map(b => b.provider).filter(Boolean)));
            return providers.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">No providers tracked yet</p>
              </div>
            ) : providers.map(provider => {
              const provBills = bills.filter(b => b.provider === provider);
              const types = Array.from(new Set(provBills.map(b => b.type)));
              const total = provBills.reduce((s, b) => s + b.amount, 0);
              return (
                <div key={provider} className="card flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-harbor-800 flex items-center justify-center">
                    <span className="text-sm">{UTILITY_ICONS[types[0]] || '🏢'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{provider}</p>
                    <p className="text-xs text-gray-500 capitalize">{types.join(', ')} · {provBills.length} bills</p>
                  </div>
                  <p className="text-sm font-bold text-harbor-800 dark:text-white">${total.toFixed(0)}</p>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
