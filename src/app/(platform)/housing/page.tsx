'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type HousingTab = 'browse' | 'post' | 'reviews';

interface Listing { id: string; user_id: string; type: string; title: string; description: string; price_monthly: number | null; bedrooms: number | null; bathrooms: number | null; address: string | null; neighborhood: string | null; available_date: string | null; anonymous: boolean; status: string; created_at: string; profiles?: { display_name: string }; }
interface Review { id: string; property_address: string; rating: number; review: string; anonymous: boolean; created_at: string; }

const types = ['All', 'rent', 'roommate', 'sublet', 'room'];
const typeLabels: Record<string, string> = { rent: '🏠 Full Rental', roommate: '🤝 Roommate', sublet: '📦 Sublet', room: '🛏️ Room' };

export default function HousingPage() {
  const [tab, setTab] = useState<HousingTab>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [pType, setPType] = useState('rent');
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pBed, setPBed] = useState('');
  const [pBath, setPBath] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pNeighborhood, setPNeighborhood] = useState('');
  const [pAvail, setPAvail] = useState('');
  const [pAnon, setPAnon] = useState(false);
  const [posting, setPosting] = useState(false);

  const [rAddress, setRAddress] = useState('');
  const [rRating, setRRating] = useState(5);
  const [rText, setRText] = useState('');
  const [rAnon, setRAnon] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('housing_listings').select('*, profiles!housing_listings_user_id_fkey(display_name)').eq('status', 'active').order('created_at', { ascending: false });
      if (data) setListings(data);
      const { data: rv } = await supabase.from('landlord_reviews').select('*').order('created_at', { ascending: false }).limit(30);
      if (rv) setReviews(rv);
      setLoading(false);
    };
    load();
  }, [supabase, posting, reviewing]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPosting(true);
    await supabase.from('housing_listings').insert({ user_id: user.id, type: pType, title: pTitle.trim(), description: pDesc.trim(), price_monthly: pPrice ? parseFloat(pPrice) : null, bedrooms: pBed ? parseInt(pBed) : null, bathrooms: pBath ? parseFloat(pBath) : null, address: pAddress.trim() || null, neighborhood: pNeighborhood.trim() || null, available_date: pAvail || null, anonymous: pAnon });
    setPTitle(''); setPDesc(''); setPPrice(''); setPBed(''); setPBath(''); setPAddress(''); setPNeighborhood('');
    setPosting(false); setTab('browse');
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReviewing(true);
    await supabase.from('landlord_reviews').insert({ reviewer_id: user.id, property_address: rAddress.trim(), rating: rRating, review: rText.trim(), anonymous: rAnon });
    setRAddress(''); setRText(''); setRRating(5);
    setReviewing(false);
  };

  const filtered = typeFilter === 'All' ? listings : listings.filter(l => l.type === typeFilter);

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Housing Board</h1>
        <p className="text-xs text-gray-500">Rentals, roommates, sublets. No broker fees. Honest landlord reviews.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([{ key: 'browse', label: 'Browse' }, { key: 'post', label: '+ Post' }, { key: 'reviews', label: '⭐ Reviews' }] as { key: HousingTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', tab === t.key ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap', typeFilter === t ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
                {t === 'All' ? 'All' : typeLabels[t] || t}
              </button>
            ))}
          </div>
          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-24" />) :
          filtered.length === 0 ? <div className="text-center py-12"><p className="text-4xl mb-2">🏠</p><p className="text-gray-500">No listings. Post yours — free forever.</p></div> :
          filtered.map(l => (
            <div key={l.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-harbor-100 dark:bg-harbor-800 text-harbor-700 dark:text-harbor-300 px-2 py-0.5 rounded-full capitalize">{typeLabels[l.type] || l.type}</span>
                    {l.neighborhood && <span className="text-xs text-gray-400">{l.neighborhood}</span>}
                  </div>
                  <h3 className="text-sm font-bold text-harbor-800 dark:text-white mt-1">{l.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{l.description}</p>
                </div>
                {l.price_monthly && <span className="text-sm font-bold text-mly-600 flex-shrink-0 ml-2">${l.price_monthly}/mo</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                {l.bedrooms && <span>🛏️ {l.bedrooms}bd</span>}
                {l.bathrooms && <span>🚿 {l.bathrooms}ba</span>}
                {l.available_date && <span>📅 {new Date(l.available_date).toLocaleDateString()}</span>}
                <span>{l.anonymous ? 'Anonymous' : (l.profiles as any)?.display_name}</span>
              </div>
              {l.address && <p className="text-xs text-gray-400">📍 {l.address}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'post' && (
        <form onSubmit={handlePost} className="card space-y-3">
          <h2 className="font-medium text-harbor-800 dark:text-white">Post Housing</h2>
          <select value={pType} onChange={e => setPType(e.target.value)} className="input-field !py-2 text-sm">
            <option value="rent">Full Rental</option><option value="roommate">Roommate Wanted</option><option value="sublet">Sublet</option><option value="room">Single Room</option>
          </select>
          <input type="text" value={pTitle} onChange={e => setPTitle(e.target.value)} className="input-field !py-2 text-sm" placeholder="Title (e.g., 2BR apartment near MLK Blvd)" required />
          <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-20" placeholder="Describe the space, requirements, what's included..." required />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} className="input-field !py-2 text-sm" placeholder="$/month" min="0" />
            <input type="number" value={pBed} onChange={e => setPBed(e.target.value)} className="input-field !py-2 text-sm" placeholder="Beds" min="0" />
            <input type="number" value={pBath} onChange={e => setPBath(e.target.value)} className="input-field !py-2 text-sm" placeholder="Baths" min="0" step="0.5" />
          </div>
          <input type="text" value={pAddress} onChange={e => setPAddress(e.target.value)} className="input-field !py-2 text-sm" placeholder="Address (optional)" />
          <input type="text" value={pNeighborhood} onChange={e => setPNeighborhood(e.target.value)} className="input-field !py-2 text-sm" placeholder="Neighborhood" />
          <input type="date" value={pAvail} onChange={e => setPAvail(e.target.value)} className="input-field !py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={pAnon} onChange={e => setPAnon(e.target.checked)} className="rounded accent-teal-500" />
            Post anonymously
          </label>
          <button type="submit" disabled={posting} className="btn-teal w-full disabled:opacity-50">{posting ? 'Posting...' : 'Post Listing'}</button>
        </form>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          <form onSubmit={handleReview} className="card space-y-3 border-2 border-dashed border-gray-200 dark:border-harbor-700">
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Review a Landlord / Property</p>
            <p className="text-xs text-gray-500">Your review is for the community. Protect your neighbors.</p>
            <input type="text" value={rAddress} onChange={e => setRAddress(e.target.value)} className="input-field !py-2 text-sm" placeholder="Property address" required />
            <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setRRating(n)} className={cn('text-2xl', rRating >= n ? 'text-mly-500' : 'text-gray-300')}>★</button>)}</div>
            <textarea value={rText} onChange={e => setRText(e.target.value)} className="input-field !py-2 text-sm resize-none h-16" placeholder="What should neighbors know?" required />
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={rAnon} onChange={e => setRAnon(e.target.checked)} className="rounded accent-teal-500" />
              Post anonymously
            </label>
            <button type="submit" disabled={reviewing} className="btn-primary w-full text-sm disabled:opacity-50">{reviewing ? '...' : 'Submit Review'}</button>
          </form>
          {reviews.length === 0 ? <p className="text-center py-6 text-gray-400">No reviews yet. Be the first to protect a neighbor.</p> :
          reviews.map(r => (
            <div key={r.id} className="card space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-harbor-800 dark:text-white">📍 {r.property_address}</p>
                <span className="text-sm">{Array.from({ length: r.rating }, (_, i) => '⭐').join('')}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">{r.review}</p>
              <p className="text-[10px] text-gray-400">{r.anonymous ? 'Anonymous' : 'Community Member'} · {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
