'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type BizView = 'directory' | 'register' | 'my';

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  category: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  accepts_mly: boolean;
  verified: boolean;
  logo_url: string | null;
  rating_avg: number;
  rating_count: number;
  mly_received: number;
  created_at: string;
  profiles?: { display_name: string };
}

const categories = ['Restaurant', 'Barbershop/Salon', 'Retail', 'Services', 'Health', 'Auto', 'Tech', 'Food Vendor', 'Childcare', 'Home Repair', 'Education', 'Other'];

export default function BusinessPage() {
  const [view, setView] = useState<BizView>('directory');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [myBiz, setMyBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showPOS, setShowPOS] = useState(false);

  // Register form
  const [rName, setRName] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rCategory, setRCategory] = useState('Other');
  const [rAddress, setRAddress] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rWebsite, setRWebsite] = useState('');
  const [registering, setRegistering] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('*, profiles!businesses_owner_id_fkey(display_name)')
        .order('rating_avg', { ascending: false });
      if (data) setBusinesses(data);

      if (user) {
        const { data: mine } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (mine) setMyBiz(mine);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase, registering]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRegistering(true);

    await supabase.from('businesses').insert({
      owner_id: user.id,
      name: rName.trim(),
      description: rDesc.trim(),
      category: rCategory,
      address: rAddress.trim() || null,
      phone: rPhone.trim() || null,
      website: rWebsite.trim() || null,
    });

    // Update user role to business
    await supabase.from('profiles').update({ role: 'business' }).eq('id', user.id);

    setRegistering(false);
    setView('my');
  };

  const filtered = businesses.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || b.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Business Hub</h1>
          <p className="text-xs text-gray-500">Local businesses accepting $MLY</p>
        </div>
        {!myBiz && (
          <button onClick={() => setView('register')} className="btn-teal text-xs !py-2 !px-3">+ Register</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {([
          { key: 'directory', label: 'Directory' },
          { key: 'my', label: myBiz ? 'My Business' : 'Register' },
        ] as { key: BizView; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setView(t.key === 'my' && !myBiz ? 'register' : t.key)} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', view === t.key || (t.key === 'my' && view === 'register') ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Directory */}
      {view === 'directory' && (
        <div className="space-y-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field !py-2.5 text-sm" placeholder="Search businesses..." />

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {['All', ...categories.slice(0, 8)].map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all', catFilter === cat ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-24" />) :
          filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🏪</p>
              <p className="text-gray-500">No businesses found.</p>
              <button onClick={() => setView('register')} className="btn-teal mt-3 text-sm">Register yours</button>
            </div>
          ) : filtered.map(biz => (
            <div key={biz.id} className="card space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xl flex-shrink-0">
                  {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover rounded-xl" /> : '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white truncate">{biz.name}</h3>
                    {biz.verified && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
                    {biz.accepts_mly && <span className="text-[10px] bg-mly-100 text-mly-700 px-1.5 py-0.5 rounded-full">$MLY</span>}
                  </div>
                  <p className="text-xs text-gray-500">{biz.category}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5">{biz.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {biz.address && <span>📍 {biz.address}</span>}
                {biz.phone && <a href={`tel:${biz.phone}`} className="text-teal-500">📞 {biz.phone}</a>}
                {biz.rating_count > 0 && <span>⭐ {biz.rating_avg.toFixed(1)} ({biz.rating_count})</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register */}
      {view === 'register' && !myBiz && (
        <form onSubmit={handleRegister} className="card space-y-3">
          <h2 className="font-medium text-harbor-800 dark:text-white">Register Your Business</h2>
          <p className="text-xs text-gray-500">Free. Start accepting $MLY immediately. No fees ever.</p>

          <input type="text" value={rName} onChange={e => setRName(e.target.value)} className="input-field !py-2 text-sm" placeholder="Business name" required />
          <textarea value={rDesc} onChange={e => setRDesc(e.target.value)} className="input-field !py-2 text-sm resize-none h-16" placeholder="What do you offer?" required />
          <select value={rCategory} onChange={e => setRCategory(e.target.value)} className="input-field !py-2 text-sm">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={rAddress} onChange={e => setRAddress(e.target.value)} className="input-field !py-2 text-sm" placeholder="Address (optional)" />
          <input type="tel" value={rPhone} onChange={e => setRPhone(e.target.value)} className="input-field !py-2 text-sm" placeholder="Phone (optional)" />
          <input type="url" value={rWebsite} onChange={e => setRWebsite(e.target.value)} className="input-field !py-2 text-sm" placeholder="Website (optional)" />

          <button type="submit" disabled={registering} className="btn-gold w-full disabled:opacity-50">
            {registering ? 'Registering...' : 'Register Business (Free)'}
          </button>
        </form>
      )}

      {/* My Business */}
      {(view === 'my' || view === 'register') && myBiz && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-2xl">🏪</div>
              <div>
                <h2 className="text-base font-bold text-harbor-800 dark:text-white">{myBiz.name}</h2>
                <p className="text-xs text-gray-500">{myBiz.category} · {myBiz.accepts_mly ? 'Accepts $MLY' : 'Cash only'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-gray-100 dark:border-harbor-800">
              <div>
                <p className="text-lg font-bold text-mly-600">${myBiz.mly_received.toFixed(0)}</p>
                <p className="text-[10px] text-gray-500">MLY Received</p>
              </div>
              <div>
                <p className="text-lg font-bold text-teal-500">{myBiz.rating_avg.toFixed(1)}</p>
                <p className="text-[10px] text-gray-500">Rating</p>
              </div>
              <div>
                <p className="text-lg font-bold text-harbor-800 dark:text-white">{myBiz.rating_count}</p>
                <p className="text-[10px] text-gray-500">Reviews</p>
              </div>
            </div>
          </div>

          {/* POS QR Code */}
          <button onClick={() => setShowPOS(!showPOS)} className="btn-primary w-full text-sm">
            {showPOS ? 'Hide POS Code' : '💳 Show Payment QR Code (POS)'}
          </button>

          {showPOS && (
            <div className="card text-center space-y-3">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Customer scans to pay</p>
              <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                <QRCodeSVG
                  value={`milyfe:pay:${user?.id}:${myBiz.name}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-500">Display this at your register. Customers scan with their MiLyfe app to send $MLY.</p>
              <p className="text-[10px] text-gray-400">Print this page for a physical sign.</p>
            </div>
          )}

          {/* Signage */}
          <div className="card bg-mly-50 dark:bg-mly-900/20 border-mly-200 dark:border-mly-800 text-center py-6">
            <p className="text-2xl font-bold text-mly-600">We Accept $MLY</p>
            <p className="text-sm text-gray-600 mt-1">1 MLY = $1 USD</p>
            <p className="text-xs text-gray-400 mt-2">Print this as your window sign →</p>
          </div>
        </div>
      )}
    </div>
  );
}
