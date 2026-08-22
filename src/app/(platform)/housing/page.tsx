'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { format, formatDistanceToNow } from 'date-fns';

type HousingTab = 'browse' | 'post' | 'reviews' | 'my';
type ListingType = 'rent' | 'roommate' | 'sublet' | 'room';
type SortOption = 'date' | 'price_asc' | 'price_desc';

interface Listing {
  id: string;
  user_id: string;
  type: ListingType;
  title: string;
  description: string;
  price_monthly: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  neighborhood: string;
  available_date: string;
  anonymous: boolean;
  status: 'active' | 'filled' | 'deleted';
  created_at: string;
  profiles?: { display_name: string };
}

interface Review {
  id: string;
  reviewer_id: string;
  property_address: string;
  rating: number;
  review: string;
  anonymous: boolean;
  created_at: string;
  profiles?: { display_name: string };
}

const listingTypes: { key: ListingType; label: string; icon: string; color: string; gradient: string }[] = [
  { key: 'rent', label: 'Rental', icon: '🏠', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-400 to-blue-600' },
  { key: 'roommate', label: 'Roommate', icon: '👥', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', gradient: 'from-purple-400 to-purple-600' },
  { key: 'sublet', label: 'Sublet', icon: '📅', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-amber-600' },
  { key: 'room', label: 'Room', icon: '🛏️', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', gradient: 'from-teal-400 to-teal-600' },
];

const tabs: { key: HousingTab; label: string; icon: string }[] = [
  { key: 'browse', label: 'Browse', icon: '🔍' },
  { key: 'post', label: 'Post', icon: '➕' },
  { key: 'reviews', label: 'Reviews', icon: '⭐' },
  { key: 'my', label: 'My Listings', icon: '📋' },
];

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            size === 'lg' ? 'text-xl' : 'text-sm',
            star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          )}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            'text-3xl transition-transform hover:scale-125',
            star <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function HousingPage() {
  const [tab, setTab] = useState<HousingTab>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ListingType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [refreshKey, setRefreshKey] = useState(0);

  // Post form state
  const [postType, setPostType] = useState<ListingType | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postBeds, setPostBeds] = useState('1');
  const [postBaths, setPostBaths] = useState('1');
  const [postAddress, setPostAddress] = useState('');
  const [postNeighborhood, setPostNeighborhood] = useState('');
  const [postAvailDate, setPostAvailDate] = useState('');
  const [postAnonymous, setPostAnonymous] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [posting, setPosting] = useState(false);

  // Review form state
  const [reviewAddress, setReviewAddress] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit state
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: listingsData } = await supabase
      .from('housing_listings')
      .select('*, profiles!housing_listings_user_id_fkey(display_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (listingsData) setListings(listingsData);

    const { data: reviewsData } = await supabase
      .from('landlord_reviews')
      .select('*, profiles!landlord_reviews_reviewer_id_fkey(display_name)')
      .order('created_at', { ascending: false });

    if (reviewsData) setReviews(reviewsData);

    if (user) {
      const { data: mine } = await supabase
        .from('housing_listings')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });
      if (mine) setMyListings(mine);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const filteredListings = listings
    .filter((l) => typeFilter === 'all' || l.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_monthly - b.price_monthly;
      if (sortBy === 'price_desc') return b.price_monthly - a.price_monthly;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handlePost = async () => {
    if (!user || !postType || !postTitle.trim() || !postPrice) return;
    setPosting(true);

    await supabase.from('housing_listings').insert({
      user_id: user.id,
      type: postType,
      title: postTitle.trim(),
      description: postDesc.trim(),
      price_monthly: parseFloat(postPrice),
      bedrooms: parseInt(postBeds),
      bathrooms: parseInt(postBaths),
      address: postAddress.trim(),
      neighborhood: postNeighborhood.trim(),
      available_date: postAvailDate || null,
      anonymous: postAnonymous,
      status: 'active',
    });

    // Reset form
    setPostType(null);
    setPostTitle('');
    setPostDesc('');
    setPostPrice('');
    setPostBeds('1');
    setPostBaths('1');
    setPostAddress('');
    setPostNeighborhood('');
    setPostAvailDate('');
    setPostAnonymous(false);
    setShowPreview(false);
    setPosting(false);
    setRefreshKey((k) => k + 1);
    setTab('browse');
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewAddress.trim() || reviewRating === 0 || !reviewText.trim()) return;
    setSubmittingReview(true);

    await supabase.from('landlord_reviews').insert({
      reviewer_id: user.id,
      property_address: reviewAddress.trim(),
      rating: reviewRating,
      review: reviewText.trim(),
      anonymous: reviewAnonymous,
    });

    setReviewAddress('');
    setReviewRating(0);
    setReviewText('');
    setReviewAnonymous(false);
    setSubmittingReview(false);
    setRefreshKey((k) => k + 1);
  };

  const handleMarkFilled = async (id: string) => {
    await supabase.from('housing_listings').update({ status: 'filled' }).eq('id', id);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('housing_listings').update({ status: 'deleted' }).eq('id', id);
    setRefreshKey((k) => k + 1);
  };

  const handleEditPrice = async (id: string) => {
    if (!editPriceValue) return;
    await supabase.from('housing_listings').update({ price_monthly: parseFloat(editPriceValue) }).eq('id', id);
    setEditingPrice(null);
    setEditPriceValue('');
    setRefreshKey((k) => k + 1);
  };

  const getTypeInfo = (type: ListingType) => listingTypes.find((t) => t.key === type)!;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Housing Board</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Find rentals, roommates, and sublets in your community.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all',
              tab === t.key
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <span className="hidden sm:inline">{t.icon} </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setTypeFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  typeFilter === 'all'
                    ? 'bg-harbor-800 text-white dark:bg-white dark:text-harbor-800'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                All
              </button>
              {listingTypes.map((lt) => (
                <button
                  key={lt.key}
                  onClick={() => setTypeFilter(lt.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                    typeFilter === lt.key
                      ? 'bg-harbor-800 text-white dark:bg-white dark:text-harbor-800'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  {lt.icon} {lt.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input-field text-xs !py-1.5 !w-auto"
            >
              <option value="date">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>

          {/* Listings */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card skeleton h-56" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🏠</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No listings found</p>
              <p className="text-xs text-gray-400 mt-1">Try changing your filters or post a new listing.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredListings.map((listing) => {
                const typeInfo = getTypeInfo(listing.type);
                return (
                  <div key={listing.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image placeholder */}
                    <div className={cn('h-28 -mx-4 -mt-4 mb-3 bg-gradient-to-br flex items-center justify-center', typeInfo.gradient)}>
                      <span className="text-4xl opacity-80">{typeInfo.icon}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeInfo.color)}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        <span className="text-lg font-bold text-harbor-800 dark:text-white">
                          ${listing.price_monthly}<span className="text-xs font-normal text-gray-400">/mo</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-harbor-800 dark:text-white line-clamp-1">
                        {listing.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>🛏️ {listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}</span>
                        <span>🚿 {listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}</span>
                      </div>

                      {listing.neighborhood && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          📍 {listing.neighborhood}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs text-gray-400">
                          {listing.available_date
                            ? `Available ${format(new Date(listing.available_date), 'MMM d, yyyy')}`
                            : 'Available now'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {listing.anonymous ? 'Anonymous' : listing.profiles?.display_name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Post Tab */}
      {tab === 'post' && (
        <div className="space-y-4 animate-slide-up">
          {!postType ? (
            <>
              <h2 className="text-lg font-bold text-harbor-800 dark:text-white">What are you listing?</h2>
              <div className="grid grid-cols-2 gap-3">
                {listingTypes.map((lt) => (
                  <button
                    key={lt.key}
                    onClick={() => setPostType(lt.key)}
                    className="card text-center space-y-2 hover:shadow-md transition-all hover:scale-[1.02]"
                  >
                    <span className="text-3xl">{lt.icon}</span>
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{lt.label}</p>
                  </button>
                ))}
              </div>
            </>
          ) : showPreview ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-harbor-800 dark:text-white">Preview</h2>
                <button onClick={() => setShowPreview(false)} className="text-xs text-teal-600 font-medium">
                  ← Edit
                </button>
              </div>

              <div className={cn('h-24 rounded-lg bg-gradient-to-br flex items-center justify-center', getTypeInfo(postType).gradient)}>
                <span className="text-3xl opacity-80">{getTypeInfo(postType).icon}</span>
              </div>

              <div className="space-y-2">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium inline-block', getTypeInfo(postType).color)}>
                  {getTypeInfo(postType).icon} {getTypeInfo(postType).label}
                </span>
                <h3 className="text-base font-semibold text-harbor-800 dark:text-white">{postTitle}</h3>
                {postDesc && <p className="text-sm text-gray-600 dark:text-gray-400">{postDesc}</p>}
                <p className="text-lg font-bold text-harbor-800 dark:text-white">${postPrice}/mo</p>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>🛏️ {postBeds} beds</span>
                  <span>🚿 {postBaths} baths</span>
                </div>
                {postNeighborhood && <p className="text-xs text-gray-500">📍 {postNeighborhood}</p>}
                {postAvailDate && <p className="text-xs text-gray-500">Available {format(new Date(postAvailDate), 'MMM d, yyyy')}</p>}
                {postAnonymous && <p className="text-xs text-gray-400 italic">Posted anonymously</p>}
              </div>

              <button onClick={handlePost} disabled={posting} className="btn-teal w-full">
                {posting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          ) : (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-harbor-800 dark:text-white">
                  {getTypeInfo(postType).icon} {getTypeInfo(postType).label} Details
                </h2>
                <button onClick={() => setPostType(null)} className="text-xs text-gray-500 hover:text-gray-700">
                  ← Back
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="input-field"
                  placeholder="Listing title"
                />

                <textarea
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Description (amenities, rules, etc.)"
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">$/month</label>
                    <input type="number" value={postPrice} onChange={(e) => setPostPrice(e.target.value)} className="input-field" placeholder="800" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Beds</label>
                    <input type="number" value={postBeds} onChange={(e) => setPostBeds(e.target.value)} className="input-field" min="0" max="10" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Baths</label>
                    <input type="number" value={postBaths} onChange={(e) => setPostBaths(e.target.value)} className="input-field" min="0" max="5" />
                  </div>
                </div>

                <input
                  type="text"
                  value={postAddress}
                  onChange={(e) => setPostAddress(e.target.value)}
                  className="input-field"
                  placeholder="Address (or general area)"
                />

                <input
                  type="text"
                  value={postNeighborhood}
                  onChange={(e) => setPostNeighborhood(e.target.value)}
                  className="input-field"
                  placeholder="Neighborhood"
                />

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Available Date</label>
                  <input
                    type="date"
                    value={postAvailDate}
                    onChange={(e) => setPostAvailDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postAnonymous}
                    onChange={(e) => setPostAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Post anonymously</span>
                </label>
              </div>

              <button
                onClick={() => setShowPreview(true)}
                disabled={!postTitle.trim() || !postPrice}
                className="btn-teal w-full disabled:opacity-50"
              >
                Preview Listing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {/* Average rating */}
          {averageRating && (
            <div className="card flex items-center gap-3">
              <div className="text-3xl font-bold text-harbor-800 dark:text-white">{averageRating}</div>
              <div>
                <StarDisplay rating={Math.round(parseFloat(averageRating))} size="lg" />
                <p className="text-xs text-gray-500 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {/* Submit review form */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Write a Review</h3>
            <input
              type="text"
              value={reviewAddress}
              onChange={(e) => setReviewAddress(e.target.value)}
              className="input-field"
              placeholder="Property address or landlord name"
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Rating</label>
              <StarSelector value={reviewRating} onChange={setReviewRating} />
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder="Share your experience..."
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reviewAnonymous}
                onChange={(e) => setReviewAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Post anonymously</span>
            </label>
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview || !reviewAddress.trim() || reviewRating === 0 || !reviewText.trim()}
              className="btn-gold w-full disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>

          {/* Reviews list */}
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <StarDisplay rating={review.rating} />
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  📍 {review.property_address}
                </p>
                <p className="text-sm text-harbor-800 dark:text-white">{review.review}</p>
                <p className="text-xs text-gray-400">
                  — {review.anonymous ? 'Anonymous' : review.profiles?.display_name || 'Unknown'}
                </p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center py-8 text-gray-400 text-sm">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>
      )}

      {/* My Listings Tab */}
      {tab === 'my' && (
        <div className="space-y-3">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="card skeleton h-24" />)
          ) : myListings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No listings yet</p>
              <p className="text-xs text-gray-400 mt-1">
                <button onClick={() => setTab('post')} className="text-teal-500 hover:underline">Post a listing</button> to get started.
              </p>
            </div>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getTypeInfo(listing.type).color)}>
                      {getTypeInfo(listing.type).icon} {getTypeInfo(listing.type).label}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                      listing.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {listing.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-harbor-800 dark:text-white">{listing.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                  </p>
                </div>

                {editingPrice === listing.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editPriceValue}
                      onChange={(e) => setEditPriceValue(e.target.value)}
                      className="input-field !py-1.5 text-sm flex-1"
                      placeholder="New price"
                    />
                    <button onClick={() => handleEditPrice(listing.id)} className="btn-teal text-xs">Save</button>
                    <button onClick={() => setEditingPrice(null)} className="text-xs text-gray-500">Cancel</button>
                  </div>
                ) : (
                  <p className="text-base font-bold text-harbor-800 dark:text-white">${listing.price_monthly}/mo</p>
                )}

                {listing.status === 'active' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => { setEditingPrice(listing.id); setEditPriceValue(listing.price_monthly.toString()); }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Edit Price
                    </button>
                    <button
                      onClick={() => handleMarkFilled(listing.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark Filled
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
