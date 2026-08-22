'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Listing { id: string; seller_id: string; type: string; title: string; description: string; price: number; price_type: string; category: string; images: string[]; location: string | null; status: string; views: number; created_at: string; profiles?: { display_name: string }; }
interface ServiceRequest { id: string; requester_id: string; category: string; description: string; budget: number | null; urgency: string; status: string; created_at: string; }

type MarketTab = 'browse' | 'services' | 'post' | 'requests';
const LISTING_TYPES = ['product', 'service', 'classified', 'gig'] as const;
const CATEGORIES = ['all', 'food', 'services', 'goods', 'tech', 'home', 'auto', 'education', 'creative', 'other'] as const;

export default function MarketPage() {
  const [tab, setTab] = useState<MarketTab>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [listingType, setListingType] = useState<string>('all');

  // Post form
  const [pType, setPType] = useState<typeof LISTING_TYPES[number]>('product');
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pPriceType, setPPriceType] = useState('fixed');
  const [pCategory, setPCategory] = useState('other');
  const [pLocation, setPLocation] = useState('');
  const [posting, setPosting] = useState(false);

  // Service request form
  const [srDesc, setSrDesc] = useState('');
  const [srBudget, setSrBudget] = useState('');
  const [srUrgency, setSrUrgency] = useState('scheduled');
  const [srCategory, setSrCategory] = useState('services');
  const [requesting, setRequesting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, [category, listingType]);

  async function loadData() {
    const supabase = createClient();
    let query = supabase.from('marketplace_listings').select('*, profiles!marketplace_listings_seller_id_fkey(display_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(30);
    if (category !== 'all') query = query.eq('category', category);
    if (listingType !== 'all') query = query.eq('type', listingType);
    const { data: l } = await query;
    if (l) setListings(l as any);

    const { data: r } = await supabase.from('service_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20);
    if (r) setRequests(r);
    setLoading(false);
  }

  async function handlePost() {
    if (!user || !pTitle.trim()) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('marketplace_listings').insert({ seller_id: user.id, type: pType, title: pTitle.trim(), description: pDesc.trim(), price: parseFloat(pPrice) || 0, price_type: pPriceType, category: pCategory, location: pLocation.trim() || null });
    setPTitle(''); setPDesc(''); setPPrice(''); setPLocation(''); setPosting(false); setTab('browse'); loadData();
  }

  async function handleRequest() {
    if (!user || !srDesc.trim()) return;
    setRequesting(true);
    const supabase = createClient();
    await supabase.from('service_requests').insert({ requester_id: user.id, category: srCategory, description: srDesc.trim(), budget: parseFloat(srBudget) || null, urgency: srUrgency });
    setSrDesc(''); setSrBudget(''); setRequesting(false); loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiMarket</h1>
          <p className="text-xs text-gray-500">Buy, sell, hire, and trade with $MLY</p>
        </div>
        {user && <button onClick={() => setTab(tab === 'post' ? 'browse' : 'post')} className="btn-teal text-xs">{tab === 'post' ? 'Browse' : '+ List'}</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['browse', 'services', 'requests', 'post'] as MarketTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Browse */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap', category === c ? 'bg-harbor-800 text-white' : 'bg-gray-100 text-gray-600')}>{c}</button>)}
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {['all', ...LISTING_TYPES].map(t => <button key={t} onClick={() => setListingType(t)} className={cn('px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap', listingType === t ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600')}>{t}</button>)}
          </div>
          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-24" />) :
          listings.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No listings found. Post something!</p></div> :
          listings.map(l => (
            <div key={l.id} className="card flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-2xl flex-shrink-0">
                {l.type === 'product' ? '📦' : l.type === 'service' ? '🔧' : l.type === 'gig' ? '💼' : '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded capitalize">{l.type}</span>
                  <span className="text-xs text-gray-400">{(l.profiles as any)?.display_name}</span>
                </div>
                <h3 className="text-sm font-medium text-harbor-800 dark:text-white mt-0.5">{l.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{l.description}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-mly-600">{l.price > 0 ? `$${l.price} MLY` : 'Free'}{l.price_type === 'hourly' ? '/hr' : ''}</span>
                  {l.location && <span className="text-xs text-gray-400">📍 {l.location}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Services (on-demand) */}
      {tab === 'services' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800">
            <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400">🔧 On-Demand Services</h3>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1">Need something done? Post a request and get matched with a provider.</p>
          </div>
          {listings.filter(l => l.type === 'service').length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">No service providers yet.</p></div> :
          listings.filter(l => l.type === 'service').map(l => (
            <div key={l.id} className="card flex items-center gap-3">
              <span className="text-2xl">🔧</span>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{l.title}</h3>
                <p className="text-xs text-gray-500">{l.description?.slice(0, 60)}</p>
              </div>
              <span className="text-sm font-bold text-mly-600">${l.price}{l.price_type === 'hourly' ? '/hr' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {user && (
            <div className="card space-y-3 border-2 border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">🙋 Request a Service</h3>
              <textarea value={srDesc} onChange={e => setSrDesc(e.target.value)} placeholder="What do you need done?" className="input-field resize-none" rows={2} />
              <div className="grid grid-cols-3 gap-2">
                <select value={srCategory} onChange={e => setSrCategory(e.target.value)} className="input-field text-xs">{['services','cleaning','repair','delivery','tutoring','tech','other'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input value={srBudget} onChange={e => setSrBudget(e.target.value)} placeholder="Budget $MLY" type="number" className="input-field text-xs" />
                <select value={srUrgency} onChange={e => setSrUrgency(e.target.value)} className="input-field text-xs"><option value="asap">ASAP</option><option value="today">Today</option><option value="scheduled">Scheduled</option></select>
              </div>
              <button onClick={handleRequest} disabled={!srDesc.trim() || requesting} className="btn-teal w-full text-xs disabled:opacity-50">{requesting ? 'Posting...' : 'Post Request'}</button>
            </div>
          )}
          {requests.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', r.urgency === 'asap' ? 'bg-red-100 text-red-600' : r.urgency === 'today' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600')}>{r.urgency}</span>
                <span className="text-xs text-gray-400 capitalize">{r.category}</span>
              </div>
              <p className="text-sm text-harbor-800 dark:text-white">{r.description}</p>
              {r.budget && <p className="text-xs text-mly-600 mt-1">Budget: ${r.budget} MLY</p>}
              {user && user.id !== r.requester_id && <button className="mt-2 text-xs text-teal-600 font-medium">🙋 I Can Help</button>}
            </div>
          ))}
        </div>
      )}

      {/* Post listing */}
      {tab === 'post' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Post a Listing</h3>
          <div className="flex gap-2">{LISTING_TYPES.map(t => <button key={t} onClick={() => setPType(t)} className={cn('px-3 py-1.5 rounded-full text-xs capitalize', pType === t ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600')}>{t}</button>)}</div>
          <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Title" className="input-field" />
          <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Description" className="input-field resize-none" rows={3} />
          <div className="grid grid-cols-3 gap-2">
            <input value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="Price $MLY" type="number" className="input-field" />
            <select value={pPriceType} onChange={e => setPPriceType(e.target.value)} className="input-field"><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="negotiable">Negotiable</option><option value="free">Free</option></select>
            <select value={pCategory} onChange={e => setPCategory(e.target.value)} className="input-field">{CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <input value={pLocation} onChange={e => setPLocation(e.target.value)} placeholder="Location (optional)" className="input-field" />
          <button onClick={handlePost} disabled={!pTitle.trim() || posting} className="btn-teal w-full disabled:opacity-50">{posting ? 'Posting...' : 'Publish Listing'}</button>
        </div>
      )}
    </div>
  );
}
