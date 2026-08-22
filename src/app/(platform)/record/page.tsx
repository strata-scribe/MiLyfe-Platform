'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'record' | 'my-recordings' | 'reports' | 'rewards'

interface Recording {
  id: string
  recorder_id: string
  video_url: string | null
  thumbnail_url: string | null
  category: string | null
  ai_category_suggestion: string | null
  description: string | null
  status: string
  routed_to: string | null
  reward_mly: number | null
  privacy_level: string | null
  faces_blurred: boolean
  lat: number | null
  lng: number | null
  created_at: string
}

interface RecordingReport {
  id: string
  recording_id: string
  user_id: string
  submitted_to: string | null
  title: string
  status: string
  created_at: string
}

export default function RecordPage() {
  const [activeTab, setActiveTab] = useState<Tab>('record')
  const [loading, setLoading] = useState(true)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [reports, setReports] = useState<RecordingReport[]>([])
  const [rewardedRecordings, setRewardedRecordings] = useState<Recording[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingCategory, setRecordingCategory] = useState('general')
  const [recordingDescription, setRecordingDescription] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'record', label: 'Record' },
    { key: 'my-recordings', label: 'My Recordings' },
    { key: 'reports', label: 'Reports' },
    { key: 'rewards', label: 'Rewards' },
  ]

  const categories = ['general', 'traffic-violation', 'property-damage', 'safety-hazard', 'noise-complaint', 'suspicious-activity', 'environmental-issue', 'community-event']

  useEffect(() => {
    loadRecordData()
  }, [])

  async function loadRecordData() {
    setLoading(true)
    try {
      if (!user?.id) { setLoading(false); return }

      const { data: recordingsData } = await supabase
        .from('community_recordings')
        .select('*')
        .eq('recorder_id', user.id)
        .order('created_at', { ascending: false })
      if (recordingsData) setRecordings(recordingsData)

      const { data: reportsData } = await supabase
        .from('recording_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (reportsData) setReports(reportsData)

      const { data: rewardData } = await supabase
        .from('community_recordings')
        .select('*')
        .eq('recorder_id', user.id)
        .gt('reward_mly', 0)
        .order('created_at', { ascending: false })
      if (rewardData) {
        setRewardedRecordings(rewardData)
        setTotalEarned(rewardData.reduce((acc, r) => acc + (r.reward_mly || 0), 0))
      }
    } finally {
      setLoading(false)
    }
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Location captured!')
      },
      () => toast.error('Could not get location. Please enable permissions.')
    )
  }

  function handleStartRecording() {
    handleGetLocation()
    setIsRecording(true)
    toast.success('Recording started. Geolocation tagged.')
  }

  async function handleStopRecording() {
    setIsRecording(false)
    if (!user?.id) { toast.error('Please sign in'); return }
    const { error } = await supabase.from('community_recordings').insert({
      recorder_id: user.id,
      category: recordingCategory,
      description: recordingDescription || null,
      status: 'processing',
      lat: location?.lat || null,
      lng: location?.lng || null,
      faces_blurred: false,
      privacy_level: 'standard',
    })
    if (error) { toast.error('Failed to save recording'); return }
    toast.success('Recording saved! Processing will begin shortly.')
    setRecordingDescription('')
    loadRecordData()
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'rewarded': return 'bg-mly-100 text-mly-700'
      case 'verified': return 'bg-green-100 text-green-700'
      case 'processing': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  const reportStatusColor = (s: string) => {
    switch (s) {
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'under-review': return 'bg-blue-100 text-blue-700'
      case 'received': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg" />
        <div className="skeleton h-48 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Community Recording</h1>
          <p className="text-harbor-500 mt-1">Document and earn $MLY for community reporting</p>
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

      {activeTab === 'record' && (
        <div className="space-y-6">
          <div className="card p-8 rounded-xl text-center">
            <div className={cn('w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 transition-all', isRecording ? 'bg-red-100 animate-pulse' : 'bg-harbor-100')}>
              <span className="text-5xl">{isRecording ? '⏺️' : '🎙️'}</span>
            </div>
            <h2 className="text-xl font-bold text-harbor-900 mb-2">{isRecording ? 'Recording...' : 'Ready to Record'}</h2>
            <p className="text-sm text-harbor-500 mb-4">{isRecording ? 'Tap to stop. Geolocation is tagged.' : 'Select category, add description, then start.'}</p>
            <select className="input-field px-4 py-2.5 rounded-lg mx-auto mb-3 w-64" value={recordingCategory} onChange={e => setRecordingCategory(e.target.value)}>
              {categories.map(t => <option key={t} value={t} className="capitalize">{t.replace(/-/g, ' ')}</option>)}
            </select>
            <input className="input-field px-4 py-2.5 rounded-lg mx-auto mb-4 w-64 block" placeholder="Description (optional)..." value={recordingDescription} onChange={e => setRecordingDescription(e.target.value)} />
            {location && <p className="text-xs text-teal-600 mb-2">Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>}
            <div>
              {isRecording ? (
                <button onClick={handleStopRecording} className="px-8 py-3 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors font-medium">Stop Recording</button>
              ) : (
                <button onClick={handleStartRecording} className="btn-teal px-8 py-3 rounded-xl font-medium">Start Recording</button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'my-recordings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">My Recordings ({recordings.length})</h2>
          {recordings.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No recordings yet. Start documenting your community!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map(rec => (
                <div key={rec.id} className="card rounded-xl overflow-hidden">
                  <div className="h-24 bg-harbor-100 flex items-center justify-center">
                    {rec.thumbnail_url ? <img src={rec.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🎬</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-harbor-800 text-sm truncate">{rec.description || rec.category || 'Recording'}</h4>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium shrink-0 ml-2', statusColor(rec.status))}>{rec.status}</span>
                    </div>
                    <p className="text-xs text-harbor-500 capitalize">{rec.category?.replace(/-/g, ' ') || 'General'}</p>
                    {rec.lat && rec.lng && <p className="text-xs text-harbor-400 mt-1">📍 {rec.lat.toFixed(3)}, {rec.lng.toFixed(3)}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-harbor-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                      {rec.reward_mly && rec.reward_mly > 0 && <span className="text-xs text-mly-600 font-medium">+{rec.reward_mly} $MLY</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Submitted Reports</h2>
          {reports.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No reports submitted yet.</p>
            </div>
          ) : reports.map(report => (
            <div key={report.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{report.title}</p>
                <p className="text-sm text-harbor-500">Submitted to: <span className="capitalize font-medium">{report.submitted_to || 'N/A'}</span> | {new Date(report.created_at).toLocaleDateString()}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', reportStatusColor(report.status))}>{report.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="card p-6 rounded-xl bg-gradient-to-r from-mly-50 to-teal-50 border border-mly-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-harbor-600">Total $MLY Earned</p>
                <p className="text-3xl font-bold text-mly-600 mt-1">{totalEarned} $MLY</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-harbor-500">Rewarded Recordings</p>
                <p className="text-lg font-bold text-teal-600">{rewardedRecordings.length}</p>
              </div>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">Reward History</h2>
          {rewardedRecordings.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No rewards earned yet. Record community observations to earn $MLY!</p>
            </div>
          ) : rewardedRecordings.map(rec => (
            <div key={rec.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{rec.description || rec.category || 'Recording'}</p>
                <p className="text-xs text-harbor-500 capitalize">{rec.category?.replace(/-/g, ' ')} | {new Date(rec.created_at).toLocaleDateString()}</p>
              </div>
              <span className="text-lg font-bold text-mly-600">+{rec.reward_mly} $MLY</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
