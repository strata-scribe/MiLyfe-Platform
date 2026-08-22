'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Listing {
  id: string;
  seller_id: string;
  type: string;
  title: string;
  description: string;
  price: number;
  price_type: 'fixed' | 'negotiable' | 'free' | 'trade';
  category: string;
  images: string[];
  location: string | null;
  condition: string | null;
  status: string;
  views: number;
  favorites: number;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null; mly_balance: number };
}

interface SellerProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  listings_count: number;
  rating: number;
  member_since: string;
}

type PurchaseStep = 'view' | 'confirm' | 'complete';

export default function MarketListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('view');
  const [message, setMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);

  const { user } = useAppStore();

  useEffect(() => { loadListing(); }, [listingId]);

  async function loadListing() {
    setLoading(true);
    const supabase = createClient();

    const { data: l } = await supabase
      .from('marketplace_listings')
      .select('*, profiles!marketplace_listings_seller_id_fkey(display_name, avatar_url, mly_balance)')
      .eq('id', listingId)
      .single();
    if (l) {
      setListing(l as any);
      // Increment views
      await supabase.from('marketplace_listings').update({ views: (l.views || 0) + 1 }).eq('id', listingId);

      // Related listings
      const { data: r } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('category', l.category)
        .eq('status', 'active')
        .neq('id', listingId)
        .limit(4);
      if (r) setRelatedListings(r);
    }
    setLoading(false);
  }

  async function handlePurchase() {
    if (!user || !listing) return;
    setPurchasing(true);
    const supabase = createClient();

    // Create transaction
    await supabase.from('marketplace_transactions').insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      status: 'pending',
      message: message.trim() || null,
    });

    // Mark listing as pending
    await supabase.from('marketplace_listings').update({ status: 'pending' }).eq('id', listingId);

    setPurchaseStep('complete');
    setPurchasing(false);
  }

  async function sendOffer() {
    if (!user || !listing || !offerAmount) return;
    const supabase = createClient();
    await supabase.from('marketplace_offers').insert({
      listing_id: listing.id,
      buyer_id: user.id,
      amount: parseFloat(offerAmount),
      message: message.trim() || null,
      status: 'pending',
    });
    setPurchaseStep('complete');
  }

  async function toggleFavorite() {
    if (!user || !listing) return;
    const supabase = createClient();
    if (!favorited) {
      await supabase.from('marketplace_favorites').insert({ user_id: user.id, listing_id: listing.id });
      await supabase.from('marketplace_listings').update({ favorites: listing.favorites + 1 }).eq('id', listingId);
      setListing({ ...listing, favorites: listing.favorites + 1 });
    } else {
      await supabase.from('marketplace_favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id);
      await supabase.from('marketplace_listings').update({ favorites: listing.favorites - 1 }).eq('id', listingId);
      setListing({ ...listing, favorites: listing.favorites - 1 });
    }
    setFavorited(!favorited);
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
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
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/market" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Market</Link>
        <div className="card text-center py-8">
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
          <p className="text-lg font-bold text-harbor-800 dark:text-white">Request Sent!</p>
          <p className="text-sm text-gray-500 mt-2">The seller has been notified. They&apos;ll reach out to arrange the exchange.</p>
          <p className="text-xs text-mly-600 font-bold mt-3">{listing.price} $MLY will be held in escrow</p>
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
          {listing.images && listing.images.length > 0 ? (
            <img src={listing.images[activeImage]} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
          {/* Image dots */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {listing.images.map((_, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={cn('w-2 h-2 rounded-full transition-all', i === activeImage ? 'bg-white w-4' : 'bg-white/50')} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listing Info */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded capitalize">{listing.type}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded capitalize">{listing.category}</span>
              {listing.condition && <span className="text-xs text-gray-400 capitalize">{listing.condition}</span>}
            </div>
            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{listing.title}</h1>
          </div>
          <button onClick={toggleFavorite} className="text-xl">{favorited ? '❤️' : '🤍'}</button>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-mly-600">{listing.price_type === 'free' ? 'FREE' : `$${listing.price}`}</span>
          <span className="text-xs text-gray-500 uppercase">{listing.price_type !== 'free' ? 'MLY' : ''}</span>
          {listing.price_type === 'negotiable' && <span className="text-xs text-teal-600">· Negotiable</span>}
          {listing.price_type === 'trade' && <span className="text-xs text-purple-600">· Open to trades</span>}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>👁 {listing.views} views</span>
          <span>❤️ {listing.favorites} saved</span>
          {listing.location && <span>📍 {listing.location}</span>}
          <span className="ml-auto">{timeAgo(listing.created_at)}</span>
        </div>
      </div>

      {/* Seller */}
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <span className="text-sm">{(listing.profiles as any)?.display_name?.charAt(0) || '?'}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-harbor-800 dark:text-white">{(listing.profiles as any)?.display_name}</p>
          <p className="text-xs text-gray-500">Seller</p>
        </div>
        <Link href="/connect" className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-harbor-800 text-gray-600 rounded-lg">Message</Link>
      </div>

      {/* Purchase Flow */}
      {purchaseStep === 'view' && user && listing.seller_id !== user.id && (
        <div className="card space-y-3">
          {listing.price_type === 'negotiable' && (
            <div>
              <label className="text-xs text-gray-500">Make an offer ($MLY)</label>
              <input value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder={`Asking: $${listing.price}`} className="input-field mt-1" type="number" />
            </div>
          )}
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message to seller (optional)" className="input-field resize-none text-sm" rows={2} />
          <div className="flex gap-2">
            {listing.price_type === 'negotiable' && offerAmount && (
              <button onClick={sendOffer} className="flex-1 py-2.5 bg-purple-500 text-white text-sm rounded-lg font-medium">Send Offer (${offerAmount} MLY)</button>
            )}
            <button onClick={() => setPurchaseStep('confirm')} className="flex-1 btn-teal">
              {listing.price_type === 'free' ? 'Request Item' : `Buy for $${listing.price} MLY`}
            </button>
          </div>
        </div>
      )}

      {/* Confirm step */}
      {purchaseStep === 'confirm' && (
        <div className="card space-y-3 border-2 border-mly-200 dark:border-mly-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Confirm Purchase</h3>
          <div className="bg-gray-50 dark:bg-harbor-900 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Item</span>
              <span className="text-harbor-800 dark:text-white font-medium">{listing.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price</span>
              <span className="text-mly-600 font-bold">${listing.price} MLY</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seller</span>
              <span>{(listing.profiles as any)?.display_name}</span>
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

      {/* Related */}
      {relatedListings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Similar Listings</h3>
          <div className="grid grid-cols-2 gap-2">
            {relatedListings.map(r => (
              <Link key={r.id} href={`/market/${r.id}`} className="card p-3 hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 dark:bg-harbor-800 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white line-clamp-2">{(r as any).title}</p>
                <p className="text-xs text-mly-600 font-bold mt-1">${(r as any).price} MLY</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
