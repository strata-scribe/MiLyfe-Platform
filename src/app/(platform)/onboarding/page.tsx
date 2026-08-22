'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'welcome' | 'setup' | 'explore' | 'complete'

interface SetupField {
  id: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'photo'
  value: string
  options?: string[]
  completed: boolean
}

interface ExploreCard {
  id: string
  title: string
  description: string
  icon: string
  action: string
  reward: string
  completed: boolean
}

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('welcome')
  const [loading, setLoading] = useState(true)
  const [setupFields, setSetupFields] = useState<SetupField[]>([])
  const [exploreCards, setExploreCards] = useState<ExploreCard[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [setupProgress, setSetupProgress] = useState(0)
  const [notificationPrefs, setNotificationPrefs] = useState({ push: true, email: true, sms: false })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'setup', label: 'Setup' },
    { key: 'explore', label: 'Explore' },
    { key: 'complete', label: 'Complete' },
  ]

  const coreValues = [
    { icon: '🤝', title: 'Community First', desc: 'We look out for each other' },
    { icon: '🔒', title: 'Privacy & Ownership', desc: 'Your data belongs to you' },
    { icon: '💰', title: 'Economic Empowerment', desc: 'Build wealth together with $MLY' },
    { icon: '🌱', title: 'Growth & Learning', desc: 'Always evolving, always improving' },
  ]

  useEffect(() => {
    loadOnboardingData()
  }, [])

  async function loadOnboardingData() {
    setLoading(true)
    try {
      const fields: SetupField[] = [
        { id: '1', label: 'Display Name', type: 'text', value: '', completed: false },
        { id: '2', label: 'Neighborhood', type: 'select', value: '', options: ['Riverside', 'Springfield', 'Downtown', 'Eastside', 'Northside', 'San Marco', 'Beaches', 'Mandarin', 'Westside'], completed: false },
        { id: '3', label: 'Interests', type: 'multiselect', value: '', options: ['Health', 'Finance', 'Safety', 'Education', 'Arts', 'Sports', 'Gardening', 'Technology', 'Cooking', 'Music'], completed: false },
        { id: '4', label: 'Profile Photo', type: 'photo', value: '', completed: false },
      ]
      setSetupFields(fields)
      setSetupProgress(fields.filter(f => f.completed).length / fields.length * 100)
      setExploreCards([
        { id: '1', title: 'Visit the Forum', description: 'Introduce yourself in the community forum and meet your neighbors.', icon: '💬', action: '/forum', reward: '5 $MLY', completed: false },
        { id: '2', title: 'Earn Your First $MLY', description: 'Complete a simple task or record a community observation to earn $MLY.', icon: '💰', action: '/record', reward: '10 $MLY', completed: false },
        { id: '3', title: 'Check Your Health', description: 'Set up your health profile and get personalized wellness recommendations.', icon: '❤️', action: '/health', reward: '5 $MLY', completed: false },
        { id: '4', title: 'Find Neighbors', description: 'Discover community members in your neighborhood and connect.', icon: '🏘️', action: '/directory', reward: '5 $MLY', completed: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleFieldUpdate(fieldId: string, value: string) {
    setSetupFields(prev => {
      const updated = prev.map(f => f.id === fieldId ? { ...f, value, completed: value.length > 0 } : f)
      setSetupProgress(updated.filter(f => f.completed).length / updated.length * 100)
      return updated
    })
  }

  function handleCompleteSetup() {
    const incomplete = setupFields.filter(f => !f.completed)
    if (incomplete.length > 0) {
      toast.error(`Please complete: ${incomplete.map(f => f.label).join(', ')}`)
      return
    }
    toast.success('Profile setup complete!')
    setActiveTab('explore')
  }

  function handleCompleteExplore(cardId: string) {
    setExploreCards(prev => prev.map(c => c.id === cardId ? { ...c, completed: true } : c))
    toast.success('Activity completed! $MLY reward earned.')
  }

  function handleFinishOnboarding() {
    setShowConfetti(true)
    toast.success('Welcome to MiLyfe! You earned 25 $MLY as a welcome gift!')
    setTimeout(() => setShowConfetti(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉🎊🎉</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Welcome to MiLyfe</h1>
          <p className="text-harbor-500 mt-1">Let&apos;s get you set up for the community</p>
        </div>
        <Link href="/dashboard" className="btn-teal px-4 py-2 rounded-lg text-sm">Skip to Dashboard</Link>
      </div>

      <nav className="flex gap-1 bg-harbor-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-sm' : 'text-harbor-600 hover:bg-harbor-200')}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'welcome' && (
        <div className="space-y-6">
          <div className="card p-8 rounded-xl text-center bg-gradient-to-br from-teal-50 to-mly-50">
            <div className="w-20 h-20 mx-auto rounded-full bg-teal-100 flex items-center justify-center mb-4">
              <span className="text-4xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-harbor-900 mb-2">Welcome to the Community!</h2>
            <p className="text-harbor-500 max-w-lg mx-auto">MiLyfe is more than an app — it&apos;s your neighborhood coming together to build something better. Let&apos;s walk through what makes us special.</p>
          </div>
          <div className="card p-6 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-2">Community Intro Video</h3>
            <div className="h-48 bg-harbor-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl">▶️</span>
                <p className="text-sm text-harbor-500 mt-2">Video placeholder: Community Introduction</p>
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-harbor-800 text-lg">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreValues.map((value, idx) => (
              <div key={idx} className="card p-5 rounded-xl flex items-start gap-3">
                <span className="text-2xl">{value.icon}</span>
                <div>
                  <h4 className="font-semibold text-harbor-800">{value.title}</h4>
                  <p className="text-sm text-harbor-500 mt-1">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab('setup')} className="btn-teal w-full py-3 rounded-xl font-medium">Get Started →</button>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-harbor-800">Profile Completion</h3>
              <span className="text-sm text-teal-600 font-medium">{Math.round(setupProgress)}%</span>
            </div>
            <div className="w-full h-2.5 bg-harbor-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${setupProgress}%` }} />
            </div>
          </div>
          <div className="card p-6 rounded-xl space-y-4">
            {setupFields.map(field => (
              <div key={field.id}>
                <label className="text-sm font-medium text-harbor-700 mb-1 block">{field.label} {field.completed && <span className="text-teal-500">✓</span>}</label>
                {field.type === 'text' && (
                  <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder={`Enter your ${field.label.toLowerCase()}...`} value={field.value} onChange={e => handleFieldUpdate(field.id, e.target.value)} />
                )}
                {field.type === 'select' && (
                  <select className="input-field w-full px-4 py-2.5 rounded-lg" value={field.value} onChange={e => handleFieldUpdate(field.id, e.target.value)}>
                    <option value="">Select {field.label.toLowerCase()}...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                {field.type === 'multiselect' && (
                  <div className="flex flex-wrap gap-2">
                    {field.options?.map(opt => (
                      <button key={opt} onClick={() => handleFieldUpdate(field.id, opt)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', field.value.includes(opt) ? 'bg-teal-100 text-teal-700 border border-teal-300' : 'bg-harbor-100 text-harbor-600')}>{opt}</button>
                    ))}
                  </div>
                )}
                {field.type === 'photo' && (
                  <div className="border-2 border-dashed border-harbor-200 rounded-lg p-6 text-center cursor-pointer hover:border-teal-300 transition-colors" onClick={() => handleFieldUpdate(field.id, 'photo-uploaded')}>
                    <span className="text-2xl">📷</span>
                    <p className="text-sm text-harbor-500 mt-1">Click to upload profile photo</p>
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2">
              <h4 className="text-sm font-medium text-harbor-700 mb-2">Notification Preferences</h4>
              <div className="flex gap-4">
                {Object.entries(notificationPrefs).map(([key, enabled]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-harbor-600">
                    <input type="checkbox" checked={enabled} onChange={() => setNotificationPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))} className="rounded" />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleCompleteSetup} className="btn-teal w-full py-3 rounded-lg font-medium mt-4">Complete Setup</button>
          </div>
        </div>
      )}

      {activeTab === 'explore' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Guided Tour — Try These First</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exploreCards.map(card => (
              <div key={card.id} className={cn('card p-5 rounded-xl transition-all', card.completed ? 'border-green-200 bg-green-50' : '')}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{card.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-harbor-800">{card.title}</h4>
                    <p className="text-sm text-harbor-500 mt-1">{card.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mly-600 font-medium">Reward: {card.reward}</span>
                  {card.completed ? (
                    <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                  ) : (
                    <button onClick={() => handleCompleteExplore(card.id)} className="btn-teal px-3 py-1.5 rounded text-xs">Start</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab('complete')} className="btn-teal w-full py-3 rounded-xl font-medium mt-4">Finish Onboarding →</button>
        </div>
      )}

      {activeTab === 'complete' && (
        <div className="space-y-6">
          <div className="card p-8 rounded-xl text-center bg-gradient-to-br from-mly-50 to-teal-50">
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-2xl font-bold text-harbor-900 mb-2">You&apos;re All Set!</h2>
            <p className="text-harbor-500 max-w-md mx-auto">Welcome to the MiLyfe community. You&apos;ve earned your first reward!</p>
            <div className="mt-4 inline-block px-6 py-2 bg-mly-100 rounded-full">
              <span className="text-mly-700 font-bold text-lg">+25 $MLY Welcome Gift</span>
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Suggested Next Steps</h3>
            <div className="space-y-2">
              {[{ label: 'Explore the community forum', link: '/forum' }, { label: 'Set up your health profile', link: '/health' }, { label: 'Check governance proposals', link: '/govern' }, { label: 'View your digital twin', link: '/twin' }].map((step, idx) => (
                <Link key={idx} href={step.link} className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg hover:bg-harbor-100 transition-colors">
                  <span className="text-sm text-harbor-700">{step.label}</span>
                  <span className="text-teal-600">→</span>
                </Link>
              ))}
            </div>
          </div>
          <button onClick={handleFinishOnboarding} className="btn-teal w-full py-3 rounded-xl font-medium">Go to Dashboard 🚀</button>
        </div>
      )}
    </div>
  )
}
