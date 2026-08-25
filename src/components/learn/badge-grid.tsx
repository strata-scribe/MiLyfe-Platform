'use client';

interface Badge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
  path_id: string;
}

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-4xl">🏅</p>
        <p className="mt-2 text-lg font-medium">No badges yet</p>
        <p className="text-muted-foreground">
          Complete a learning path to earn your first badge. Badges are yours forever
          — they leave with you if you ever move.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex flex-col items-center rounded-lg border p-4 text-center"
        >
          <span className="text-4xl">{badge.badge_icon}</span>
          <h3 className="mt-2 font-medium">{badge.badge_name}</h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {badge.badge_description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Earned {new Date(badge.earned_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
