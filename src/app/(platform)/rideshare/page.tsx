'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type RideTab = 'browse' | 'offer' | 'request' | 'my';

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
  status: string;
  matched_with: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

export default function RidesharePage() {
  const [tab, setTab] = useState<RideTab>('browse');
  const [rides, setRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('2');
  const [price, setPrice] = useState('5');
  const [note, setNote] = useState('');
  const [posting, setPosting] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
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
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['open', 'matched'])
          .order('departure_time', { ascending: true });
        if (mine) setMyRides(mine);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase, posting]);

  const handlePost = async (type: 'offer' | 'request') => {
    if (!user || !origin.trim() || !destination.trim() || !time) return;
    setPosting(true);
    await supabase.from('rideshare_offers').insert({
      user_id: user.id, type, origin: origin.trim(), destination: destination.trim(),
      departure_time: new Date(time).toISOString(), seats: parseInt(seats),
      price_mly: parseFloat(price), note: note.trim() || null,
    });
    setOrigin(''); setDestination(''); setTime(''); setNote('');
    setPosting(false); setTab('browse');
  };

  const handleMatch = async (rideId: string) => {
    if (!user) return;
    await supabase.from('rideshare_offers').update({ status: 'matched', matched_with: user.id }).eq('id', rideId);
    setRides(prev => prev.filter(r => r.id !== rideId));
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      await supabase.from('notifications').insert({
        user_id: ride.user_id, type: 'system',
        title: 'Ride matched!',
        body: `${user.display_name} wants to ${ride.type === 'offer' ? 'ride with you' : 'give you a ride'}.`,
        link: '/connect',
      });
    }
  };

  const offers = rides.filter(r => r.type === 'offer' && r.user_id !== user?.id);
  const requests = rides.filter(r => r.type === 'request' && r.user_id !== user?.id);

  const RideForm = ({ type }: { type: 'offer' | 'request' }) => (
    <div className="card space-y-3">
      <h2 className="font-medium text-harbor-800 dark:text-white">{type === 'offer' ? 'Offer a Ride' : 'Request a Ride'}</h2>
      <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="input-field !py-2 text-sm" placeholder="From (pickup location)" required />
      <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="input-field !py-2 text-sm" placeholder="To (destination)" required />
      <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="input-field !py-2 text-sm" required />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Seats</label>
          <input type="number" value={seats} onChange={e => setSeats(e.target.value)} className="input-field !py-2 text-sm" min="1" max="6" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Price ($MLY)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-field !py-2 text-sm" min="0" />
        </div>
      </div>
      <input type="text" value={note} onChange={e => setNote(e.target.value)} className="input-field !py-2 text-sm" placeholder="Note (optional)" />
      <button onClick={() => handlePost(type)} disabled={posting || !origin || !destination || !time} className="btn-teal w-full disabled:opacity-50">
        {posting ? 'Posting...' : 'Post'}
      </button>
    </div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Rideshare</h1>
        <p className="text-xs text-gray-500">Community rides. Pay with $MLY. No middleman.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([{ key: 'browse', label: 'Available' }, { key: 'offer', label: '🚗 Offer' }, { key: 'request', label: '🙋 Request' }, { key: 'my', label: 'My Rides' }] as { key: RideTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="space-y-3">
          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-20" />) :
          [...offers, ...requests].length === 0 ? (
            <div className="text-center py-12"><p className="text-4xl mb-2">🚗</p><p className="text-gray-500">No rides posted. Offer or request one!</p></div>
          ) : [...offers, ...requests].map(ride => (
            <div key={ride.id} className="card space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', ride.type === 'offer' ? 'bg-teal-100 text-teal-700' : 'bg-mly-100 text-mly-700')}>
                  {ride.type === 'offer' ? '🚗 OFFERING' : '🙋 REQUESTING'}
                </span>
                <span className="text-xs text-gray-400">{new Date(ride.departure_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-harbor-800 dark:text-white"><strong>{ride.origin}</strong> → <strong>{ride.destination}</strong></p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>🪑 {ride.seats} seat{ride.seats > 1 ? 's' : ''}</span>
                  <span className="font-bold text-mly-600">${ride.price_mly} MLY</span>
                  <span>{(ride.profiles as any)?.display_name}</span>
                </div>
                <button onClick={() => handleMatch(ride.id)} className="btn-teal text-xs !py-1.5 !px-3">
                  {ride.type === 'offer' ? 'Ride Along' : 'I Can Drive'}
                </button>
              </div>
              {ride.note && <p className="text-xs text-gray-400">{ride.note}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'offer' && <RideForm type="offer" />}
      {tab === 'request' && <RideForm type="request" />}

      {tab === 'my' && (
        <div className="space-y-3">
          {myRides.length === 0 ? <p className="text-center py-8 text-gray-400">No active rides.</p> : myRides.map(ride => (
            <div key={ride.id} className="card flex items-center gap-3">
              <span className="text-xl">{ride.type === 'offer' ? '🚗' : '🙋'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{ride.origin} → {ride.destination}</p>
                <p className="text-xs text-gray-500">{new Date(ride.departure_time).toLocaleDateString()} · {ride.status}</p>
              </div>
              <span className="text-xs font-bold text-mly-600">${ride.price_mly}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
