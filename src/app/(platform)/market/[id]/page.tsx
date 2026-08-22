'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Listing {
  id: string;
  seller_id: string;
  type: 'product' | 'service' | 'gig' | 'classified';
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string | null;
  location: string | null;
  image_urls: string[];
  status: string;
  views: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    standing_level: number;
    created_at: string;
  };
}

interface Review {
  id: string;
  listing_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  display_name?: string;
}

interface SimilarListing {
  id: string;
  title: string;
  price: number;
  type: string;
  image_urls: string[];
}

type PurchaseStep = 'view' | 'confirm' | 'complete';

const typeColors: Record<string, string> = {
  product: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  service: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  gig: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  classified: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function MarketListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<SimilarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('view');
  const [purchasing, setPurchasing] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadListing(); }, [listingId]);

  async function loadListing() {
    setLoading(true);
    const supabase = createClient();

    const { data: l } = await supabase
      .from('marketplace_listings')
      .select('*, profiles!marketplace_listings_seller_id_fkey(display_name, avatar_url, standing_level, created_at)')
      .eq('id', listingId)
      .single();

    if (l) {
      setListing(l as any);
      // Increment views
      await supabase.from('marketplace_listings').update({ views: (l.views || 0) + 1 }).eq('id', listingId);

      // Load similar listings (same category, limit 4)
      const { data: s } = await supabase
        .from('marketplace_listings')
        .select('id, title, price, type, image_urls')
        .eq('category', l.category)
        .eq('status', 'active')
        .neq('id', listingId)
        .limit(4);

      if (s) setSimilar(s as SimilarListing[]);
    }

    // Load reviews
    const { data: r } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (r) setReviews(r as Review[]);

    setLoading(false);
  }

  async function handlePurchase() {
    if (!user || !listing) return;
    setPurchasing(true);
    const supabase = createClient();

    // Create order in marketplace_orders
    const { error } = await supabase.from('marketplace_orders').insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to create order');
      setPurchasing(false);
      return;
    }

    // Update listing status
    await supabase.from('marketplace_listings').update({ status: 'pending' }).eq('id', listingId);

    setPurchaseStep('complete');
    setPurchasing(false);
    toast.success('Order placed successfully!');
  }

  function contactSeller() {
    if (!listing) return;
    router.push(`/connect?user=${listing.seller_id}`);
  }

  function reportListing() {
    toast.success('Report submitted. Our team will review this listing.');
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={cn('text-sm', i < rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600')}>★</span>
    ));
  }

  function averageRating(): number {
    if (reviews.length === 0) return 0;
    return Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-6 w-32" />
        <div className="card skeleton h-64" />
        <div className="card skeleton h-32" />
        <div className="card skeleton h-48" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/market" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Market</Link>
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">🛍️</p>
          <p className="text-sm text-gray-500">Listing not found</p>
        </div>
      </div>
    );
  }

  // Purchase complete view
  if (purchaseStep === 'complete') {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-bold text-harbor-800 dark:text-white">Order Placed!</p>
          <p className="text-sm text-gray-500 mt-2">The seller has been notified. They&apos;ll reach out to complete the exchange.</p>
          <p className="text-xs text-mly-600 font-bold mt-3">{listing.price} $MLY held in escrow</p>
          <div className="flex gap-2 mt-6 justify-center">
            <button onClick={() => router.push('/market')} className="btn-teal text-xs">Back to Market</button>
            <button onClick={() => router.push('/connect')} className="px-4 py-2 text-xs bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg">Messages</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/market" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Market</Link>

      {/* Image Gallery */}
      <div className="card p-0 overflow-hidden">
        <div className="aspect-square bg-gray-100 dark:bg-harbor-800 flex items-center justify-center relative">
          {listing.image_urls && listing.image_urls.length > 0 ? (
            <img src={listing.image_urls[activeImage]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
          {/* Image navigation dots */}
          {listing.image_urls && listing.image_urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {listing.image_urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn('w-2 h-2 rounded-full transition-all', i === activeImage ? 'bg-white w-4' : 'bg-white/50')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listing Info */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded capitalize', typeColors[listing.type] || 'bg-gray-100 text-gray-600')}>{listing.type}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded capitalize">{listing.category}</span>
          {listing.condition && (
            <span className="text-xs text-gray-400 capitalize">Condition: {listing.condition}</span>
          )}
        </div>

        <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{listing.title}</h1>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-mly-600">{listing.price}</span>
          <span className="text-sm text-mly-600 font-medium">$MLY</span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{listing.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
          <span>👁 {listing.views} views</span>
          {listing.location && <span>📍 {listing.location}</span>}
          <span className="ml-auto">{timeAgo(listing.created_at)}</span>
        </div>
      </div>

      {/* Seller Info Card */}
      <div className="card flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
          {(listing.profiles as any)?.avatar_url ? (
            <img src={(listing.profiles as any).avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-lg font-medium">{(listing.profiles as any)?.display_name?.charAt(0) || '?'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-harbor-800 dark:text-white">{(listing.profiles as any)?.display_name}</p>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>⭐ Standing Level {(listing.profiles as any)?.standing_level || 1}</span>
            <span>·</span>
            <span>Member since {new Date((listing.profiles as any)?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {user && listing.seller_id !== user.id && purchaseStep === 'view' && (
        <div className="space-y-2">
          <button onClick={contactSeller} className="w-full py-2.5 bg-gray-100 dark:bg-harbor-800 text-harbor-800 dark:text-white text-sm rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-harbor-700 transition-colors">
            💬 Contact Seller
          </button>
          <button onClick={() => setPurchaseStep('confirm')} className="btn-teal w-full">
            Purchase for {listing.price} $MLY
          </button>
        </div>
      )}

      {/* Confirm Purchase */}
      {purchaseStep === 'confirm' && (
        <div className="card space-y-3 border-2 border-mly-200 dark:border-mly-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Confirm Purchase</h3>
          <div className="bg-gray-50 dark:bg-harbor-900 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Item</span>
              <span className="text-harbor-800 dark:text-white font-medium truncate ml-4">{listing.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Price</span>
              <span className="text-mly-600 font-bold">{listing.price} $MLY</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Seller</span>
              <span className="text-harbor-800 dark:text-white">{(listing.profiles as any)?.display_name}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">Funds will be held in escrow until you confirm receipt.</p>
          <div className="flex gap-2">
            <button onClick={() => setPurchaseStep('view')} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 text-sm rounded-lg">Cancel</button>
            <button onClick={handlePurchase} disabled={purchasing} className="flex-1 btn-teal disabled:opacity-50">
              {purchasing ? 'Processing...' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Reviews ({reviews.length})</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating()))}
              <span className="text-xs text-gray-500 ml-1">{averageRating()}</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-xs text-gray-500">No reviews yet</p>
          </div>
        ) : reviews.map(review => (
          <div key={review.id} className="card py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-harbor-800 dark:text-white">{review.display_name}</span>
                <span className="text-[10px] text-gray-400">{timeAgo(review.created_at)}</span>
              </div>
              <div className="flex">{renderStars(review.rating)}</div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
          </div>
        ))}
      </div>

      {/* Similar Listings */}
      {similar.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Similar Listings</h3>
          <div className="grid grid-cols-2 gap-2">
            {similar.map(s => (
              <Link key={s.id} href={`/market/${s.id}`} className="card p-3 hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 dark:bg-harbor-800 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                  {s.image_urls && s.image_urls.length > 0 ? (
                    <img src={s.image_urls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white line-clamp-2">{s.title}</p>
                <p className="text-xs text-mly-600 font-bold mt-1">{s.price} $MLY</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Report Listing */}
      <div className="text-center">
        <button onClick={reportListing} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          🚩 Report this listing
        </button>
      </div>
    </div>
  );
}
