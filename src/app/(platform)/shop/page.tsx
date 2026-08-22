'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'browse' | 'categories' | 'sellers' | 'orders' | 'sell'
type OrderStatus = 'placed' | 'confirmed' | 'ready' | 'delivered' | 'rated'
type Condition = 'new' | 'like-new' | 'good' | 'fair'

interface Product {
  id: string
  title: string
  description: string
  price: number
  mly_price: number
  category: string
  condition: Condition
  seller_name: string
  seller_rating: number
  distance: string
  image_url: string
  created_at: string
}

interface Order {
  id: string
  product_title: string
  seller_name: string
  status: OrderStatus
  total: number
  placed_at: string
  delivery_method: string
}

interface Seller {
  id: string
  name: string
  rating: number
  items_count: number
  response_time: string
  verified: boolean
  avatar_url: string
}

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<Tab>('browse')
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [filterCategory, setFilterCategory] = useState('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAppStore()

  // Sell form state
  const [sellForm, setSellForm] = useState({
    title: '', description: '', price: '', mly_price: '', category: '', condition: 'good' as Condition, delivery: 'pickup', photos: [] as File[]
  })
  const [sellStep, setSellStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const shopCategories = [
    { key: 'food', label: 'Food', icon: '🍲', color: 'bg-orange-100 border-orange-300' },
    { key: 'handmade', label: 'Handmade', icon: '🎨', color: 'bg-purple-100 border-purple-300' },
    { key: 'services', label: 'Services', icon: '🔧', color: 'bg-blue-100 border-blue-300' },
    { key: 'digital', label: 'Digital', icon: '💻', color: 'bg-teal-100 border-teal-300' },
    { key: 'clothing', label: 'Clothing', icon: '👕', color: 'bg-pink-100 border-pink-300' },
    { key: 'home', label: 'Home', icon: '🏠', color: 'bg-amber-100 border-amber-300' },
    { key: 'electronics', label: 'Electronics', icon: '📱', color: 'bg-indigo-100 border-indigo-300' },
    { key: 'plants', label: 'Plants', icon: '🌿', color: 'bg-green-100 border-green-300' },
  ]

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const supabase = createClient()
    const [prodRes, ordRes, selRes] = await Promise.all([
      supabase.from('shop_products').select('*').order('created_at', { ascending: false }),
      supabase.from('shop_orders').select('*').eq('buyer_id', user?.id).order('placed_at', { ascending: false }),
      supabase.from('shop_sellers').select('*').order('rating', { ascending: false })
    ])
    if (prodRes.data) setProducts(prodRes.data)
    if (ordRes.data) setOrders(ordRes.data)
    if (selRes.data) setSellers(selRes.data)
    setLoading(false)
  }

  async function handleListItem(e: React.FormEvent) {
    const supabase = createClient()
    e.preventDefault()
    if (!sellForm.title || !sellForm.price || !sellForm.category) {
      toast.error('Please complete all required fields')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('shop_products').insert({
      title: sellForm.title,
      description: sellForm.description,
      price: parseFloat(sellForm.price),
      mly_price: sellForm.mly_price ? parseFloat(sellForm.mly_price) : null,
      category: sellForm.category,
      condition: sellForm.condition,
      delivery_method: sellForm.delivery,
      seller_id: user?.id
    })
    if (error) {
      toast.error('Failed to list item')
    } else {
      toast.success('Item listed successfully! Buyers can now find it.')
      setSellForm({ title: '', description: '', price: '', mly_price: '', category: '', condition: 'good', delivery: 'pickup', photos: [] })
      setSellStep(1)
      fetchData()
    }
    setSubmitting(false)
  }

  const filteredProducts = products.filter(p => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const orderStatusColors: Record<OrderStatus, string> = {
    'placed': 'bg-harbor-300 text-white',
    'confirmed': 'bg-mly-amber text-harbor-900',
    'ready': 'bg-teal-500 text-white',
    'delivered': 'bg-green-500 text-white',
    'rated': 'bg-purple-500 text-white'
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'browse', label: 'Browse', icon: '🛒' },
    { key: 'categories', label: 'Categories', icon: '📂' },
    { key: 'sellers', label: 'Sellers', icon: '👤' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'sell', label: 'Sell', icon: '💰' },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-slide-up">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-harbor-900">Community Shop</h1>
        <p className="text-harbor-500">Buy, sell, and trade within your community</p>
      </header>

      <nav className="flex gap-2 mb-6 overflow-x-auto border-b border-harbor-200 pb-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-md' : 'text-harbor-600 hover:bg-harbor-100')}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="input-field flex-1 min-w-[200px]" placeholder="🔍 Search products..." />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field">
              <option value="all">All Categories</option>
              {shopCategories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-harbor-100 flex items-center justify-center text-4xl">
                  {shopCategories.find(c => c.key === product.category)?.icon || '📦'}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-harbor-900 truncate">{product.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-teal-600">${product.price}</span>
                    {product.mly_price && <span className="text-sm text-mly-amber font-medium">{product.mly_price} $MLY</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-harbor-500">
                    <span>⭐ {product.seller_rating}</span>
                    <span>·</span>
                    <span>{product.seller_name}</span>
                    <span>·</span>
                    <span>{product.distance}</span>
                  </div>
                  <span className="inline-block text-xs px-2 py-0.5 rounded bg-harbor-100 text-harbor-600">{product.condition}</span>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="card p-8 text-center text-harbor-500">No products match your search.</div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shopCategories.map(cat => (
            <button key={cat.key} onClick={() => { setFilterCategory(cat.key); setActiveTab('browse') }}
              className={cn('card p-6 text-center hover:shadow-lg transition-all border-2', cat.color)}>
              <span className="text-4xl block mb-2">{cat.icon}</span>
              <span className="font-medium text-harbor-800">{cat.label}</span>
              <span className="text-xs text-harbor-500 block mt-1">
                {products.filter(p => p.category === cat.key).length} items
              </span>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'sellers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sellers.map(seller => (
            <div key={seller.id} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-700">
                {seller.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-harbor-900">{seller.name}</h3>
                  {seller.verified && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-harbor-500 mt-1">
                  <span>⭐ {seller.rating}</span>
                  <span>{seller.items_count} items</span>
                  <span>⚡ {seller.response_time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="card p-8 text-center text-harbor-500">No orders yet. Start shopping!</div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-harbor-900">{order.product_title}</h3>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', orderStatusColors[order.status])}>{order.status}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-harbor-500">
                <span>From: {order.seller_name}</span>
                <span>${order.total}</span>
                <span>{order.delivery_method}</span>
              </div>
              <div className="mt-3 flex gap-1">
                {(['placed', 'confirmed', 'ready', 'delivered', 'rated'] as OrderStatus[]).map((s, i) => (
                  <div key={s} className={cn('h-1.5 flex-1 rounded-full', ['placed', 'confirmed', 'ready', 'delivered', 'rated'].indexOf(order.status) >= i ? 'bg-teal-500' : 'bg-harbor-200')} />
                ))}
              </div>
              <p className="text-xs text-harbor-400 mt-2">Placed {new Date(order.placed_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sell' && (
        <form onSubmit={handleListItem} className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold text-harbor-900">List an Item</h2>
            <span className="text-sm text-harbor-400">Step {sellStep}/3</span>
          </div>
          {sellStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-harbor-700 mb-1">Photos</label>
                <input type="file" accept="image/*" multiple onChange={e => setSellForm(p => ({ ...p, photos: Array.from(e.target.files || []) }))}
                  className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-harbor-700 mb-1">Title *</label>
                <input type="text" value={sellForm.title} onChange={e => setSellForm(p => ({ ...p, title: e.target.value }))}
                  className="input-field w-full" placeholder="What are you selling?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-harbor-700 mb-1">Description</label>
                <textarea value={sellForm.description} onChange={e => setSellForm(p => ({ ...p, description: e.target.value }))}
                  className="input-field w-full h-24 resize-none" placeholder="Describe your item..." />
              </div>
              <button type="button" onClick={() => sellStep < 3 && setSellStep(2)} className="btn-teal w-full">Next →</button>
            </div>
          )}
          {sellStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-harbor-700 mb-1">Price (USD) *</label>
                  <input type="number" value={sellForm.price} onChange={e => setSellForm(p => ({ ...p, price: e.target.value }))}
                    className="input-field w-full" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-harbor-700 mb-1">$MLY Price</label>
                  <input type="number" value={sellForm.mly_price} onChange={e => setSellForm(p => ({ ...p, mly_price: e.target.value }))}
                    className="input-field w-full" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-harbor-700 mb-1">Category *</label>
                  <select value={sellForm.category} onChange={e => setSellForm(p => ({ ...p, category: e.target.value }))} className="input-field w-full">
                    <option value="">Select</option>
                    {shopCategories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-harbor-700 mb-1">Condition</label>
                  <select value={sellForm.condition} onChange={e => setSellForm(p => ({ ...p, condition: e.target.value as Condition }))} className="input-field w-full">
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSellStep(1)} className="flex-1 px-4 py-2 border border-harbor-300 rounded-lg text-harbor-700">← Back</button>
                <button type="button" onClick={() => setSellStep(3)} className="flex-1 btn-teal">Next →</button>
              </div>
            </div>
          )}
          {sellStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-harbor-700 mb-1">Delivery Method</label>
                <div className="flex gap-3">
                  {['pickup', 'delivery', 'both'].map(m => (
                    <button key={m} type="button" onClick={() => setSellForm(p => ({ ...p, delivery: m }))}
                      className={cn('px-4 py-2 rounded-lg border text-sm', sellForm.delivery === m ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-harbor-200 text-harbor-600')}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-harbor-50 rounded-lg">
                <h4 className="font-medium text-harbor-800 mb-2">Review your listing</h4>
                <p className="text-sm text-harbor-600">{sellForm.title || 'Untitled'} — ${sellForm.price || '0'} {sellForm.mly_price && `/ ${sellForm.mly_price} $MLY`}</p>
                <p className="text-xs text-harbor-400">{sellForm.category} · {sellForm.condition} · {sellForm.delivery}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSellStep(2)} className="flex-1 px-4 py-2 border border-harbor-300 rounded-lg text-harbor-700">← Back</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-teal">
                  {submitting ? 'Listing...' : '🎉 List Item'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
