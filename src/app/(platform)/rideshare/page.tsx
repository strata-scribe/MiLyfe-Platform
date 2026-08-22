'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { format, formatDistanceToNow, isPast } from 'date-fns';

type RideTab = 'available' | 'offer' | 'request' | 'my';
type RideStatus = 'open' | 'matched' | 'completed' | 'cancelled';

interface Ride {
  id: string;
  user_id: string;
  type: 'offer' | 'request';
  origin: string;
  destination: string;
  departure_time: string;
  seats: number;
  price_mly: number;
  note: string | null;
  status: RideStatus;
  matched_with: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

const tabs: { key: RideTab; label: string; icon: string }[] = [
  { key: 'available', label: 'Available', icon: '🔍' },
  { key: 'offer', label: 'Offer', icon: '🚗' },
  { key: 'request', label: 'Request', icon: '🙋' },
  { key: 'my', label: 'My Rides', icon: '📋' },
];

function SeatDots({ total, filled }: { total: number; filled?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-3 h-3 rounded-full border-2 transition-colors',
            filled !== undefined && i < filled
              ? 'bg-teal-500 border-teal-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        />
      ))}
    </div>
  );
}

function SeatSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
        Seats Available
      </label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
              n <= value
                ? 'bg-teal-500 border-teal-500 text-white scale-110'
                : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-teal-300'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            'text-2xl transition-transform hover:scale-125',
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function RidesharePage() {
  const [tab, setTab] = useState<RideTab>('available');
  const [rides, setRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState('5');
  const [note, setNote] = useState('');
  const [posting, setPosting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Rating state
  const [ratingRideId, setRatingRideId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const { user } = useAppStore();
  const supabase = createClient();

  const fetchRides = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rideshare_offers')
      .select('*, profiles!rideshare_offers_user_id_fkey(display_name)')
      .eq('status', 'open')
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (data) setRides(data);

    if (user) {
      const { data: mine } = await supabase
        .from('rideshare_offers')
        .select('*, profiles!rideshare_offers_user_id_fkey(display_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (mine) setMyRides(mine);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides, refreshKey]);

  const handleGpsAutofill = async () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handlePost = async (type: 'offer' | 'request') => {
    if (!user || !origin.trim() || !destination.trim() || !departureTime) return;
    setPosting(true);

    const { error } = await supabase.from('rideshare_offers').insert({
      user_id: user.id,
      type,
      origin: origin.trim(),
      destination: destination.trim(),
      departure_time: new Date(departureTime).toISOString(),
      seats,
      price_mly: parseFloat(price) || 0,
      note: note.trim() || null,
      status: 'open',
    });

    if (!error) {
      setOrigin('');
      setDestination('');
      setDepartureTime('');
      setSeats(2);
      setPrice('5');
      setNote('');
      setRefreshKey((k) => k + 1);
      setTab('available');
    }
    setPosting(false);
  };

  const handleMatch = async (ride: Ride) => {
    if (!user) return;
    await supabase
      .from('rideshare_offers')
      .update({ status: 'matched', matched_with: user.id })
      .eq('id', ride.id);

    await supabase.from('notifications').insert({
      user_id: ride.user_id,
      type: 'system',
      title: 'Ride Matched!',
      body: `${user.display_name} wants to ${ride.type === 'offer' ? 'ride with you' : 'give you a ride'} (${ride.origin} → ${ride.destination}).`,
      link: '/rideshare',
    });

    setRides((prev) => prev.filter((r) => r.id !== ride.id));
  };

  const handleCancel = async (rideId: string) => {
    await supabase.from('rideshare_offers').update({ status: 'cancelled' }).eq('id', rideId);
    setRefreshKey((k) => k + 1);
  };

  const handleComplete = async (ride: Ride) => {
    await supabase.from('rideshare_offers').update({ status: 'completed' }).eq('id', ride.id);

    // Award MLY to driver
    if (ride.type === 'offer' && ride.user_id) {
      await supabase.from('mly_transactions').insert({
        user_id: ride.user_id,
        amount: ride.price_mly,
        type: 'ride_payment',
        description: `Ride: ${ride.origin} → ${ride.destination}`,
      });
    }

    setRatingRideId(ride.id);
    setRefreshKey((k) => k + 1);
  };

  const handleRate = async (rideId: string) => {
    if (!user || ratingValue === 0) return;
    await supabase.from('rideshare_ratings').insert({
      user_id: user.id,
      ride_id: rideId,
      rating: ratingValue,
    });
    setRatingRideId(null);
    setRatingValue(0);
  };

  // Filtered rides
  const filteredRides = rides.filter((r) => {
    if (r.user_id === user?.id) return false;
    if (!filter) return true;
    return r.destination.toLowerCase().includes(filter.toLowerCase());
  });

  const offers = filteredRides.filter((r) => r.type === 'offer');
  const requests = filteredRides.filter((r) => r.type === 'request');

  const formatDeparture = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEE, MMM d 'at' h:mm a");
    } catch {
      return dateStr;
    }
  };

  const RideCard = ({ ride }: { ride: Ride }) => (
    <div className="card space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide',
            ride.type === 'offer'
              ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          )}
        >
          {ride.type === 'offer' ? '🚗 Offering' : '🙋 Requesting'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(new Date(ride.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Route visualization */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          <div className="w-0.5 h-6 bg-gradient-to-b from-teal-500 to-amber-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-harbor-800 dark:text-white">{ride.origin}</p>
          <p className="text-sm font-semibold text-harbor-800 dark:text-white">{ride.destination}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">🕐</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formatDeparture(ride.departure_time)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SeatDots total={ride.seats} />
            <span className="text-xs text-gray-500">{ride.seats} seat{ride.seats > 1 ? 's' : ''}</span>
          </div>
          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
            ${ride.price_mly} MLY
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {ride.profiles?.display_name || 'Anonymous'}
        </span>
      </div>

      {ride.note && (
        <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
          &ldquo;{ride.note}&rdquo;
        </p>
      )}

      <button
        onClick={() => handleMatch(ride)}
        className="btn-teal w-full text-sm"
      >
        {ride.type === 'offer' ? '🚗 Ride Along' : '🙋 I Can Drive'}
      </button>
    </div>
  );

  const RideForm = ({ type }: { type: 'offer' | 'request' }) => (
    <div className="card space-y-4 animate-slide-up">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-harbor-800 dark:text-white">
          {type === 'offer' ? '🚗 Offer a Ride' : '🙋 Request a Ride'}
        </h2>
        <p className="text-xs text-gray-500">
          {type === 'offer'
            ? 'Share your ride and earn $MLY from passengers.'
            : 'Post where you need to go and someone will pick you up.'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="input-field pr-16"
            placeholder="Pickup location"
          />
          <button
            type="button"
            onClick={handleGpsAutofill}
            disabled={gpsLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-600 px-2 py-1 rounded-md hover:bg-teal-100 transition-colors"
          >
            {gpsLoading ? '...' : '📍 GPS'}
          </button>
        </div>

        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="input-field"
          placeholder="Destination"
        />

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Departure Date & Time
          </label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="input-field"
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          />
        </div>

        <SeatSelector value={seats} onChange={setSeats} />

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Price per seat ($MLY)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field"
            min="0"
            step="1"
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-field"
            placeholder="e.g. No smoking, trunk space available..."
          />
        </div>
      </div>

      <button
        onClick={() => handlePost(type)}
        disabled={posting || !origin.trim() || !destination.trim() || !departureTime}
        className="btn-teal w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {posting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Posting...
          </span>
        ) : (
          `Post ${type === 'offer' ? 'Ride Offer' : 'Ride Request'}`
        )}
      </button>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'matched': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'completed': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Rideshare</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Community rides. Pay with $MLY. No middleman.
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

      {/* Available Tab */}
      {tab === 'available' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="relative">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field pl-9"
              placeholder="Filter by destination..."
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card skeleton h-40" />
              ))}
            </div>
          ) : (
            <>
              {/* Rides Offered */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs">🚗</span>
                  Rides Offered
                  <span className="text-xs font-normal text-gray-400">({offers.length})</span>
                </h3>
                {offers.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-8">No rides offered right now.</p>
                ) : (
                  offers.map((ride) => <RideCard key={ride.id} ride={ride} />)
                )}
              </div>

              {/* Rides Requested */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs">🙋</span>
                  Rides Requested
                  <span className="text-xs font-normal text-gray-400">({requests.length})</span>
                </h3>
                {requests.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-8">No ride requests right now.</p>
                ) : (
                  requests.map((ride) => <RideCard key={ride.id} ride={ride} />)
                )}
              </div>

              {offers.length === 0 && requests.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">🚗</p>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No rides available</p>
                  <p className="text-xs text-gray-400 mt-1">Offer a ride or request one to get started.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Offer Tab */}
      {tab === 'offer' && <RideForm type="offer" />}

      {/* Request Tab */}
      {tab === 'request' && <RideForm type="request" />}

      {/* My Rides Tab */}
      {tab === 'my' && (
        <div className="space-y-3">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="card skeleton h-24" />)
          ) : myRides.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No rides yet</p>
              <p className="text-xs text-gray-400 mt-1">Your posted offers and requests will appear here.</p>
            </div>
          ) : (
            myRides.map((ride) => (
              <div key={ride.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ride.type === 'offer' ? '🚗' : '🙋'}</span>
                    <div>
                      <p className="text-sm font-semibold text-harbor-800 dark:text-white">
                        {ride.origin} → {ride.destination}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDeparture(ride.departure_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                      ${ride.price_mly}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', getStatusColor(ride.status))}>
                      {ride.status}
                    </span>
                  </div>
                </div>

                {/* Actions based on status */}
                {ride.status === 'open' && (
                  <button
                    onClick={() => handleCancel(ride.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Cancel Ride
                  </button>
                )}

                {ride.status === 'matched' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleComplete(ride)}
                      className="btn-teal text-xs flex-1"
                    >
                      ✓ Mark Complete
                    </button>
                  </div>
                )}

                {ride.status === 'completed' && ratingRideId === ride.id && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Rate this trip:</p>
                    <StarRating value={ratingValue} onChange={setRatingValue} />
                    <button
                      onClick={() => handleRate(ride.id)}
                      disabled={ratingValue === 0}
                      className="btn-gold text-xs disabled:opacity-50"
                    >
                      Submit Rating
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
