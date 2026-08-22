'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'welcome' | 'setup' | 'explore' | 'complete'

interface OnboardingProgress {
  id: string
  user_id: string
  step: string | null
  profile_data: Record<string, string> | null
  completed_tasks: string[]
  completed: boolean
  created_at: string
}

const exploreTasks = [
  { id: 'visit-forum', title: 'Visit the Forum', description: 'Introduce yourself in the community forum and meet your neighbors.', icon: '💬', reward: '5 $MLY' },
  { id: 'earn-mly', title: 'Earn Your First $MLY', description: 'Complete a simple task or record a community observation to earn $MLY.', icon: '💰', reward: '10 $MLY' },
  { id: 'check-health', title: 'Check Your Health', description: 'Set up your health profile and get personalized wellness recommendations.', icon: '❤️', reward: '5 $MLY' },
  { id: 'find-neighbors', title: 'Find Neighbors', description: 'Discover community members in your neighborhood and connect.', icon: '🏘️', reward: '5 $MLY' },
]

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('welcome')
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [profileData, setProfileData] = useState<Record<string, string>>({ display_name: '', neighborhood: '', interests: '' })
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
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

  const neighborhoods = ['Riverside', 'Springfield', 'Downtown', 'Eastside', 'Northside', 'San Marco', 'Beaches', 'Mandarin', 'Westside']
  const interests = ['Health', 'Finance', 'Safety', 'Education', 'Arts', 'Sports', 'Gardening', 'Technology', 'Cooking', 'Music']

  useEffect(() => {
    loadOnboardingData()
  }, [])

  async function loadOnboardingData() {
    setLoading(true)
    try {
      if (!user?.id) { setLoading(false); return }
      const { data } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProgress(data)
        if (data.profile_data) setProfileData(prev => ({ ...prev, ...data.profile_data }))
        if (data.completed_tasks) setCompletedTasks(data.completed_tasks)
        if (data.step) setActiveTab(data.step as Tab)
        if (data.completed) setActiveTab('complete')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveProfileData(data: Record<string, string>) {
    if (!user?.id) return
    setProfileData(data)
    await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        step: 'setup',
        profile_data: data,
        completed_tasks: completedTasks,
        completed: false,
      }, { onConflict: 'user_id' })
  }

  async function handleCompleteSetup() {
    if (!profileData.display_name) {
      toast.error('Please enter a display name')
      return
    }
    if (!user?.id) return
    await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        step: 'explore',
        profile_data: profileData,
        completed_tasks: completedTasks,
        completed: false,
      }, { onConflict: 'user_id' })
    toast.success('Profile setup complete!')
    setActiveTab('explore')
  }

  async function handleCompleteTask(taskId: string) {
    if (!user?.id) return
    const updated = [...completedTasks, taskId]
    setCompletedTasks(updated)
    await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        step: 'explore',
        profile_data: profileData,
        completed_tasks: updated,
        completed: false,
      }, { onConflict: 'user_id' })
    toast.success('Task completed! Reward earned.')
  }

  async function handleFinishOnboarding() {
    if (!user?.id) return
    await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        step: 'complete',
        profile_data: profileData,
        completed_tasks: completedTasks,
        completed: true,
      }, { onConflict: 'user_id' })
    setShowConfetti(true)
    toast.success('Welcome to MiLyfe! You earned 25 $MLY as a welcome gift!')
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const setupProgress = profileData.display_name ? (profileData.neighborhood ? (profileData.interests ? 100 : 66) : 33) : 0

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-64 rounded-xl" />
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
            <p className="text-harbor-500 max-w-lg mx-auto">MiLyfe is more than an app — it&apos;s your neighborhood coming together to build something better.</p>
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
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Display Name {profileData.display_name && <span className="text-teal-500">✓</span>}</label>
              <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Enter your display name..." value={profileData.display_name} onChange={e => saveProfileData({ ...profileData, display_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Neighborhood {profileData.neighborhood && <span className="text-teal-500">✓</span>}</label>
              <select className="input-field w-full px-4 py-2.5 rounded-lg" value={profileData.neighborhood} onChange={e => saveProfileData({ ...profileData, neighborhood: e.target.value })}>
                <option value="">Select neighborhood...</option>
                {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Interests {profileData.interests && <span className="text-teal-500">✓</span>}</label>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => (
                  <button key={interest} onClick={() => {
                    const current = profileData.interests ? profileData.interests.split(',') : []
                    const updated = current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest]
                    saveProfileData({ ...profileData, interests: updated.join(',') })
                  }} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', profileData.interests?.includes(interest) ? 'bg-teal-100 text-teal-700 border border-teal-300' : 'bg-harbor-100 text-harbor-600')}>{interest}</button>
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
            {exploreTasks.map(task => {
              const isCompleted = completedTasks.includes(task.id)
              return (
                <div key={task.id} className={cn('card p-5 rounded-xl transition-all', isCompleted ? 'border-green-200 bg-green-50' : '')}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{task.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-harbor-800">{task.title}</h4>
                      <p className="text-sm text-harbor-500 mt-1">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-mly-600 font-medium">Reward: {task.reward}</span>
                    {isCompleted ? (
                      <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                    ) : (
                      <button onClick={() => handleCompleteTask(task.id)} className="btn-teal px-3 py-1.5 rounded text-xs">Complete</button>
                    )}
                  </div>
                </div>
              )
            })}
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
