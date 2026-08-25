'use client';

interface ResourceCardProps {
  resource: {
    id: string;
    name: string;
    category: string;
    description: string;
    address: string | null;
    phone: string | null;
    url: string | null;
    accepts_mly: boolean;
    verified_at: string | null;
    confidence: number;
    expires_at: string | null;
    status: string;
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  shelter: '🏠',
  food: '🍎',
  legal: '⚖️',
  clinic: '🏥',
  transit: '🚌',
  jobs: '💼',
  housing: '🔑',
  mental_health: '🧠',
  substance_recovery: '💚',
  childcare: '👶',
  clothing: '👕',
  financial: '💰',
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const isStale =
    resource.expires_at && new Date(resource.expires_at) < new Date();
  const freshnessColor = resource.confidence >= 0.8
    ? 'text-green-600'
    : resource.confidence >= 0.5
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className={`rounded-lg border p-4 ${isStale ? 'border-yellow-300 bg-yellow-50/50' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{CATEGORY_ICONS[resource.category] || '📍'}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium">{resource.name}</h3>
            {resource.accepts_mly && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                $MLY
              </span>
            )}
          </div>

          {resource.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {resource.description}
            </p>
          )}

          {/* Contact info */}
          <div className="mt-2 space-y-0.5 text-sm">
            {resource.address && (
              <p className="text-muted-foreground">📍 {resource.address}</p>
            )}
            {resource.phone && (
              <p>
                <a href={`tel:${resource.phone}`} className="text-primary hover:underline">
                  📞 {resource.phone}
                </a>
              </p>
            )}
          </div>

          {/* Freshness indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={freshnessColor}>
              {resource.confidence >= 0.8
                ? '● Verified'
                : resource.confidence >= 0.5
                  ? '● Likely current'
                  : '● Unverified'}
            </span>
            {resource.verified_at && (
              <span className="text-muted-foreground">
                Checked {new Date(resource.verified_at).toLocaleDateString()}
              </span>
            )}
            {isStale && (
              <span className="rounded bg-yellow-200 px-1.5 py-0.5 font-medium text-yellow-800">
                May be outdated
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
