'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'overview' | 'budget' | 'operations' | 'audit'

interface PlatformStat {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
}

interface BudgetCategory {
  id: string
  name: string
  allocated: number
  spent: number
  percentage: number
  color: string
}

interface ModerationAction {
  id: string
  type: string
  count: number
  period: string
}

interface AuditEntry {
  id: string
  action: string
  actor: string
  target: string
  timestamp: string
  category: 'moderation' | 'system' | 'financial' | 'governance'
}

export default function TransparencyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStat[]>([])
  const [budget, setBudget] = useState<BudgetCategory[]>([])
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [timeRange, setTimeRange] = useState('30d')
  const [auditFilter, setAuditFilter] = useState('all')
  const supabase = createClient()
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
      setStats([
        { label: 'Active Users', value: '4,827', change: '+12%', trend: 'up' },
        { label: 'Transactions Today', value: '1,243', change: '+8%', trend: 'up' },
        { label: '$MLY in Circulation', value: '142,500', change: '+3.2%', trend: 'up' },
        { label: 'Platform Uptime', value: '99.97%', change: '0%', trend: 'stable' },
        { label: 'Avg Response Time', value: '145ms', change: '-12%', trend: 'down' },
        { label: 'Active Proposals', value: '8', change: '+2', trend: 'up' },
      ])
      setBudget([
        { id: '1', name: 'Community Programs', allocated: 35000, spent: 28450, percentage: 35, color: 'bg-teal-500' },
        { id: '2', name: 'Infrastructure & Maintenance', allocated: 25000, spent: 21200, percentage: 25, color: 'bg-harbor-500' },
        { id: '3', name: 'Safety & Guild Operations', allocated: 15000, spent: 12800, percentage: 15, color: 'bg-mly-500' },
        { id: '4', name: 'Education & Skills', allocated: 12000, spent: 9600, percentage: 12, color: 'bg-purple-500' },
        { id: '5', name: 'Health & Wellness', allocated: 8000, spent: 6200, percentage: 8, color: 'bg-blue-500' },
        { id: '6', name: 'Reserve Fund', allocated: 5000, spent: 0, percentage: 5, color: 'bg-green-500' },
      ])
      setModerationActions([
        { id: '1', type: 'Content Removed', count: 23, period: 'Last 30 days' },
        { id: '2', type: 'Warnings Issued', count: 15, period: 'Last 30 days' },
        { id: '3', type: 'Accounts Suspended', count: 2, period: 'Last 30 days' },
        { id: '4', type: 'Appeals Processed', count: 8, period: 'Last 30 days' },
        { id: '5', type: 'Reports Resolved', count: 45, period: 'Last 30 days' },
        { id: '6', type: 'Avg Resolution Time', count: 4, period: 'Hours' },
      ])
      setAuditLog([
        { id: '1', action: 'Proposal #47 approved by vote', actor: 'Governance System', target: 'Community Garden Expansion', timestamp: '2024-01-15 4:00 PM', category: 'governance' },
        { id: '2', action: 'Budget allocation released', actor: 'Treasury Module', target: '2,400 $MLY to Safety Guild', timestamp: '2024-01-15 2:30 PM', category: 'financial' },
        { id: '3', action: 'Content removed (spam)', actor: 'Mod Team', target: 'Forum post #2847', timestamp: '2024-01-15 1:15 PM', category: 'moderation' },
        { id: '4', action: 'System maintenance completed', actor: 'DevOps', target: 'Database optimization', timestamp: '2024-01-15 3:00 AM', category: 'system' },
        { id: '5', action: 'New delegate registered', actor: 'Governance System', target: 'User: PatriciaChen', timestamp: '2024-01-14 6:00 PM', category: 'governance' },
        { id: '6', action: 'Reward distribution batch', actor: 'Recording Module', target: '150 $MLY to 12 contributors', timestamp: '2024-01-14 5:00 PM', category: 'financial' },
        { id: '7', action: 'Account suspended for ToS violation', actor: 'Mod Team', target: 'User: spammer42', timestamp: '2024-01-14 11:30 AM', category: 'moderation' },
      ])
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="card p-4 rounded-xl">
                <p className="text-xs text-harbor-500">{stat.label}</p>
                <p className="text-2xl font-bold text-harbor-800 mt-1">{stat.value}</p>
                <span className={cn('text-xs font-medium', stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-teal-600' : 'text-harbor-500')}>{stat.change} {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">$MLY Budget Allocation</h2>
          <div className="card p-5 rounded-xl">
            <div className="flex h-6 rounded-full overflow-hidden mb-4">
              {budget.map(cat => (
                <div key={cat.id} className={cn('h-full', cat.color)} style={{ width: `${cat.percentage}%` }} title={cat.name} />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {budget.map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-full', cat.color)} />
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
                <div className={cn('h-full rounded-full', cat.color)} style={{ width: `${(cat.spent / cat.allocated) * 100}%` }} />
              </div>
            </div>
          ))}
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
            <h3 className="font-semibold text-harbor-800 mb-3">Moderation Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {moderationActions.map(action => (
                <div key={action.id} className="p-3 bg-harbor-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-harbor-700">{action.count}</p>
                  <p className="text-xs text-harbor-500 mt-1">{action.type}</p>
                  <p className="text-xs text-harbor-400">{action.period}</p>
                </div>
              ))}
            </div>
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
          {filteredAudit.map(entry => (
            <div key={entry.id} className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-harbor-800 text-sm">{entry.action}</p>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', auditCatColor(entry.category))}>{entry.category}</span>
              </div>
              <p className="text-xs text-harbor-500">Target: {entry.target} | Actor: {entry.actor}</p>
              <p className="text-xs text-harbor-400 mt-1">{entry.timestamp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
