'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'overview' | 'budget' | 'operations' | 'audit'

interface PlatformStat {
  id: string
  stat_key: string
  stat_value: string
  change_pct: string
  trend: string
  updated_at: string
}

interface BudgetCategory {
  id: string
  name: string
  allocated: number
  spent: number
  percentage: number
  color: string
}

interface AuditEntry {
  id: string
  action: string
  actor: string
  target: string
  category: string
  created_at: string
}

export default function TransparencyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStat[]>([])
  const [budget, setBudget] = useState<BudgetCategory[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [timeRange, setTimeRange] = useState('30d')
  const [auditFilter, setAuditFilter] = useState('all')
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'budget', label: 'Budget' },
    { key: 'operations', label: 'Operations' },
    { key: 'audit', label: 'Audit' },
  ]

  useEffect(() => {
    loadTransparencyData()
  }, [])

  async function loadTransparencyData() {
    setLoading(true)
    try {
      const supabase = createClient()

      const [statsRes, budgetRes, auditRes] = await Promise.all([
        supabase.from('platform_stats').select('*').order('updated_at', { ascending: false }),
        supabase.from('platform_budget').select('*').order('created_at', { ascending: true }),
        supabase.from('platform_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      ])

      setStats(statsRes.data || [])
      setBudget(budgetRes.data || [])
      setAuditLog(auditRes.data || [])
    } catch (err) {
      toast.error('Failed to load transparency data')
    } finally {
      setLoading(false)
    }
  }

  const filteredAudit = auditLog.filter(e => auditFilter === 'all' || e.category === auditFilter)

  const auditCatColor = (cat: string) => {
    switch (cat) {
      case 'governance': return 'bg-purple-100 text-purple-700'
      case 'financial': return 'bg-mly-100 text-mly-700'
      case 'moderation': return 'bg-red-100 text-red-700'
      case 'system': return 'bg-harbor-100 text-harbor-600'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Platform Transparency</h1>
          <p className="text-harbor-500 mt-1">Full visibility into platform operations</p>
        </div>
        <Link href="/dashboard" className="btn-teal px-4 py-2 rounded-lg text-sm">Back to Dashboard</Link>
      </div>

      <nav className="flex gap-1 bg-harbor-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-sm' : 'text-harbor-600 hover:bg-harbor-200')}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-harbor-800">Real-Time Stats</h2>
            <select className="input-field px-3 py-1.5 rounded-lg text-sm" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          {stats.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No platform stats available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map(stat => (
                <div key={stat.id} className="card p-4 rounded-xl">
                  <p className="text-xs text-harbor-500">{stat.stat_key}</p>
                  <p className="text-2xl font-bold text-harbor-800 mt-1">{stat.stat_value}</p>
                  <span className={cn('text-xs font-medium', stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-teal-600' : 'text-harbor-500')}>
                    {stat.change_pct} {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">$MLY Budget Allocation</h2>
          {budget.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No budget data available yet.</p>
            </div>
          ) : (
            <>
              <div className="card p-5 rounded-xl">
                <div className="flex h-6 rounded-full overflow-hidden mb-4">
                  {budget.map(cat => (
                    <div key={cat.id} className={cn('h-full', cat.color || 'bg-teal-500')} style={{ width: `${cat.percentage}%` }} title={cat.name} />
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {budget.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <span className={cn('w-3 h-3 rounded-full', cat.color || 'bg-teal-500')} />
                      <div>
                        <p className="text-xs text-harbor-600 font-medium">{cat.name}</p>
                        <p className="text-xs text-harbor-400">{cat.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="font-semibold text-harbor-800">Spending Detail</h3>
              {budget.map(cat => (
                <div key={cat.id} className="card p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-harbor-800 text-sm">{cat.name}</p>
                    <p className="text-sm text-harbor-600">{cat.spent.toLocaleString()} / {cat.allocated.toLocaleString()} $MLY</p>
                  </div>
                  <div className="w-full h-2 bg-harbor-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', cat.color || 'bg-teal-500')} style={{ width: `${cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Platform Operations</h2>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">System Health</h3>
            <div className="grid grid-cols-3 gap-4">
              {[{ label: 'API', status: 'healthy' }, { label: 'Database', status: 'healthy' }, { label: 'CDN', status: 'healthy' }].map(service => (
                <div key={service.label} className="text-center p-3 bg-green-50 rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block mb-1" />
                  <p className="text-sm font-medium text-harbor-700">{service.label}</p>
                  <p className="text-xs text-green-600 capitalize">{service.status}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Recent Activity</h3>
            {auditLog.length === 0 ? (
              <p className="text-sm text-harbor-500">No operational activity recorded yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { type: 'Moderation', count: auditLog.filter(a => a.category === 'moderation').length },
                  { type: 'Financial', count: auditLog.filter(a => a.category === 'financial').length },
                  { type: 'Governance', count: auditLog.filter(a => a.category === 'governance').length },
                  { type: 'System', count: auditLog.filter(a => a.category === 'system').length },
                ].map(action => (
                  <div key={action.type} className="p-3 bg-harbor-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-harbor-700">{action.count}</p>
                    <p className="text-xs text-harbor-500 mt-1">{action.type} Actions</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-harbor-800">Audit Log</h2>
            <div className="flex gap-1">
              {['all', 'governance', 'financial', 'moderation', 'system'].map(filter => (
                <button key={filter} onClick={() => setAuditFilter(filter)} className={cn('px-3 py-1 rounded text-xs font-medium capitalize', auditFilter === filter ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{filter}</button>
              ))}
            </div>
          </div>
          {filteredAudit.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No audit entries found{auditFilter !== 'all' ? ` for "${auditFilter}"` : ''}.</p>
            </div>
          ) : filteredAudit.map(entry => (
            <div key={entry.id} className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-harbor-800 text-sm">{entry.action}</p>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', auditCatColor(entry.category))}>{entry.category}</span>
              </div>
              <p className="text-xs text-harbor-500">Target: {entry.target} | Actor: {entry.actor}</p>
              <p className="text-xs text-harbor-400 mt-1">{new Date(entry.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
