'use client';

import { useStanding } from '@/lib/standing/use-standing';
import { GATED_FEATURES, STANDING_LEVELS } from '@/lib/standing';

interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  /** What to show when feature is locked (defaults to lock overlay) */
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that gates children behind a standing level requirement.
 * If the user doesn't meet the requirement, shows a lock message.
 */
export function FeatureGate({ featureId, children, fallback }: FeatureGateProps) {
  const { level, loading } = useStanding();

  const feature = GATED_FEATURES.find((f) => f.id === featureId);
  if (!feature) return <>{children}</>; // Unknown feature, show anyway

  if (loading) return <div className="animate-pulse h-16 bg-gray-100 dark:bg-harbor-800 rounded-lg" />;

  const unlocked = level.level >= feature.requiredLevel;

  if (unlocked) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const requiredLevel = STANDING_LEVELS.find((l) => l.level === feature.requiredLevel);

  return (
    <div className="relative rounded-xl border-2 border-dashed border-gray-200 dark:border-harbor-700 bg-gray-50/50 dark:bg-harbor-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-harbor-800 flex items-center justify-center text-lg">
          🔒
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-harbor-800 dark:text-white">
            {feature.name}
          </p>
          <p className="text-xs text-gray-500">
            Requires {requiredLevel?.icon} Level {feature.requiredLevel} ({requiredLevel?.name})
          </p>
        </div>
        <span className="text-xs bg-gray-200 dark:bg-harbor-800 text-gray-500 px-2 py-1 rounded-full">
          Locked
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {feature.description}. Participate more in the community to unlock this feature.
      </p>
    </div>
  );
}

/** Shows all gated features and their unlock status */
export function FeatureUnlockList() {
  const { level, loading } = useStanding();

  if (loading) return <div className="card skeleton h-64" />;

  const features = GATED_FEATURES.map((f) => ({
    ...f,
    unlocked: level.level >= f.requiredLevel,
    requiredLevelInfo: STANDING_LEVELS.find((l) => l.level === f.requiredLevel),
  }));

  const unlocked = features.filter((f) => f.unlocked);
  const locked = features.filter((f) => !f.unlocked);

  return (
    <div className="space-y-4">
      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">
            ✓ Unlocked ({unlocked.length})
          </h3>
          <div className="space-y-2">
            {unlocked.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50"
              >
                <span className="text-lg">{f.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">{f.name}</p>
                  <p className="text-[10px] text-gray-500">{f.description}</p>
                </div>
                <span className="text-green-600 text-xs">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">
            🔒 Locked ({locked.length})
          </h3>
          <div className="space-y-2">
            {locked.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-harbor-800/50 border border-gray-200 dark:border-harbor-700 opacity-70"
              >
                <span className="text-lg grayscale">{f.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-harbor-800 dark:text-white">{f.name}</p>
                  <p className="text-[10px] text-gray-500">
                    Requires {f.requiredLevelInfo?.icon} Lv.{f.requiredLevel} ({f.requiredLevelInfo?.name})
                  </p>
                </div>
                <span className="text-gray-400 text-xs">🔒</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
