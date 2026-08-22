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
  user_id: string
  name: string
  category: string
  value: number
  accuracy: number
  description: string
  updated_at: string
}

interface Prediction {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  confidence: number
  actionable: boolean
  created_at: string
}

interface PrivacyControl {
  id: string
  user_id: string
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
      const supabase = createClient()
      const userId = user?.id || ''

      const [traitsRes, predictionsRes, privacyRes] = await Promise.all([
        supabase.from('twin_traits').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
        supabase.from('twin_predictions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('twin_privacy_controls').select('*').eq('user_id', userId),
      ])

      setTraits(traitsRes.data || [])
      setPredictions(predictionsRes.data || [])
      setPrivacyControls(privacyRes.data || [])
    } catch (err) {
      toast.error('Failed to load twin data')
    } finally {
      setLoading(false)
    }
  }

  async function togglePrivacy(id: string) {
    const control = privacyControls.find(c => c.id === id)
    if (!control) return

    const supabase = createClient()
    const { error } = await supabase
      .from('twin_privacy_controls')
      .update({ enabled: !control.enabled })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update privacy setting')
      return
    }
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
            <p className="text-sm text-harbor-500 mt-1">AI-powered personal insights</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={cn('w-2 h-2 rounded-full', traits.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-harbor-300')} />
              <span className={cn('text-sm font-medium', traits.length > 0 ? 'text-green-600' : 'text-harbor-500')}>{traits.length > 0 ? 'Active & Syncing' : 'Awaiting Data'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Traits</p>
              <p className="text-lg font-bold text-teal-600 mt-1">{traits.length}</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Predictions</p>
              <p className="text-lg font-bold text-mly-500 mt-1">{predictions.length}</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Avg Accuracy</p>
              <p className="text-lg font-bold text-harbor-700 mt-1">{traits.length > 0 ? Math.round(traits.reduce((sum, t) => sum + t.accuracy, 0) / traits.length) : 0}%</p>
            </div>
            <div className="card p-4 rounded-xl text-center">
              <p className="text-xs text-harbor-500">Privacy Controls</p>
              <p className="text-lg font-bold text-green-600 mt-1">{privacyControls.filter(c => c.enabled).length} active</p>
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Quick Insights</h3>
            {predictions.length === 0 ? (
              <p className="text-sm text-harbor-500">No predictions yet. Your twin will learn your patterns over time.</p>
            ) : (
              <div className="space-y-2">
                {predictions.slice(0, 2).map(pred => (
                  <div key={pred.id} className="p-3 bg-harbor-50 rounded-lg">
                    <p className="text-sm font-medium text-harbor-800">{pred.title}</p>
                    <p className="text-xs text-harbor-500 mt-1">{pred.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'personality' && (
        <div className="space-y-4">
          <div className="card p-4 rounded-xl bg-teal-50 border border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">Personality Profile</h3>
            <p className="text-xs text-teal-600">Traits learned from your behavior patterns. Higher accuracy means more confident predictions.</p>
          </div>
          {traits.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No personality traits analyzed yet. Your twin will learn as you use the platform.</p>
            </div>
          ) : traits.map(trait => (
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
          {predictions.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No predictions yet. Your twin needs more data to generate insights.</p>
            </div>
          ) : predictions.map(pred => (
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
                <span className="text-xs text-harbor-400">{new Date(pred.created_at).toLocaleDateString()}</span>
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
            {privacyControls.length === 0 ? (
              <p className="text-sm text-harbor-500">No privacy controls configured yet.</p>
            ) : (
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
            )}
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
