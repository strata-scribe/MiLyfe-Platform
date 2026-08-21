'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type ExFilter = 'all' | 'buy' | 'sell';

interface Offer {
  id: string;
  user_id: string;
  type: 'buy' | 'sell';
  amount_mly: number;
  price_description: string;
  status: string;
  matched_with: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

export default function ExchangePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [filter, setFilter] = useState<ExFilter>('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create offer form
  const [oType, setOType] = useState<'buy' | 'sell'>('sell');
  const [oAmount, setOAmount] = useState('');
  const [oPrice, setOPrice] = useState('');
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('exchange_offers')
        .select('*, profiles!exchange_offers_user_id_fkey(display_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (data) setOffers(data);

      if (user) {
        const { data: mine } = await supabase
          .from('exchange_offers')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['open', 'matched'])
          .order('created_at', { ascending: false });
        if (mine) setMyOffers(mine);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase, creating]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    await supabase.from('exchange_offers').insert({
      user_id: user.id,
      type: oType,
      amount_mly: parseFloat(oAmount),
      price_description: oPrice.trim(),
    });

    setOAmount(''); setOPrice(''); setShowCreate(false); setCreating(false);
  };

  const handleMatch = async (offerId: string) => {
    if (!user) return;
    await supabase.from('exchange_offers').update({ status: 'matched', matched_with: user.id }).eq('id', offerId);
    setOffers(prev => prev.filter(o => o.id !== offerId));
    // Create notification for offer owner
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      await supabase.from('notifications').insert({
        user_id: offer.user_id,
        type: 'system',
        title: 'Exchange matched!',
        body: `${user.display_name} wants to ${offer.type === 'sell' ? 'buy' : 'sell'} ${offer.amount_mly} MLY. Connect in MiConnect to complete.`,
        link: '/connect',
      });
    }
  };

  const handleCancel = async (offerId: string) => {
    await supabase.from('exchange_offers').update({ status: 'cancelled' }).eq('id', offerId);
    setMyOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const filtered = filter === 'all' ? offers : offers.filter(o => o.type === filter);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/wallet')} className="text-teal-500 text-sm">← Wallet</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Exchange Board</h1>
      </div>

      <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          <strong>Peer-to-peer.</strong> Post what you have, what you want. Match with someone. Complete the exchange however you both agree — cash, goods, services. No middleman. No permission needed. 1 MLY = $1.
        </p>
      </div>

      {/* Create Offer */}
      <button onClick={() => setShowCreate(!showCreate)} className="btn-teal w-full text-sm">
        + Post an Offer
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOType('sell')} className={cn('py-3 rounded-xl text-sm font-medium border-2 transition-all', oType === 'sell' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-gray-200 dark:border-harbor-700')}>
              I&apos;m Selling MLY
            </button>
            <button type="button" onClick={() => setOType('buy')} className={cn('py-3 rounded-xl text-sm font-medium border-2 transition-all', oType === 'buy' ? 'border-mly-500 bg-mly-50 dark:bg-mly-900/20 text-mly-600' : 'border-gray-200 dark:border-harbor-700')}>
              I&apos;m Buying MLY
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount (MLY)</label>
            <input type="number" value={oAmount} onChange={e => setOAmount(e.target.value)} className="input-field !py-2 text-sm" placeholder="100" min="1" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">What do you want in exchange?</label>
            <input type="text" value={oPrice} onChange={e => setOPrice(e.target.value)} className="input-field !py-2 text-sm" placeholder="e.g., $100 cash, yard work, guitar lessons" required />
          </div>
          <button type="submit" disabled={creating} className="btn-gold w-full disabled:opacity-50">
            {creating ? 'Posting...' : 'Post Offer'}
          </button>
        </form>
      )}

      {/* My Active Offers */}
      {myOffers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-gray-400">Your Active Offers</h2>
          {myOffers.map(o => (
            <div key={o.id} className="card flex items-center gap-3 !py-3">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', o.type === 'sell' ? 'bg-teal-100 text-teal-700' : 'bg-mly-100 text-mly-700')}>
                {o.type === 'sell' ? 'SELLING' : 'BUYING'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">${o.amount_mly} MLY</p>
                <p className="text-xs text-gray-500 truncate">For: {o.price_description}</p>
              </div>
              <button onClick={() => handleCancel(o.id)} className="text-xs text-red-400">Cancel</button>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'buy', 'sell'] as ExFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 rounded-full text-xs font-medium capitalize transition-all', filter === f ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {f === 'all' ? 'All Offers' : f === 'buy' ? '🟢 Buying' : '🔵 Selling'}
          </button>
        ))}
      </div>

      {/* Offers List */}
      <div className="space-y-3">
        {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-20" />) :
        filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">💱</p>
            <p className="text-gray-500">No open offers.</p>
            <p className="text-xs text-gray-400 mt-1">Be the first — post what you have or want.</p>
          </div>
        ) : filtered.filter(o => o.user_id !== user?.id).map(offer => (
          <div key={offer.id} className="card space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', offer.type === 'sell' ? 'bg-teal-100 text-teal-700' : 'bg-mly-100 text-mly-700')}>
                {offer.type === 'sell' ? 'SELLING' : 'BUYING'}
              </span>
              <span className="text-sm font-bold text-harbor-800 dark:text-white">${offer.amount_mly} MLY</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Wants:</strong> {offer.price_description}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                {(offer.profiles as any)?.display_name ?? 'Someone'} · {new Date(offer.created_at).toLocaleDateString()}
              </p>
              <button onClick={() => handleMatch(offer.id)} className="btn-teal text-xs !py-1.5 !px-3">
                I&apos;m Interested
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
