'use client';

import Link from 'next/link';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    category: string;
    price_mly: number;
    price_type: string;
    images: string[];
    location_text: string | null;
    created_at: string;
    profiles: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍎',
  services: '🔧',
  rides: '🚗',
  goods: '📦',
  education: '📚',
  housing: '🏠',
  jobs: '💼',
};

export function ListingCard({ listing }: ListingCardProps) {
  const timeAgo = getTimeAgo(listing.created_at);

  return (
    <Link
      href={`/street/listing/${listing.id}`}
      className="block overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >  {/* Image placeholder or first image */}
      <div className="flex h-32 items-center justify-center bg-muted text-4xl">
        {listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          CATEGORY_ICONS[listing.category] || '📦'
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
          <span className="shrink-0 font-bold text-green-600">
            {listing.price_type === 'free'
              ? 'Free'
              : `${listing.price_mly} $MLY`}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {listing.description}
        </p>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{listing.profiles.display_name || listing.profiles.username}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
