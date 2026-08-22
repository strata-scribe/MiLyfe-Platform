'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'home' | 'personality' | 'predictions' | 'settings'

interface PersonalityTrait {
  id: string
  name: string
  category: 'spending' | 'social' | 'health'
  value: number
  accuracy: number
  description: string
}

interface Prediction {
  id: string
  type: 'expense' | 'recommendation' | 'schedule'
  title: string
  description: string
  confidence: number
  actionable: boolean
  timestamp: string
}

interface PrivacyControl {
  id: string
  name: string
  description: string
  enabled: boolean
  category: string
}

export default function TwinPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [loading, setLoading] = useState(true)
  const [traits, setTraits] = useState<PersonalityTrait[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [privacyControls, setPrivacyControls] = useState<PrivacyControl[]>([])
  const [twinStatus, setTwinStatus] = useState({ lastSync: '5 minutes ago', dataPoints: 1247, accuracy: 87, status: 'active' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'personality', label: 'Personality' },
    { key: 'predictions', label: 'Predictions' },
    { key: 'settings', label: 'Settings' },
  ]

  useEffect(() => {
    loadTwinData()
  }, [])

  async function loadTwinData() {
    setLoading(true)
    try {
      setTraits([
        { id: '1', name: 'Budget-Conscious Spender', category: 'spending', value: 82, accuracy: 91, description: 'You tend to research prices before purchasing and prefer deals over impulse buys.' },
        { id: '2', name: 'Community Connector', category: 'social', value: 74, accuracy: 85, description: 'You frequently engage in community events and maintain diverse social connections.' },
        { id: '3', name: 'Health-Aware', category: 'health', value: 68, accuracy: 79, description: 'You track health metrics regularly but could benefit from more consistent exercise.' },
        { id: '4', name: 'Evening Active', category: 'social', value: 88, accuracy: 93, description: 'Most of your social and productive activity happens in the evening hours.' },
        { id: '5', name: 'Savings-Focused', category: 'spending', value: 71, accuracy: 87, description: 'You consistently set aside a portion of income and avoid unnecessary subscriptions.' },
        { id: '6', name: 'Routine-Driven', category: 'health', value: 65, accuracy: 76, description: 'You follow predictable daily patterns with some variation on weekends.' },
      ])
      setPredictions([
        { id: '1', type: 'expense', title: 'Grocery Bill Higher Than Usual', description: 'Based on your shopping patterns, your grocery spending this week may exceed budget by ~$45. Consider using community market for produce.', confidence: 78, actionable: true, timestamp: '2024-01-15' },
        { id: '2', type: 'recommendation', title: 'Join Thursday Community Walk', description: 'Your activity levels are below your weekly average. The Thursday community walk matches your schedule and social preferences.', confidence: 85, actionable: true, timestamp: '2024-01-15' },
        { id: '3', type: 'schedule', title: 'Reschedule Wednesday Appointment', description: 'Traffic patterns suggest your Wednesday 3 PM appointment will have a 25-min commute vs usual 12 min. Consider leaving early or rescheduling.', confidence: 72, actionable: true, timestamp: '2024-01-15' },
        { id: '4', type: 'expense', title: 'Subscription Renewal Coming', description: 'Your streaming service renews in 3 days ($15.99). Usage has been low this month — consider pausing to save.', confidence: 95, actionable: true, timestamp: '2024-01-14' },
      ])
      setPrivacyControls([
        { id: '1', name: 'Spending Data', description: 'Allow twin to analyze your transaction patterns', enabled: true, category: 'financial' },
        { id: '2', name: 'Location History', description: 'Use location data for commute and schedule insights', enabled: true, category: 'location' },
        { id: '3', name: 'Social Activity', description: 'Analyze community engagement patterns', enabled: true, category: 'social' },
        { id: '4', name: 'Health Metrics', description: 'Access health and activity data for wellness predictions', enabled: false, category: 'health' },
        { id: '5', name: 'Communication Patterns', description: 'Analyze messaging frequency and timing', enabled: false, category: 'communication' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function togglePrivacy(id: string) {
    setPrivacyControls(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
    toast.success('Privacy setting updated')
  }

  function handleResetTwin() {
    toast.success('Digital twin reset initiated. This may take a few minutes.')
  }

  function handleExportData() {
    toast.success('Data export started. You will receive a download link via email.')
  }

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'spending': return '💰'
      case 'social': return '🤝'
      case 'health': return '❤️'
      default: return '🧠'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg" />
        <div className="skeleton h-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Digital Twin</h1>
          <p className="text-harbor-500 mt-1">Your AI-powered personal avatar</p>
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

      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="card p-8 rounded-xl text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-mly-500 flex items-center justify-center mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-xl font-bold text-harbor-900">Your Digital Twin</h2>
            <p className="text-sm text-harbor-500 mt-1">DiceBear Avatar Placeholder</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600 font-medium">Active & Syncing</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Last Sync</p>
              <p className="text-lg font-bold text-teal-600 mt-1">{twinStatus.lastSync}</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Data Points</p>
              <p className="text-lg font-bold text-mly-500 mt-1">{twinStatus.dataPoints.toLocaleString()}</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Accuracy</p>
              <p className="text-lg font-bold text-harbor-700 mt-1">{twinStatus.accuracy}%</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Status</p>
              <p className="text-lg font-bold text-green-600 mt-1 capitalize">{twinStatus.status}</p>
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Quick Insights</h3>
            <div className="space-y-2">
              {predictions.slice(0, 2).map(pred => (
                <div key={pred.id} className="p-3 bg-harbor-50 rounded-lg">
                  <p className="text-sm font-medium text-harbor-800">{pred.title}</p>
                  <p className="text-xs text-harbor-500 mt-1">{pred.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'personality' && (
        <div className="space-y-4">
          <div className="card p-4 rounded-xl bg-teal-50 border border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">Personality Profile</h3>
            <p className="text-xs text-teal-600">Traits learned from your behavior patterns. Higher accuracy means more confident predictions.</p>
          </div>
          {traits.map(trait => (
            <div key={trait.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcon(trait.category)}</span>
                  <h4 className="font-semibold text-harbor-800">{trait.name}</h4>
                </div>
                <span className="text-xs text-harbor-500">Accuracy: {trait.accuracy}%</span>
              </div>
              <p className="text-sm text-harbor-500 mb-3">{trait.description}</p>
              <div className="w-full h-2 bg-harbor-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all" style={{ width: `${trait.value}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-harbor-400">Low</span>
                <span className="text-xs text-teal-600 font-medium">{trait.value}%</span>
                <span className="text-xs text-harbor-400">High</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">AI Predictions & Suggestions</h2>
          {predictions.map(pred => (
            <div key={pred.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pred.type === 'expense' ? '💸' : pred.type === 'recommendation' ? '💡' : '📅'}</span>
                  <h4 className="font-semibold text-harbor-800">{pred.title}</h4>
                </div>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', pred.confidence >= 80 ? 'bg-green-100 text-green-700' : pred.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-harbor-100 text-harbor-600')}>{pred.confidence}% confidence</span>
              </div>
              <p className="text-sm text-harbor-500 mb-3">{pred.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-harbor-400">{pred.timestamp}</span>
                {pred.actionable && <button className="btn-teal px-3 py-1 rounded text-xs">Take Action</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-4">Privacy Controls</h3>
            <p className="text-sm text-harbor-500 mb-4">Control what data your digital twin can access and analyze.</p>
            <div className="space-y-3">
              {privacyControls.map(control => (
                <div key={control.id} className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg">
                  <div>
                    <p className="font-medium text-harbor-800 text-sm">{control.name}</p>
                    <p className="text-xs text-harbor-500">{control.description}</p>
                  </div>
                  <button onClick={() => togglePrivacy(control.id)} className={cn('w-11 h-6 rounded-full transition-colors relative', control.enabled ? 'bg-teal-500' : 'bg-harbor-300')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', control.enabled ? 'left-5' : 'left-0.5')} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 rounded-xl">
              <h3 className="font-semibold text-harbor-800 mb-2">Reset Twin</h3>
              <p className="text-sm text-harbor-500 mb-3">Clear all learned patterns and start fresh. This cannot be undone.</p>
              <button onClick={handleResetTwin} className="px-4 py-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Reset Digital Twin</button>
            </div>
            <div className="card p-5 rounded-xl">
              <h3 className="font-semibold text-harbor-800 mb-2">Export Data</h3>
              <p className="text-sm text-harbor-500 mb-3">Download all data your twin has collected in JSON format.</p>
              <button onClick={handleExportData} className="btn-teal px-4 py-2 rounded-lg text-sm">Export All Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
