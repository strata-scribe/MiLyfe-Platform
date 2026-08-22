'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'account' | 'notifications' | 'privacy' | 'appearance' | 'data'

interface NotificationPref {
  id: string
  feature: string
  push: boolean
  email: boolean
  inApp: boolean
}

interface BlockedUser {
  id: string
  name: string
  blockedAt: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [loading, setLoading] = useState(true)
  const [accountForm, setAccountForm] = useState({ displayName: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [notifications, setNotifications] = useState<NotificationPref[]>([])
  const [privacy, setPrivacy] = useState({ profileVisibility: 'community', messagePermissions: 'everyone', dataSharing: false })
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [appearance, setAppearance] = useState({ darkMode: false, fontSize: 'medium', language: 'en', reduceMotion: false })
  const [storageUsage, setStorageUsage] = useState({ used: 245, total: 1000, unit: 'MB' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'data', label: 'Data' },
  ]

  useEffect(() => {
    loadSettingsData()
  }, [])

  async function loadSettingsData() {
    setLoading(true)
    try {
      setAccountForm(prev => ({ ...prev, displayName: user?.display_name || 'Community Member', email: user?.email || 'member@milyfe.com' }))
      setNotifications([
        { id: '1', feature: 'Governance Votes', push: true, email: true, inApp: true },
        { id: '2', feature: 'Forum Replies', push: true, email: false, inApp: true },
        { id: '3', feature: 'Guild Alerts', push: true, email: true, inApp: true },
        { id: '4', feature: 'Financial Updates', push: false, email: true, inApp: true },
        { id: '5', feature: 'Health Reminders', push: true, email: false, inApp: true },
        { id: '6', feature: 'News & Community', push: false, email: false, inApp: true },
        { id: '7', feature: 'Achievement Unlocked', push: true, email: false, inApp: true },
        { id: '8', feature: 'Recording Rewards', push: true, email: true, inApp: true },
      ])
      setBlockedUsers([
        { id: '1', name: 'spammer42', blockedAt: '2024-01-10' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSaveAccount() {
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    toast.success('Account settings saved!')
  }

  function toggleNotification(id: string, type: 'push' | 'email' | 'inApp') {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, [type]: !n[type] } : n))
    toast.success('Notification preference updated')
  }

  function handleUnblock(userId: string) {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId))
    toast.success('User unblocked')
  }

  function handleExportData() {
    toast.success('Data export started. You will receive a download link via email.')
  }

  function handleDeleteAccount() {
    toast.error('Account deletion requires email confirmation. Check your inbox.')
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
              <input className="input-field w-full px-4 py-2.5 rounded-lg" value={accountForm.displayName} onChange={e => setAccountForm(p => ({ ...p, displayName: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Email Address</label>
              <input className="input-field w-full px-4 py-2.5 rounded-lg" type="email" value={accountForm.email} onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <hr className="border-harbor-200" />
          <h3 className="font-medium text-harbor-700">Change Password</h3>
          <div className="space-y-3">
            <input className="input-field w-full px-4 py-2.5 rounded-lg" type="password" placeholder="Current password" value={accountForm.currentPassword} onChange={e => setAccountForm(p => ({ ...p, currentPassword: e.target.value }))} />
            <input className="input-field w-full px-4 py-2.5 rounded-lg" type="password" placeholder="New password" value={accountForm.newPassword} onChange={e => setAccountForm(p => ({ ...p, newPassword: e.target.value }))} />
            <input className="input-field w-full px-4 py-2.5 rounded-lg" type="password" placeholder="Confirm new password" value={accountForm.confirmPassword} onChange={e => setAccountForm(p => ({ ...p, confirmPassword: e.target.value }))} />
          </div>
          <button onClick={handleSaveAccount} className="btn-teal px-6 py-2.5 rounded-lg font-medium">Save Changes</button>
          <hr className="border-harbor-200" />
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-700 text-sm">Danger Zone</h4>
            <p className="text-xs text-red-500 mt-1 mb-3">Deleting your account is permanent and cannot be undone.</p>
            <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Delete Account</button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-harbor-800 mb-4">Notification Preferences</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-harbor-200">
                  <th className="text-left py-2 text-harbor-600 font-medium">Feature</th>
                  <th className="text-center py-2 text-harbor-600 font-medium">Push</th>
                  <th className="text-center py-2 text-harbor-600 font-medium">Email</th>
                  <th className="text-center py-2 text-harbor-600 font-medium">In-App</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(notif => (
                  <tr key={notif.id} className="border-b border-harbor-100">
                    <td className="py-3 text-harbor-800">{notif.feature}</td>
                    <td className="py-3 text-center">
                      <button onClick={() => toggleNotification(notif.id, 'push')} className={cn('w-9 h-5 rounded-full transition-colors relative', notif.push ? 'bg-teal-500' : 'bg-harbor-300')}>
                        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', notif.push ? 'left-4' : 'left-0.5')} />
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => toggleNotification(notif.id, 'email')} className={cn('w-9 h-5 rounded-full transition-colors relative', notif.email ? 'bg-teal-500' : 'bg-harbor-300')}>
                        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', notif.email ? 'left-4' : 'left-0.5')} />
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => toggleNotification(notif.id, 'inApp')} className={cn('w-9 h-5 rounded-full transition-colors relative', notif.inApp ? 'bg-teal-500' : 'bg-harbor-300')}>
                        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', notif.inApp ? 'left-4' : 'left-0.5')} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <div className="card p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-harbor-800">Privacy Controls</h2>
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Who can see your profile</label>
              <select className="input-field w-full px-4 py-2.5 rounded-lg" value={privacy.profileVisibility} onChange={e => setPrivacy(p => ({ ...p, profileVisibility: e.target.value }))}>
                <option value="everyone">Everyone</option>
                <option value="community">Community Members Only</option>
                <option value="connections">My Connections Only</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-harbor-700 mb-1 block">Who can message you</label>
              <select className="input-field w-full px-4 py-2.5 rounded-lg" value={privacy.messagePermissions} onChange={e => setPrivacy(p => ({ ...p, messagePermissions: e.target.value }))}>
                <option value="everyone">Everyone</option>
                <option value="connections">Connections Only</option>
                <option value="none">No One</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg">
              <div>
                <p className="font-medium text-harbor-800 text-sm">Share usage data for platform improvement</p>
                <p className="text-xs text-harbor-500">Anonymous analytics to help improve MiLyfe</p>
              </div>
              <button onClick={() => setPrivacy(p => ({ ...p, dataSharing: !p.dataSharing }))} className={cn('w-11 h-6 rounded-full transition-colors relative', privacy.dataSharing ? 'bg-teal-500' : 'bg-harbor-300')}>
                <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', privacy.dataSharing ? 'left-5' : 'left-0.5')} />
              </button>
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Blocked Users ({blockedUsers.length})</h3>
            {blockedUsers.length === 0 ? (
              <p className="text-sm text-harbor-500">No blocked users.</p>
            ) : blockedUsers.map(blocked => (
              <div key={blocked.id} className="flex items-center justify-between p-2 bg-harbor-50 rounded">
                <div>
                  <p className="text-sm text-harbor-700">{blocked.name}</p>
                  <p className="text-xs text-harbor-400">Blocked: {blocked.blockedAt}</p>
                </div>
                <button onClick={() => handleUnblock(blocked.id)} className="text-xs text-red-600 hover:underline">Unblock</button>
              </div>
            ))}
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
            <button onClick={() => setAppearance(p => ({ ...p, darkMode: !p.darkMode }))} className={cn('w-11 h-6 rounded-full transition-colors relative', appearance.darkMode ? 'bg-teal-500' : 'bg-harbor-300')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', appearance.darkMode ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-harbor-700 mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map(size => (
                <button key={size} onClick={() => setAppearance(p => ({ ...p, fontSize: size }))} className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize', appearance.fontSize === size ? 'bg-teal-600 text-white' : 'bg-harbor-100 text-harbor-600')}>{size}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-harbor-700 mb-1 block">Language</label>
            <select className="input-field w-full px-4 py-2.5 rounded-lg" value={appearance.language} onChange={e => setAppearance(p => ({ ...p, language: e.target.value }))}>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-harbor-50 rounded-lg">
            <div>
              <p className="font-medium text-harbor-800">Reduce Motion</p>
              <p className="text-xs text-harbor-500">Minimize animations for accessibility</p>
            </div>
            <button onClick={() => setAppearance(p => ({ ...p, reduceMotion: !p.reduceMotion }))} className={cn('w-11 h-6 rounded-full transition-colors relative', appearance.reduceMotion ? 'bg-teal-500' : 'bg-harbor-300')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', appearance.reduceMotion ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h2 className="text-lg font-semibold text-harbor-800 mb-3">Storage Usage</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-harbor-600">{storageUsage.used} {storageUsage.unit} used</span>
              <span className="text-sm text-harbor-500">of {storageUsage.total} {storageUsage.unit}</span>
            </div>
            <div className="w-full h-3 bg-harbor-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }} />
            </div>
          </div>
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
