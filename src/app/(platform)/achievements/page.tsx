'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  reward_mly: number;
  starts_at: string;
  ends_at: string;
}

interface ChallengeProgress {
  challenge_id: string;
  progress: number;
  completed: boolean;
}

interface LeaderboardEntry {
  id: string;
  display_name: string;
  trust_score: number;
  mly_balance: number;
  health_streak: number;
}

type AchievementTab = 'badges' | 'challenges' | 'leaderboard';

// Default badges to show even if DB is empty
const DEFAULT_BADGES: Badge[] = [
  { id: 'b1', slug: 'first_checkin', name: 'First Check-in', description: 'Complete your first health check-in', icon: '💚', category: 'onboarding', points: 5 },
  { id: 'b2', slug: 'first_report', name: 'Civic Voice', description: 'Report your first community issue', icon: '📢', category: 'civic', points: 10 },
  { id: 'b3', slug: 'first_vote', name: 'Democracy!', description: 'Cast your first governance vote', icon: '🗳️', category: 'civic', points: 10 },
  { id: 'b4', slug: 'week_streak', name: '7-Day Warrior', description: 'Check in 7 days in a row', icon: '🔥', category: 'engagement', points: 25 },
  { id: 'b5', slug: 'month_streak', name: '30-Day Legend', description: 'Check in 30 days in a row', icon: '⚡', category: 'engagement', points: 100 },
  { id: 'b6', slug: 'first_course', name: 'Scholar', description: 'Complete your first course', icon: '🎓', category: 'education', points: 15 },
  { id: 'b7', slug: 'five_courses', name: 'Knowledge Seeker', description: 'Complete 5 courses', icon: '📚', category: 'education', points: 50 },
  { id: 'b8', slug: 'first_sale', name: 'Entrepreneur', description: 'Make your first sale on MiShop', icon: '💰', category: 'economic', points: 10 },
  { id: 'b9', slug: 'hundred_mly', name: '$100 Club', description: 'Earn 100 $MLY total', icon: '💎', category: 'economic', points: 20 },
  { id: 'b10', slug: 'first_media', name: 'Creator', description: 'Upload your first media content', icon: '🎬', category: 'social', points: 10 },
  { id: 'b11', slug: 'guild_join', name: 'Peace Keeper', description: 'Join the MiGuild', icon: '🛡️', category: 'civic', points: 20 },
  { id: 'b12', slug: 'ten_votes', name: 'Civic Champion', description: 'Vote on 10 proposals', icon: '🏛️', category: 'civic', points: 30 },
  { id: 'b13', slug: 'first_recording', name: 'Community Witness', description: 'Submit your first recording', icon: '📹', category: 'civic', points: 15 },
  { id: 'b14', slug: 'refer_friend', name: 'Connector', description: 'Invite someone who joins MiLyfe', icon: '🤝', category: 'social', points: 20 },
  { id: 'b15', slug: 'constitution_voter', name: 'Founding Voice', description: 'Vote on a constitutional amendment', icon: '📜', category: 'leadership', points: 25 },
  { id: 'b16', slug: 'level_3', name: 'Active Member', description: 'Reach Level 3 standing', icon: '⭐', category: 'engagement', points: 50 },
  { id: 'b17', slug: 'level_5', name: 'Community Leader', description: 'Reach Level 5 standing', icon: '👑', category: 'leadership', points: 200 },
  { id: 'b18', slug: 'wiki_editor', name: 'Knowledge Builder', description: 'Create or edit a wiki page', icon: '📖', category: 'education', points: 10 },
];

const BADGE_CATEGORIES = ['all', 'onboarding', 'engagement', 'civic', 'social', 'economic', 'education', 'leadership'];

export default function AchievementsPage() {
  const [tab, setTab] = useState<AchievementTab>('badges');
  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badgeCategory, setBadgeCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const { user } = useAppStore();

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    const supabase = createClient();

    // Load badges from DB (or use defaults)
    const { data: dbBadges } = await supabase.from('badges').select('*');
    if (dbBadges && dbBadges.length > 0) setBadges(dbBadges);

    // Load user's earned badges
    if (user) {
      const { data: earned } = await supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id);
      if (earned) setUserBadges(earned);
    }

    // Load challenges
    const { data: challs } = await supabase.from('challenges').select('*')
      .gt('ends_at', new Date().toISOString())
      .order('ends_at');
    if (challs) setChallenges(challs);

    // Load user challenge progress
    if (user) {
      const { data: prog } = await supabase.from('challenge_progress').select('challenge_id, progress, completed').eq('user_id', user.id);
      if (prog) setProgress(prog);
    }

    // Leaderboard (top 20 by trust_score)
    const { data: leaders } = await supabase.from('profiles')
      .select('id, display_name, trust_score, mly_balance, health_streak')
      .order('trust_score', { ascending: false })
      .limit(20);
    if (leaders) setLeaderboard(leaders);

    setLoading(false);
  }

  const earnedIds = new Set(userBadges.map((ub) => ub.badge_id));
  const filteredBadges = badgeCategory === 'all' ? badges : badges.filter((b) => b.category === badgeCategory);
  const earnedCount = userBadges.length;
  const totalPoints = badges.filter((b) => earnedIds.has(b.id)).reduce((sum, b) => sum + b.points, 0);

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">🏆 Achievements</h1>
        <p className="text-xs text-gray-500">Badges, challenges, and community leaderboard</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center !p-3">
          <p className="text-xl font-bold text-harbor-800 dark:text-white">{earnedCount}</p>
          <p className="text-xs text-gray-500">Badges</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-xl font-bold text-teal-600">{totalPoints}</p>
          <p className="text-xs text-gray-500">Points</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-xl font-bold text-mly-600">{challenges.length}</p>
          <p className="text-xs text-gray-500">Active Challenges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'badges', label: '🏅 Badges' },
          { key: 'challenges', label: '⚡ Challenges' },
          { key: 'leaderboard', label: '🏆 Leaderboard' },
        ] as { key: AchievementTab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all',
              tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Badges */}
      {tab === 'badges' && (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {BADGE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setBadgeCategory(c)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap',
                  badgeCategory === c ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filteredBadges.map((badge) => {
              const earned = earnedIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    'card text-center !p-3 transition-all',
                    earned ? 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10' : 'opacity-50 grayscale'
                  )}
                >
                  <p className="text-2xl mb-1">{badge.icon}</p>
                  <p className="text-xs font-medium text-harbor-800 dark:text-white line-clamp-1">{badge.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{badge.points} pts</p>
                  {earned && <p className="text-[10px] text-teal-600 mt-0.5">✓ Earned</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <div className="space-y-3">
          {challenges.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">⚡</p>
              <p className="text-sm text-gray-500">No active challenges right now.</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon!</p>
            </div>
          ) : challenges.map((challenge) => {
            const userProgress = progress.find((p) => p.challenge_id === challenge.id);
            const progressPct = userProgress ? Math.min(userProgress.progress, 100) : 0;

            return (
              <div key={challenge.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{challenge.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{challenge.description}</p>
                  </div>
                  <span className="text-xs bg-mly-100 dark:bg-mly-900/20 text-mly-700 dark:text-mly-400 px-2 py-0.5 rounded-full font-medium">
                    +${challenge.reward_mly}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 capitalize">{challenge.type}</span>
                    <span className="text-gray-400">{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-harbor-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400">
                    Ends {new Date(challenge.ends_at).toLocaleDateString()}
                  </p>
                </div>
                {userProgress?.completed && (
                  <p className="text-xs text-green-600 font-medium mt-2">✓ Completed!</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const isMe = user?.id === entry.id;
            return (
              <div
                key={entry.id}
                className={cn(
                  'card flex items-center gap-3 !py-3',
                  isMe && 'border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10'
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  idx === 0 ? 'bg-amber-400 text-amber-900' :
                  idx === 1 ? 'bg-gray-300 text-gray-700' :
                  idx === 2 ? 'bg-orange-300 text-orange-800' :
                  'bg-gray-100 dark:bg-harbor-800 text-gray-600'
                )}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', isMe ? 'text-teal-700 dark:text-teal-400' : 'text-harbor-800 dark:text-white')}>
                    {entry.display_name} {isMe && '(you)'}
                  </p>
                  <p className="text-xs text-gray-400">
                    🔥 {entry.health_streak}d streak · 💰 ${entry.mly_balance?.toFixed(0)} MLY
                  </p>
                </div>
                <span className="text-sm font-bold text-harbor-800 dark:text-white">{entry.trust_score}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
