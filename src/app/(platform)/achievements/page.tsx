'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'badges' | 'paths' | 'challenges' | 'leaderboard'

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  criteria: string
  earned: boolean
  earnedDate?: string
  category: string
}

interface AchievementPath {
  id: string
  name: string
  stages: { name: string; completed: boolean }[]
  currentStage: number
  totalStages: number
}

interface Challenge {
  id: string
  title: string
  description: string
  type: 'streak' | 'event' | 'skill'
  progress: number
  target: number
  endsAt: string
  reward: string
  active: boolean
}

interface LeaderboardEntry {
  id: string
  name: string
  badges: number
  neighborhood: string
  rank: number
  monthlyPoints: number
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('badges')
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<Badge[]>([])
  const [paths, setPaths] = useState<AchievementPath[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'badges', label: 'Badges' },
    { key: 'paths', label: 'Paths' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ]

  useEffect(() => {
    loadAchievementData()
  }, [])

  async function loadAchievementData() {
    setLoading(true)
    try {
      setBadges([
        { id: '1', name: 'First Steps', icon: '👣', description: 'Complete your profile and onboarding', criteria: 'Finish all onboarding steps', earned: true, earnedDate: '2024-01-01', category: 'Getting Started' },
        { id: '2', name: 'Community Voice', icon: '📣', description: 'Cast your first governance vote', criteria: 'Vote on any active proposal', earned: true, earnedDate: '2024-01-05', category: 'Governance' },
        { id: '3', name: 'Good Neighbor', icon: '🤝', description: 'Help 5 community members', criteria: 'Respond to 5 help requests', earned: true, earnedDate: '2024-01-10', category: 'Community' },
        { id: '4', name: 'Market Maven', icon: '🛒', description: 'Complete 10 marketplace transactions', criteria: '10 successful trades or purchases', earned: false, category: 'Marketplace' },
        { id: '5', name: 'Night Owl Patrol', icon: '🦉', description: 'Complete 5 evening guild patrols', criteria: '5 patrol shifts completed after 6 PM', earned: false, category: 'Safety' },
        { id: '6', name: 'Knowledge Keeper', icon: '📚', description: 'Create 3 wiki articles', criteria: 'Publish 3 community wiki pages', earned: true, earnedDate: '2024-01-12', category: 'Wiki' },
        { id: '7', name: 'Health Champion', icon: '💪', description: 'Log health data for 30 consecutive days', criteria: '30-day health tracking streak', earned: false, category: 'Health' },
        { id: '8', name: 'Eagle Eye', icon: '🦅', description: 'Submit 10 verified community recordings', criteria: '10 recordings verified by community', earned: false, category: 'Recording' },
        { id: '9', name: 'Money Wise', icon: '💰', description: 'Stay under budget for 3 months', criteria: 'No budget overages for 3 consecutive months', earned: false, category: 'Finance' },
        { id: '10', name: 'Transit Pro', icon: '🚌', description: 'Use public transit 50 times', criteria: 'Log 50 transit trips', earned: true, earnedDate: '2024-01-14', category: 'Transit' },
        { id: '11', name: 'Green Thumb', icon: '🌱', description: 'Participate in community garden for a season', criteria: 'Active garden member for 3+ months', earned: false, category: 'Community' },
        { id: '12', name: 'Fact Finder', icon: '🔍', description: 'Verify 5 news stories', criteria: 'Participate in 5 community fact-checks', earned: false, category: 'News' },
      ])
      setPaths([
        { id: '1', name: 'Community Pillar', stages: [{ name: 'Newcomer', completed: true }, { name: 'Contributor', completed: true }, { name: 'Pillar', completed: false }, { name: 'Legend', completed: false }], currentStage: 2, totalStages: 4 },
        { id: '2', name: 'Safety Guardian', stages: [{ name: 'Observer', completed: true }, { name: 'Reporter', completed: true }, { name: 'Patroller', completed: true }, { name: 'Guardian', completed: false }], currentStage: 3, totalStages: 4 },
        { id: '3', name: 'Knowledge Seeker', stages: [{ name: 'Reader', completed: true }, { name: 'Editor', completed: false }, { name: 'Author', completed: false }, { name: 'Sage', completed: false }], currentStage: 1, totalStages: 4 },
      ])
      setChallenges([
        { id: '1', title: '30-Day Fitness Streak', description: 'Log activity every day for 30 days', type: 'streak', progress: 18, target: 30, endsAt: '2024-02-15', reward: '50 $MLY + Health Champion Badge', active: true },
        { id: '2', title: 'Community Cleanup Weekend', description: 'Participate in the neighborhood cleanup event', type: 'event', progress: 0, target: 1, endsAt: '2024-01-20', reward: '25 $MLY', active: true },
        { id: '3', title: 'Learn a New Skill', description: 'Complete 5 community workshop sessions', type: 'skill', progress: 3, target: 5, endsAt: '2024-02-28', reward: '30 $MLY + Skill Badge', active: true },
        { id: '4', title: 'Weekly Transit Challenge', description: 'Use public transit at least 3 times this week', type: 'streak', progress: 2, target: 3, endsAt: '2024-01-21', reward: '15 $MLY', active: true },
      ])
      setLeaderboard([
        { id: '1', name: 'Maria S.', badges: 18, neighborhood: 'Riverside', rank: 1, monthlyPoints: 450 },
        { id: '2', name: 'DeShawn M.', badges: 15, neighborhood: 'Springfield', rank: 2, monthlyPoints: 380 },
        { id: '3', name: 'Tanya A.', badges: 14, neighborhood: 'Downtown', rank: 3, monthlyPoints: 355 },
        { id: '4', name: 'You', badges: 5, neighborhood: 'Riverside', rank: 12, monthlyPoints: 180 },
        { id: '5', name: 'Jordan W.', badges: 12, neighborhood: 'Eastside', rank: 4, monthlyPoints: 320 },
        { id: '6', name: 'Patricia C.', badges: 11, neighborhood: 'San Marco', rank: 5, monthlyPoints: 290 },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleJoinChallenge(challengeId: string) {
    toast.success('Challenge joined! Track your progress here.')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Badges & Achievements</h1>
          <p className="text-harbor-500 mt-1">Earn recognition for your community impact</p>
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

      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm text-harbor-600">Earned: <strong className="text-teal-600">{badges.filter(b => b.earned).length}</strong> / {badges.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map(badge => (
              <div key={badge.id} className={cn('card p-4 rounded-xl text-center transition-all', badge.earned ? 'border-teal-200 bg-gradient-to-b from-teal-50 to-white' : 'opacity-60 grayscale')}>
                <span className="text-3xl block mb-2">{badge.icon}</span>
                <h4 className="font-semibold text-harbor-800 text-sm">{badge.name}</h4>
                <p className="text-xs text-harbor-500 mt-1">{badge.description}</p>
                {badge.earned ? (
                  <p className="text-xs text-teal-600 mt-2 font-medium">Earned {badge.earnedDate}</p>
                ) : (
                  <p className="text-xs text-harbor-400 mt-2">{badge.criteria}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'paths' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-harbor-800">Achievement Paths</h2>
          {paths.map(path => (
            <div key={path.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-harbor-800">{path.name}</h3>
                <span className="text-sm text-teal-600 font-medium">Stage {path.currentStage}/{path.totalStages}</span>
              </div>
              <div className="flex items-center gap-2">
                {path.stages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-1">
                    <div className={cn('flex-1 text-center py-2 px-3 rounded-lg text-xs font-medium', stage.completed ? 'bg-teal-100 text-teal-700' : 'bg-harbor-100 text-harbor-500')}>
                      {stage.name}
                    </div>
                    {idx < path.stages.length - 1 && <span className={cn('text-sm', stage.completed ? 'text-teal-400' : 'text-harbor-300')}>→</span>}
                  </div>
                ))}
              </div>
              <div className="w-full h-2 bg-harbor-100 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-mly-500 rounded-full" style={{ width: `${(path.currentStage / path.totalStages) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Active Challenges</h2>
          {challenges.map(challenge => (
            <div key={challenge.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{challenge.type === 'streak' ? '🔥' : challenge.type === 'event' ? '🎉' : '🎯'}</span>
                  <h4 className="font-semibold text-harbor-800">{challenge.title}</h4>
                </div>
                <span className="text-xs text-harbor-500">Ends: {challenge.endsAt}</span>
              </div>
              <p className="text-sm text-harbor-500 mb-3">{challenge.description}</p>
              <div className="w-full h-2.5 bg-harbor-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(challenge.progress / challenge.target) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-harbor-500">{challenge.progress}/{challenge.target} completed</span>
                <span className="text-xs text-mly-600 font-medium">Reward: {challenge.reward}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Monthly Leaderboard</h2>
          {leaderboard.sort((a, b) => a.rank - b.rank).map(entry => (
            <div key={entry.id} className={cn('card p-4 rounded-xl flex items-center justify-between', entry.name === 'You' ? 'border-2 border-teal-300 bg-teal-50' : '')}>
              <div className="flex items-center gap-3">
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', entry.rank <= 3 ? 'bg-mly-100 text-mly-700' : 'bg-harbor-100 text-harbor-600')}>
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                </span>
                <div>
                  <p className={cn('font-medium', entry.name === 'You' ? 'text-teal-700' : 'text-harbor-800')}>{entry.name}</p>
                  <p className="text-xs text-harbor-500">{entry.neighborhood} | {entry.badges} badges</p>
                </div>
              </div>
              <span className="text-sm font-bold text-mly-600">{entry.monthlyPoints} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
