'use client';

import { useStanding } from '@/lib/standing/use-standing';
import { STANDING_LEVELS } from '@/lib/standing';

export function StandingBadge({ compact = false }: { compact?: boolean }) {
  const { level, points, progress, loading } = useStanding();

  if (loading) return <div className="h-6 w-20 bg-gray-200 dark:bg-harbor-800 rounded animate-pulse" />;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${level.color}`}>
        <span>{level.icon}</span>
        <span>Lv.{level.level}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`text-2xl`}>{level.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${level.color}`}>{level.name}</span>
          <span className="text-xs text-gray-400">{points} pts</span>
        </div>
        {progress.next && (
          <div className="mt-1">
            <div className="h-1.5 bg-gray-200 dark:bg-harbor-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {progress.next.minPoints - points} pts to {progress.next.icon} {progress.next.name}
            </p>
          </div>
        )}
        {!progress.next && (
          <p className="text-[10px] text-gray-400 mt-0.5">Max level reached!</p>
        )}
      </div>
    </div>
  );
}

/** Full standing card with breakdown */
export function StandingCard() {
  const { level, points, progress, breakdown, loading } = useStanding();

  if (loading) return <div className="card skeleton h-48" />;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Community Standing</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-harbor-800 ${level.color}`}>
          {level.icon} Level {level.level}
        </span>
      </div>

      {/* Level progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${level.color}`}>{level.name}</span>
          <span className="text-gray-400">
            {progress.next ? `${points}/${progress.next.minPoints} pts` : `${points} pts`}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-harbor-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
            style={{ width: `${progress.progress * 100}%` }}
          />
        </div>
        {progress.next && (
          <p className="text-[10px] text-gray-400">
            {progress.next.minPoints - points} more points to unlock {progress.next.name}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between bg-gray-50 dark:bg-harbor-800/50 rounded px-2 py-1.5">
          <span className="text-gray-500">Check-ins</span>
          <span className="font-medium text-harbor-800 dark:text-white">{breakdown.checkins} × 1pt</span>
        </div>
        <div className="flex justify-between bg-gray-50 dark:bg-harbor-800/50 rounded px-2 py-1.5">
          <span className="text-gray-500">Reports</span>
          <span className="font-medium text-harbor-800 dark:text-white">{breakdown.issues} × 3pt</span>
        </div>
        <div className="flex justify-between bg-gray-50 dark:bg-harbor-800/50 rounded px-2 py-1.5">
          <span className="text-gray-500">Votes</span>
          <span className="font-medium text-harbor-800 dark:text-white">{breakdown.votes} × 2pt</span>
        </div>
        <div className="flex justify-between bg-gray-50 dark:bg-harbor-800/50 rounded px-2 py-1.5">
          <span className="text-gray-500">Content</span>
          <span className="font-medium text-harbor-800 dark:text-white">{breakdown.content} × 5pt</span>
        </div>
        <div className="flex justify-between bg-gray-50 dark:bg-harbor-800/50 rounded px-2 py-1.5">
          <span className="text-gray-500">Transfers</span>
          <span className="font-medium text-harbor-800 dark:text-white">{breakdown.transactions} × 1pt</span>
        </div>
        <div className="flex justify-between bg-gray-50 dark:bg-harbor-800/50 rounded px-2 py-1.5">
          <span className="text-gray-500">Days active</span>
          <span className="font-medium text-harbor-800 dark:text-white">{breakdown.daysActive} × 1pt</span>
        </div>
      </div>

      {/* Levels preview */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-harbor-800">
        {STANDING_LEVELS.map((l) => (
          <div
            key={l.level}
            className={`flex flex-col items-center gap-0.5 ${
              l.level <= level.level ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <span className="text-lg">{l.icon}</span>
            <span className="text-[9px] text-gray-400">{l.minPoints}+</span>
          </div>
        ))}
      </div>
    </div>
  );
}
