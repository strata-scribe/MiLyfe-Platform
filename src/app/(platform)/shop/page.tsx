'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type ShopTab = 'browse' | 'sell' | 'orders';

interface Listing {
  id: string;
  title: string;
  description: string;
  price_mly: number;
  category: string;
  image_url: string | null;
  seller_id: string;
  available: boolean;
  created_at: string;
  profiles?: { display_name: string };
}

interface Order {
  id: string;
  amount_mly: number;
  status: string;
  created_at: string;
  shop_listings?: { title: string };
}

const categories = ['All', 'Services', 'Food', 'Goods', 'Education', 'Other'];

const categoryEmoji: Record<string, string> = {
  Services: '🔧',
  Food: '🍽️',
  Goods: '📦',
  Education: '📚',
  Other: '🎁',
};

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<ShopTab>('browse');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Sell form state
  const [sellTitle, setSellTitle] = useState('');
  const [sellDesc, setSellDesc] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellCategory, setSellCategory] = useState('Services');
  const [sellImage, setSellImage] = useState<File | null>(null);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);
  const [sellError, setSellError] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();

  // Load listings
  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from('shop_listings')
        .select('*, profiles!shop_listings_seller_id_fkey(display_name)')
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (data) setListings(data);
      setLoadingListings(false);
    };

    fetchListings();
  }, [supabase, sellSuccess]);

  // Load orders
  useEffect(() => {
    if (!user || activeTab !== 'orders') return;

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('shop_orders')
        .select('*, shop_listings!shop_orders_listing_id_fkey(title)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setOrders(data);
    };

    fetchOrders();
  }, [user, activeTab, supabase]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSellLoading(true);
    setSellError('');

    let imageUrl: string | null = null;

    // Upload image if provided
    if (sellImage) {
      const fileExt = sellImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop')
        .upload(fileName, sellImage);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('shop')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('shop_listings').insert({
      seller_id: user.id,
      title: sellTitle.trim(),
      description: sellDesc.trim(),
      price_mly: parseFloat(sellPrice),
      category: sellCategory,
      image_url: imageUrl,
    });

    if (insertError) {
      setSellError(insertError.message);
    } else {
      setSellSuccess(true);
      setSellTitle('');
      setSellDesc('');
      setSellPrice('');
      setSellImage(null);

      // Reset after showing success
      setTimeout(() => setSellSuccess(false), 3000);
    }

    setSellLoading(false);
  };

  const handleBuy = async (listing: Listing) => {
    if (!user) return;
    if (user.id === listing.seller_id) return;

    const { error } = await supabase.from('shop_orders').insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount_mly: listing.price_mly,
    });

    if (!error) {
      // Deduct from buyer
      await supabase.from('mly_transactions').insert({
        from_id: user.id,
        to_id: listing.seller_id,
        amount: listing.price_mly,
        type: 'spend',
        description: `Purchased: ${listing.title}`,
      });

      alert(`Order placed! ${listing.price_mly} MLY will transfer when the seller confirms.`);
    }
  };

  const filtered = selectedCategory === 'All'
    ? listings
    : listings.filter((l) => l.category === selectedCategory);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiShop</h1>
        <div className="flex items-center gap-1 bg-mly-50 dark:bg-mly-900/20 px-3 py-1.5 rounded-full">
          <span className="text-sm font-bold text-mly-700">{user?.mly_balance ?? 0} MLY</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {(['browse', 'sell', 'orders'] as ShopTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === cat
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Listings Grid */}
          {loadingListings ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-16 mb-2" />
                  <div className="skeleton h-4 w-3/4 mb-1" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🛍️</p>
              <p className="text-gray-500">No listings yet. Be the first to sell!</p>
              <button onClick={() => setActiveTab('sell')} className="btn-teal mt-4 text-sm">
                List something
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((item) => (
                <div key={item.id} className="card hover:scale-105 transition-transform">
                  <div className="text-4xl text-center mb-2">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-20 object-cover rounded-lg" />
                    ) : (
                      categoryEmoji[item.category] || '🎁'
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.profiles?.display_name ?? 'Seller'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-mly-600">{item.price_mly} MLY</span>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={user?.id === item.seller_id}
                      className="text-xs bg-teal-500 text-white px-2 py-1 rounded-lg disabled:opacity-50"
                    >
                      {user?.id === item.seller_id ? 'Yours' : 'Buy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'sell' && (
        <form onSubmit={handleCreateListing} className="card space-y-4">
          <h2 className="font-medium text-harbor-800 dark:text-white">List something to sell</h2>

          {sellSuccess && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 text-sm">
              ✓ Listed successfully! Your item is now visible to the community.
            </div>
          )}
          {sellError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              {sellError}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">What are you offering?</label>
            <input
              type="text"
              value={sellTitle}
              onChange={(e) => setSellTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Fresh baked cookies"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Description</label>
            <textarea
              value={sellDesc}
              onChange={(e) => setSellDesc(e.target.value)}
              className="input-field resize-none h-20"
              placeholder="Tell buyers what they get..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Category</label>
            <select
              value={sellCategory}
              onChange={(e) => setSellCategory(e.target.value)}
              className="input-field"
            >
              {categories.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Price (in $MLY)</label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="input-field"
              placeholder="15"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSellImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-600 hover:file:bg-teal-100"
            />
          </div>

          <button
            type="submit"
            disabled={sellLoading || !sellTitle.trim() || !sellPrice}
            className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sellLoading ? 'Listing...' : 'List for Sale'}
          </button>
        </form>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-gray-500">No orders yet. Browse the shop!</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">
                    {order.shop_listings?.title ?? 'Item'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} · {order.status}
                  </p>
                </div>
                <span className="text-sm font-bold text-mly-600">-{order.amount_mly} MLY</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
