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
  title: string
  type: string
  duration: string
  status: 'processing' | 'verified' | 'rewarded' | 'rejected'
  createdAt: string
  location: string
  hasTranscript: boolean
  thumbnailColor: string
}

interface Report {
  id: string
  recordingId: string
  submittedTo: 'city' | 'police' | 'community'
  title: string
  status: 'pending' | 'received' | 'under-review' | 'resolved'
  submittedAt: string
}

interface RewardEntry {
  id: string
  amount: number
  reason: string
  date: string
  recordingTitle: string
}

export default function RecordPage() {
  const [activeTab, setActiveTab] = useState<Tab>('record')
  const [loading, setLoading] = useState(true)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [rewards, setRewards] = useState<RewardEntry[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState('general')
  const [totalEarned, setTotalEarned] = useState(0)
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'record', label: 'Record' },
    { key: 'my-recordings', label: 'My Recordings' },
    { key: 'reports', label: 'Reports' },
    { key: 'rewards', label: 'Rewards' },
  ]

  const incidentTypes = ['General', 'Traffic Violation', 'Property Damage', 'Safety Hazard', 'Noise Complaint', 'Suspicious Activity', 'Environmental Issue', 'Community Event']

  useEffect(() => {
    loadRecordData()
  }, [])

  async function loadRecordData() {
    setLoading(true)
    try {
      setRecordings([
        { id: '1', title: 'Pothole on Main Street', type: 'Safety Hazard', duration: '0:32', status: 'rewarded', createdAt: '2024-01-15 3:42 PM', location: 'Main St & 3rd Ave', hasTranscript: true, thumbnailColor: 'bg-teal-200' },
        { id: '2', title: 'Illegal Dumping - Eastside', type: 'Environmental Issue', duration: '1:15', status: 'verified', createdAt: '2024-01-14 11:20 AM', location: 'Eastside Park Entrance', hasTranscript: true, thumbnailColor: 'bg-mly-200' },
        { id: '3', title: 'Speeding on School Zone', type: 'Traffic Violation', duration: '0:45', status: 'processing', createdAt: '2024-01-15 7:45 AM', location: 'School St & Elm Ave', hasTranscript: false, thumbnailColor: 'bg-harbor-200' },
        { id: '4', title: 'Community Mural Completion', type: 'Community Event', duration: '2:30', status: 'verified', createdAt: '2024-01-13 4:00 PM', location: 'Springfield Art District', hasTranscript: true, thumbnailColor: 'bg-purple-200' },
        { id: '5', title: 'Broken Streetlight Report', type: 'Safety Hazard', duration: '0:18', status: 'rewarded', createdAt: '2024-01-12 9:15 PM', location: 'MLK Blvd & Oak St', hasTranscript: false, thumbnailColor: 'bg-yellow-200' },
      ])
      setReports([
        { id: '1', recordingId: '1', submittedTo: 'city', title: 'Pothole Repair Request - Main Street', status: 'received', submittedAt: '2024-01-15' },
        { id: '2', recordingId: '2', submittedTo: 'community', title: 'Illegal Dumping Evidence', status: 'under-review', submittedAt: '2024-01-14' },
        { id: '3', recordingId: '5', submittedTo: 'city', title: 'Streetlight Outage - MLK Blvd', status: 'resolved', submittedAt: '2024-01-12' },
      ])
      const rewardEntries = [
        { id: '1', amount: 15, reason: 'Verified safety hazard report', date: '2024-01-15', recordingTitle: 'Pothole on Main Street' },
        { id: '2', amount: 25, reason: 'Environmental issue documentation', date: '2024-01-14', recordingTitle: 'Illegal Dumping - Eastside' },
        { id: '3', amount: 10, reason: 'Infrastructure report verified', date: '2024-01-12', recordingTitle: 'Broken Streetlight Report' },
      ]
      setRewards(rewardEntries)
      setTotalEarned(rewardEntries.reduce((acc, r) => acc + r.amount, 0))
    } finally {
      setLoading(false)
    }
  }

  function handleStartRecording() {
    setIsRecording(true)
    toast.success('Recording started. Geolocation tagged.')
  }

  function handleStopRecording() {
    setIsRecording(false)
    toast.success('Recording saved! Processing will begin shortly.')
  }

  function handleSubmitReport(recordingId: string) {
    toast.success('Recording submitted as a report!')
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
            <p className="text-sm text-harbor-500 mb-4">{isRecording ? 'Tap to stop recording. Geolocation is being tagged.' : 'Select incident type and start recording.'}</p>
            <select className="input-field px-4 py-2.5 rounded-lg mx-auto mb-4 w-64" value={recordingType} onChange={e => setRecordingType(e.target.value)}>
              {incidentTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
            <div>
              {isRecording ? (
                <button onClick={handleStopRecording} className="px-8 py-3 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors font-medium">Stop Recording</button>
              ) : (
                <button onClick={handleStartRecording} className="btn-teal px-8 py-3 rounded-xl font-medium">Start Recording</button>
              )}
            </div>
          </div>
          <div className="card p-4 rounded-xl bg-teal-50 border border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">Auto-Transcript</h3>
            <p className="text-xs text-teal-600">Recordings are automatically transcribed using AI. Review and edit before submitting.</p>
          </div>
        </div>
      )}

      {activeTab === 'my-recordings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">My Recordings ({recordings.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map(rec => (
              <div key={rec.id} className="card rounded-xl overflow-hidden">
                <div className={cn('h-24 flex items-center justify-center', rec.thumbnailColor)}>
                  <span className="text-3xl">🎬</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-harbor-800 text-sm truncate">{rec.title}</h4>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium shrink-0 ml-2', statusColor(rec.status))}>{rec.status}</span>
                  </div>
                  <p className="text-xs text-harbor-500">{rec.type} | {rec.duration}</p>
                  <p className="text-xs text-harbor-400 mt-1">{rec.location}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-harbor-400">{rec.createdAt}</span>
                    {rec.hasTranscript && <span className="text-xs text-teal-600">📝 Transcript</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Submitted Reports</h2>
          {reports.map(report => (
            <div key={report.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{report.title}</p>
                <p className="text-sm text-harbor-500">Submitted to: <span className="capitalize font-medium">{report.submittedTo}</span> | {report.submittedAt}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', reportStatusColor(report.status))}>{report.status}</span>
            </div>
          ))}
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-2">Submit a Recording as Report</h3>
            <p className="text-sm text-harbor-500 mb-3">Select a verified recording to submit to city officials, police, or community board.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select className="input-field px-3 py-2 rounded-lg">
                <option value="">Select recording...</option>
                {recordings.filter(r => r.status === 'verified' || r.status === 'rewarded').map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
              <button onClick={() => handleSubmitReport('')} className="btn-teal px-4 py-2 rounded-lg text-sm">Submit Report</button>
            </div>
          </div>
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
                <p className="text-xs text-harbor-500">Verified Recordings</p>
                <p className="text-lg font-bold text-teal-600">{recordings.filter(r => r.status === 'rewarded').length}</p>
              </div>
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Reward Tiers</h3>
            <div className="space-y-2">
              {[{ tier: 'Safety Hazard', reward: '10-20 $MLY' }, { tier: 'Environmental Issue', reward: '15-30 $MLY' }, { tier: 'Infrastructure Report', reward: '10-15 $MLY' }, { tier: 'Community Event', reward: '5-10 $MLY' }].map(t => (
                <div key={t.tier} className="flex items-center justify-between p-2 bg-harbor-50 rounded">
                  <span className="text-sm text-harbor-700">{t.tier}</span>
                  <span className="text-sm font-medium text-mly-600">{t.reward}</span>
                </div>
              ))}
            </div>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">Reward History</h2>
          {rewards.map(reward => (
            <div key={reward.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{reward.recordingTitle}</p>
                <p className="text-xs text-harbor-500">{reward.reason} | {reward.date}</p>
              </div>
              <span className="text-lg font-bold text-mly-600">+{reward.amount} $MLY</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
