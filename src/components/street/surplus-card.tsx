'use client';

interface SurplusCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    quantity: string;
    pickup_location: string;
    available_until: string;
    status: string;
    created_at: string;
    profiles: {
      username: string;
      display_name: string;
    };
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🥫',
  goods: '📦',
  clothing: '👕',
  furniture: '🪑',
  other: '🎁',
};

export function SurplusCard({ item }: SurplusCardProps) {
  const expiresIn = getExpiresIn(item.available_until);
  const isUrgent = new Date(item.available_until).getTime() - Date.now() < 4 * 60 * 60 * 1000;

  return (
    <div className={`rounded-lg border p-3 ${isUrgent ? 'border-orange-300 bg-orange-50/50' : ''}`}>
      <div className="flex items-start gap-2">
        <span className="text-2xl">{CATEGORY_ICONS[item.category] || '🎁'}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{item.title}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>📍 {item.pickup_location}</span>
            <span>×{item.quantity}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              From {item.profiles.display_name || item.profiles.username}
            </span>
            <span className={isUrgent ? 'font-medium text-orange-600' : 'text-muted-foreground'}>
              {expiresIn}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getExpiresIn(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}min left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}
