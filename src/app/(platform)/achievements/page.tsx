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
  category: string
  earned: boolean
  earned_at?: string
}

interface Challenge {
  id: string
  title: string
  description: string
  type: string
  target: number
  ends_at: string
  reward: string
  active: boolean
  progress: number
}

interface LeaderboardEntry {
  id: string
  display_name: string
  neighborhood: string
  mly_balance: number
  trust_score: number
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('badges')
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<Badge[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
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
      const supabase = createClient()
      const userId = user?.id || ''

      const [badgesRes, userBadgesRes, challengesRes, progressRes, leaderboardRes] = await Promise.all([
        supabase.from('platform_badges').select('*').order('created_at', { ascending: true }),
        supabase.from('user_badges').select('*').eq('user_id', userId),
        supabase.from('platform_challenges').select('*').eq('active', true).order('ends_at', { ascending: true }),
        supabase.from('user_challenge_progress').select('*').eq('user_id', userId),
        supabase.from('profiles').select('id, display_name, neighborhood, mly_balance, trust_score').order('trust_score', { ascending: false }).limit(20),
      ])

      const userBadgeMap = new Map((userBadgesRes.data || []).map((ub: any) => [ub.badge_id, ub.earned_at]))
      const enrichedBadges = (badgesRes.data || []).map((badge: any) => ({
        ...badge,
        earned: userBadgeMap.has(badge.id),
        earned_at: userBadgeMap.get(badge.id) || null,
      }))
      setBadges(enrichedBadges)

      const progressMap = new Map((progressRes.data || []).map((p: any) => [p.challenge_id, p.progress]))
      const enrichedChallenges = (challengesRes.data || []).map((challenge: any) => ({
        ...challenge,
        progress: progressMap.get(challenge.id) || 0,
      }))
      setChallenges(enrichedChallenges)

      setLeaderboard(leaderboardRes.data || [])
    } catch (err) {
      toast.error('Failed to load achievement data')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinChallenge(challengeId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('user_challenge_progress').insert({
      user_id: user?.id,
      challenge_id: challengeId,
      progress: 0,
    })

    if (error) {
      toast.error('Failed to join challenge')
      return
    }
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
          {badges.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No badges available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className={cn('card p-4 rounded-xl text-center transition-all', badge.earned ? 'border-teal-200 bg-gradient-to-b from-teal-50 to-white' : 'opacity-60 grayscale')}>
                  <span className="text-3xl block mb-2">{badge.icon}</span>
                  <h4 className="font-semibold text-harbor-800 text-sm">{badge.name}</h4>
                  <p className="text-xs text-harbor-500 mt-1">{badge.description}</p>
                  {badge.earned ? (
                    <p className="text-xs text-teal-600 mt-2 font-medium">Earned {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString() : ''}</p>
                  ) : (
                    <p className="text-xs text-harbor-400 mt-2">{badge.criteria}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'paths' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-harbor-800">Achievement Paths</h2>
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">Achievement paths are computed from your badge progress. Earn more badges to unlock paths!</p>
            {badges.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-harbor-600">You have earned <strong className="text-teal-600">{badges.filter(b => b.earned).length}</strong> badges across {Array.from(new Set(badges.filter(b => b.earned).map(b => b.category))).length} categories.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Active Challenges</h2>
          {challenges.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No active challenges right now. Check back soon!</p>
            </div>
          ) : challenges.map(challenge => (
            <div key={challenge.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{challenge.type === 'streak' ? '🔥' : challenge.type === 'event' ? '🎉' : '🎯'}</span>
                  <h4 className="font-semibold text-harbor-800">{challenge.title}</h4>
                </div>
                <span className="text-xs text-harbor-500">Ends: {new Date(challenge.ends_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-harbor-500 mb-3">{challenge.description}</p>
              <div className="w-full h-2.5 bg-harbor-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${challenge.target > 0 ? (challenge.progress / challenge.target) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-harbor-500">{challenge.progress}/{challenge.target} completed</span>
                <span className="text-xs text-mly-600 font-medium">Reward: {challenge.reward}</span>
              </div>
              {challenge.progress === 0 && (
                <button onClick={() => handleJoinChallenge(challenge.id)} className="btn-teal px-3 py-1 rounded text-xs mt-2">Join Challenge</button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Community Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No leaderboard data yet. Be the first to earn trust!</p>
            </div>
          ) : leaderboard.map((entry, idx) => (
            <div key={entry.id} className={cn('card p-4 rounded-xl flex items-center justify-between', entry.id === user?.id ? 'border-2 border-teal-300 bg-teal-50' : '')}>
              <div className="flex items-center gap-3">
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', idx < 3 ? 'bg-mly-100 text-mly-700' : 'bg-harbor-100 text-harbor-600')}>
                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                </span>
                <div>
                  <p className={cn('font-medium', entry.id === user?.id ? 'text-teal-700' : 'text-harbor-800')}>{entry.display_name || 'Anonymous'}</p>
                  <p className="text-xs text-harbor-500">{entry.neighborhood || 'Unknown'} | Trust: {entry.trust_score}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-mly-600">{entry.mly_balance} $MLY</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
