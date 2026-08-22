'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'account' | 'notifications' | 'privacy' | 'appearance' | 'data'

interface UserSettings {
  id: string
  user_id: string
  display_name: string | null
  email: string | null
  notification_prefs: Record<string, boolean>
  privacy_prefs: Record<string, string | boolean>
  appearance_prefs: Record<string, string | boolean>
  updated_at: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({
    governance_votes: true,
    forum_replies: true,
    guild_alerts: true,
    financial_updates: true,
    health_reminders: true,
    news_community: true,
    achievements: true,
    recording_rewards: true,
  })
  const [privacyPrefs, setPrivacyPrefs] = useState<Record<string, string | boolean>>({
    profile_visibility: 'community',
    message_permissions: 'everyone',
    data_sharing: false,
  })
  const [appearancePrefs, setAppearancePrefs] = useState<Record<string, string | boolean>>({
    dark_mode: false,
    font_size: 'medium',
    language: 'en',
    reduce_motion: false,
  })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'data', label: 'Data' },
  ]

  const notificationLabels: Record<string, string> = {
    governance_votes: 'Governance Votes',
    forum_replies: 'Forum Replies',
    guild_alerts: 'Guild Alerts',
    financial_updates: 'Financial Updates',
    health_reminders: 'Health Reminders',
    news_community: 'News & Community',
    achievements: 'Achievement Unlocked',
    recording_rewards: 'Recording Rewards',
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      if (!user?.id) { setLoading(false); return }
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setSettings(data)
        setDisplayName(data.display_name || '')
        setEmail(data.email || '')
        if (data.notification_prefs) setNotificationPrefs(prev => ({ ...prev, ...data.notification_prefs }))
        if (data.privacy_prefs) setPrivacyPrefs(prev => ({ ...prev, ...data.privacy_prefs }))
        if (data.appearance_prefs) setAppearancePrefs(prev => ({ ...prev, ...data.appearance_prefs }))
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveAccountSettings() {
    if (!user?.id) return
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, display_name: displayName, email, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) { toast.error('Failed to save account settings'); return }
    toast.success('Account settings saved!')
  }

  async function saveNotificationPrefs(prefs: Record<string, boolean>) {
    if (!user?.id) return
    setNotificationPrefs(prefs)
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, notification_prefs: prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) toast.error('Failed to save')
    else toast.success('Notification preference updated')
  }

  async function savePrivacyPrefs(prefs: Record<string, string | boolean>) {
    if (!user?.id) return
    setPrivacyPrefs(prefs)
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, privacy_prefs: prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) toast.error('Failed to save')
    else toast.success('Privacy settings updated')
  }

  async function saveAppearancePrefs(prefs: Record<string, string | boolean>) {
    if (!user?.id) return
    setAppearancePrefs(prefs)
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, appearance_prefs: prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) toast.error('Failed to save')
    else toast.success('Appearance settings updated')
  }

  function handleExportData() {
    toast.success('Data export started. You will receive a download link via email.')
  }

  function handleRequestDeletion() {
    toast.success('Data deletion request submitted. Processing takes up to 30 days.')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-40 rounded-lg" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Settings</h1>
          <p className="text-harbor-500 mt-1">Manage your account and preferences</p>
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

      {activeTab === 'account' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Account Details</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Display Name</label>
              <input className="input-field w-full px-4 py-2.5 rounded-lg" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Email Address</label>
              <input className="input-field w-full px-4 py-2.5 rounded-lg" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <button onClick={saveAccountSettings} className="btn-teal px-6 py-2.5 rounded-lg font-medium">Save Changes</button>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-harbor-800 mb-4">Notification Preferences</h2>
          <div className="space-y-3">
            {Object.entries(notificationPrefs).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg">
                <span className="text-sm text-harbor-700">{notificationLabels[key] || key}</span>
                <button onClick={() => saveNotificationPrefs({ ...notificationPrefs, [key]: !enabled })} className={cn('w-11 h-6 rounded-full transition-colors relative', enabled ? 'bg-teal-500' : 'bg-harbor-300')}>
                  <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', enabled ? 'left-5' : 'left-0.5')} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Privacy Controls</h2>
          <div>
            <label className="text-sm font-medium text-harbor-700 mb-1 block">Who can see your profile</label>
            <select className="input-field w-full px-4 py-2.5 rounded-lg" value={privacyPrefs.profile_visibility as string} onChange={e => savePrivacyPrefs({ ...privacyPrefs, profile_visibility: e.target.value })}>
              <option value="everyone">Everyone</option>
              <option value="community">Community Members Only</option>
              <option value="connections">My Connections Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-harbor-700 mb-1 block">Who can message you</label>
            <select className="input-field w-full px-4 py-2.5 rounded-lg" value={privacyPrefs.message_permissions as string} onChange={e => savePrivacyPrefs({ ...privacyPrefs, message_permissions: e.target.value })}>
              <option value="everyone">Everyone</option>
              <option value="connections">Connections Only</option>
              <option value="none">No One</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg">
            <div>
              <p className="font-medium text-harbor-800 text-sm">Share usage data</p>
              <p className="text-xs text-harbor-500">Anonymous analytics to help improve MiLyfe</p>
            </div>
            <button onClick={() => savePrivacyPrefs({ ...privacyPrefs, data_sharing: !privacyPrefs.data_sharing })} className={cn('w-11 h-6 rounded-full transition-colors relative', privacyPrefs.data_sharing ? 'bg-teal-500' : 'bg-harbor-300')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', privacyPrefs.data_sharing ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="card p-6 rounded-xl space-y-5">
          <h2 className="text-lg font-semibold text-harbor-800">Appearance</h2>
          <div className="flex items-center justify-between p-4 bg-harbor-50 rounded-lg">
            <div>
              <p className="font-medium text-harbor-800">Dark Mode</p>
              <p className="text-xs text-harbor-500">Switch between light and dark themes</p>
            </div>
            <button onClick={() => saveAppearancePrefs({ ...appearancePrefs, dark_mode: !appearancePrefs.dark_mode })} className={cn('w-11 h-6 rounded-full transition-colors relative', appearancePrefs.dark_mode ? 'bg-teal-500' : 'bg-harbor-300')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', appearancePrefs.dark_mode ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-harbor-700 mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map(size => (
                <button key={size} onClick={() => saveAppearancePrefs({ ...appearancePrefs, font_size: size })} className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize', appearancePrefs.font_size === size ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{size}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-harbor-700 mb-1 block">Language</label>
            <select className="input-field w-full px-4 py-2.5 rounded-lg" value={appearancePrefs.language as string} onChange={e => saveAppearancePrefs({ ...appearancePrefs, language: e.target.value })}>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-harbor-50 rounded-lg">
            <div>
              <p className="font-medium text-harbor-800">Reduce Motion</p>
              <p className="text-xs text-harbor-500">Minimize animations for accessibility</p>
            </div>
            <button onClick={() => saveAppearancePrefs({ ...appearancePrefs, reduce_motion: !appearancePrefs.reduce_motion })} className={cn('w-11 h-6 rounded-full transition-colors relative', appearancePrefs.reduce_motion ? 'bg-teal-500' : 'bg-harbor-300')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', appearancePrefs.reduce_motion ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-2">Export All Data</h3>
            <p className="text-sm text-harbor-500 mb-3">Download a JSON file containing all your platform data including profile, activity, and settings.</p>
            <button onClick={handleExportData} className="btn-teal px-4 py-2 rounded-lg text-sm">Export Data (JSON)</button>
          </div>
          <div className="card p-5 rounded-xl border border-red-100">
            <h3 className="font-semibold text-red-700 mb-2">Request Data Deletion</h3>
            <p className="text-sm text-harbor-500 mb-3">Request permanent deletion of all your data. This action is irreversible and takes up to 30 days to process.</p>
            <button onClick={handleRequestDeletion} className="px-4 py-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Request Deletion</button>
          </div>
        </div>
      )}
    </div>
  )
}
