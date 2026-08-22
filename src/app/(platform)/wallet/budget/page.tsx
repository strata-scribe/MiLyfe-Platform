'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

interface Transaction {
  id: string
  from_id: string
  to_id: string | null
  amount: number
  type: string | null
  description: string | null
  metadata: Record<string, string> | null
  created_at: string
}

interface SpendingCategory {
  category: string
  amount: number
  icon: string
  color: string
}

interface MonthlyTotal {
  month: string
  total: number
}

export default function BudgetPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [spending, setSpending] = useState<SpendingCategory[]>([])
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([])
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>({})
  const [editingBudgets, setEditingBudgets] = useState(false)
  const supabase = createClient()
  const { user } = useAppStore()

  const categoryConfig: Record<string, { icon: string; color: string }> = {
    food: { icon: '🍽️', color: '#00C1AE' },
    transport: { icon: '🚗', color: '#FFC107' },
    shopping: { icon: '🛍️', color: '#8b5cf6' },
    services: { icon: '🔧', color: '#1e3a6e' },
    transfer: { icon: '💸', color: '#3b82f6' },
    other: { icon: '📦', color: '#ef4444' },
  }

  useEffect(() => {
    loadBudgetData()
  }, [])

  async function loadBudgetData() {
    setLoading(true)
    try {
      if (!user?.id) { setLoading(false); return }

      // Get this month's start
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Fetch current month spending
      const { data: txData } = await supabase
        .from('mly_transactions')
        .select('*')
        .eq('from_id', user.id)
        .gte('created_at', startOfMonth)
        .order('created_at', { ascending: false })

      if (txData) {
        setTransactions(txData)
        // Categorize spending
        const categoryTotals: Record<string, number> = {}
        txData.forEach(tx => {
          const cat = tx.metadata?.category || categorizeByDescription(tx.description || '')
          categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount
        })
        const spendingList: SpendingCategory[] = Object.entries(categoryTotals).map(([cat, amount]) => ({
          category: cat,
          amount,
          icon: categoryConfig[cat]?.icon || '📦',
          color: categoryConfig[cat]?.color || '#6b7280',
        }))
        setSpending(spendingList.sort((a, b) => b.amount - a.amount))
      }

      // Load last 6 months totals
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
      const { data: allTxData } = await supabase
        .from('mly_transactions')
        .select('amount, created_at')
        .eq('from_id', user.id)
        .gte('created_at', sixMonthsAgo)

      if (allTxData) {
        const monthlyMap: Record<string, number> = {}
        allTxData.forEach(tx => {
          const d = new Date(tx.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthlyMap[key] = (monthlyMap[key] || 0) + tx.amount
        })
        const totals = Object.entries(monthlyMap)
          .map(([month, total]) => ({ month, total }))
          .sort((a, b) => a.month.localeCompare(b.month))
        setMonthlyTotals(totals)
      }

      // Load budget targets from user_settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('appearance_prefs')
        .eq('user_id', user.id)
        .single()

      if (settingsData?.appearance_prefs?.budget_targets) {
        setBudgetTargets(settingsData.appearance_prefs.budget_targets as Record<string, number>)
      }
    } finally {
      setLoading(false)
    }
  }

  function categorizeByDescription(desc: string): string {
    const lower = desc.toLowerCase()
    if (lower.includes('food') || lower.includes('meal') || lower.includes('restaurant')) return 'food'
    if (lower.includes('ride') || lower.includes('transport') || lower.includes('gas')) return 'transport'
    if (lower.includes('purchase') || lower.includes('buy') || lower.includes('shop')) return 'shopping'
    if (lower.includes('service') || lower.includes('repair') || lower.includes('subscription')) return 'services'
    if (lower.includes('send') || lower.includes('transfer')) return 'transfer'
    return 'other'
  }

  async function saveBudgetTargets(targets: Record<string, number>) {
    if (!user?.id) return
    setBudgetTargets(targets)
    const { data: existing } = await supabase
      .from('user_settings')
      .select('appearance_prefs')
      .eq('user_id', user.id)
      .single()

    const currentPrefs = existing?.appearance_prefs || {}
    const updatedPrefs = { ...currentPrefs, budget_targets: targets }

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, appearance_prefs: updatedPrefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    toast.success('Budget targets saved!')
  }

  const totalSpent = spending.reduce((acc, s) => acc + s.amount, 0)
  const totalBudget = Object.values(budgetTargets).reduce((acc, v) => acc + v, 0)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Budget & Spending</h1>
          <p className="text-harbor-500 mt-1">Track your $MLY spending this month</p>
        </div>
        <Link href="/wallet" className="btn-teal px-4 py-2 rounded-lg text-sm">← Back to Wallet</Link>
      </div>

      {/* Overview */}
      <div className="card p-5 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-harbor-800">Monthly Overview</h2>
          {totalBudget > 0 && (
            <span className={cn('text-sm font-bold', totalSpent <= totalBudget ? 'text-teal-600' : 'text-red-500')}>
              {totalSpent <= totalBudget ? `$${(totalBudget - totalSpent).toFixed(0)} remaining` : `$${(totalSpent - totalBudget).toFixed(0)} over budget`}
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-harbor-900">{totalSpent.toFixed(0)} $MLY <span className="text-sm font-normal text-harbor-500">spent this month</span></p>
        {totalBudget > 0 && (
          <div className="w-full h-3 bg-harbor-100 rounded-full overflow-hidden mt-3">
            <div className={cn('h-full rounded-full transition-all', totalSpent > totalBudget ? 'bg-red-500' : 'bg-teal-500')} style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
          </div>
        )}
      </div>

      {/* Spending by Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-harbor-800">Spending by Category</h2>
          <button onClick={() => setEditingBudgets(!editingBudgets)} className="text-xs text-teal-500 font-medium">{editingBudgets ? 'Done' : 'Set Budgets'}</button>
        </div>
        {spending.length === 0 ? (
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">No spending this month yet.</p>
          </div>
        ) : spending.map(cat => {
          const budget = budgetTargets[cat.category] || 0
          const pct = budget > 0 ? (cat.amount / budget) * 100 : 0
          const overBudget = budget > 0 && cat.amount > budget
          return (
            <div key={cat.category} className="card p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-harbor-800 capitalize">{cat.category}</p>
                    <p className={cn('text-sm font-bold', overBudget ? 'text-red-500' : 'text-harbor-700')}>
                      {cat.amount.toFixed(0)} $MLY {budget > 0 && <span className="text-xs font-normal text-harbor-400">/ {budget}</span>}
                    </p>
                  </div>
                  {budget > 0 && (
                    <div className="w-full h-1.5 bg-harbor-100 rounded-full mt-1.5">
                      <div className={cn('h-full rounded-full transition-all', overBudget ? 'bg-red-500' : '')} style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: overBudget ? undefined : cat.color }} />
                    </div>
                  )}
                  {editingBudgets && (
                    <input type="number" className="input-field !py-1 text-xs mt-2 w-32" placeholder="Set budget..." value={budgetTargets[cat.category] || ''} onChange={e => {
                      const updated = { ...budgetTargets, [cat.category]: parseInt(e.target.value) || 0 }
                      setBudgetTargets(updated)
                    }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {editingBudgets && (
          <button onClick={() => { saveBudgetTargets(budgetTargets); setEditingBudgets(false) }} className="btn-teal w-full py-2 rounded-lg text-sm">Save Budget Targets</button>
        )}
      </div>

      {/* Monthly Totals */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-harbor-800">Monthly Totals</h2>
        {monthlyTotals.length === 0 ? (
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">No transaction history yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {monthlyTotals.map(m => (
              <div key={m.month} className="card p-4 rounded-xl text-center">
                <p className="text-xs text-harbor-500">{m.month}</p>
                <p className="text-lg font-bold text-harbor-800 mt-1">{m.total.toFixed(0)} $MLY</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-harbor-800">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">No transactions this month.</p>
          </div>
        ) : transactions.slice(0, 10).map(tx => (
          <div key={tx.id} className="card p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-harbor-800">{tx.description || tx.type || 'Transaction'}</p>
              <p className="text-xs text-harbor-500">{new Date(tx.created_at).toLocaleDateString()}</p>
            </div>
            <span className="text-sm font-bold text-red-500">-{tx.amount} $MLY</span>
          </div>
        ))}
      </div>
    </div>
  )
}
