'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'search' | 'saved' | 'maintenance' | 'resources'

interface Listing {
  id: string
  user_id: string | null
  type: string | null
  title: string
  description: string | null
  price_monthly: number | null
  beds: number | null
  baths: number | null
  address: string | null
  neighborhood: string | null
  available_date: string | null
  images: string[] | null
  anonymous: boolean
  status: string | null
  created_at: string
}

interface SavedListing {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  housing_listings: Listing | null
}

interface MaintenanceRequest {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: string
  status: string
  has_photos: boolean
  submitted_at: string
}

export default function HousingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [saved, setSaved] = useState<SavedListing[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([])
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', beds: '', neighborhood: '' })
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', priority: 'medium', description: '' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'search', label: 'Search' },
    { key: 'saved', label: 'Saved' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'resources', label: 'Resources' },
  ]

  const neighborhoods = ['Riverside', 'Springfield', 'Downtown', 'Eastside', 'Northside', 'San Marco', 'Beaches']

  useEffect(() => {
    loadHousingData()
  }, [])

  async function loadHousingData() {
    setLoading(true)
    try {
      let query = supabase.from('housing_listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(20)
      const { data: listingsData } = await query
      if (listingsData) setListings(listingsData)

      if (user?.id) {
        const { data: savedData } = await supabase
          .from('housing_saved')
          .select('*, housing_listings(*)')
          .eq('user_id', user.id)
        if (savedData) setSaved(savedData)

        const { data: maintenanceData } = await supabase
          .from('housing_maintenance')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
        if (maintenanceData) setMaintenance(maintenanceData)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    let query = supabase.from('housing_listings').select('*').eq('status', 'active')
    if (filters.minPrice) query = query.gte('price_monthly', parseInt(filters.minPrice))
    if (filters.maxPrice) query = query.lte('price_monthly', parseInt(filters.maxPrice))
    if (filters.beds) query = query.eq('beds', parseInt(filters.beds))
    if (filters.neighborhood) query = query.eq('neighborhood', filters.neighborhood)
    const { data } = await query.order('created_at', { ascending: false }).limit(20)
    if (data) setListings(data)
  }

  async function handleSaveListing(listingId: string) {
    if (!user?.id) { toast.error('Please sign in to save listings'); return }
    const { error } = await supabase.from('housing_saved').insert({ user_id: user.id, listing_id: listingId })
    if (error) { toast.error('Failed to save listing'); return }
    toast.success('Listing saved!')
    loadHousingData()
  }

  async function handleSubmitMaintenance() {
    if (!maintenanceForm.title) { toast.error('Please describe the issue'); return }
    if (!user?.id) { toast.error('Please sign in'); return }
    const { error } = await supabase.from('housing_maintenance').insert({
      user_id: user.id,
      title: maintenanceForm.title,
      description: maintenanceForm.description || null,
      priority: maintenanceForm.priority,
      status: 'submitted',
      has_photos: false,
    })
    if (error) { toast.error('Failed to submit request'); return }
    toast.success('Maintenance request submitted!')
    setMaintenanceForm({ title: '', priority: 'medium', description: '' })
    loadHousingData()
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in-progress': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-56 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-44 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Housing & Rentals</h1>
          <p className="text-harbor-500 mt-1">Find your next home in the community</p>
        </div>
        <Link href="/dashboard" className="btn-teal px-4 py-2 rounded-lg text-sm">Back to Dashboard</Link>
      </div>

      <nav className="flex gap-1 bg-harbor-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-sm' : 'text-harbor-600 hover:bg-harbor-200')}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="card p-4 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <input className="input-field px-3 py-2 rounded-lg text-sm" placeholder="Min price" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
              <input className="input-field px-3 py-2 rounded-lg text-sm" placeholder="Max price" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
              <select className="input-field px-3 py-2 rounded-lg text-sm" value={filters.beds} onChange={e => setFilters(p => ({ ...p, beds: e.target.value }))}>
                <option value="">Beds</option>
                <option value="0">Studio</option>
                <option value="1">1 BR</option>
                <option value="2">2 BR</option>
                <option value="3">3+ BR</option>
              </select>
              <select className="input-field px-3 py-2 rounded-lg text-sm" value={filters.neighborhood} onChange={e => setFilters(p => ({ ...p, neighborhood: e.target.value }))}>
                <option value="">Neighborhood</option>
                {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button onClick={handleSearch} className="btn-teal px-3 py-2 rounded-lg text-sm">Search</button>
            </div>
          </div>
          {listings.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No listings found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map(listing => (
                <div key={listing.id} className="card p-5 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-harbor-800">{listing.title}</h3>
                    <p className="text-lg font-bold text-teal-600">{listing.price_monthly ? `$${listing.price_monthly}/mo` : 'Price TBD'}</p>
                  </div>
                  <p className="text-sm text-harbor-500 mb-2">{listing.neighborhood || 'Unknown area'} | Available: {listing.available_date ? new Date(listing.available_date).toLocaleDateString() : 'Now'}</p>
                  <div className="flex items-center gap-3 text-xs text-harbor-500 mb-3">
                    <span>{listing.beds === 0 ? 'Studio' : `${listing.beds} BR`}</span>
                    <span>{listing.baths} BA</span>
                    {listing.type && <span className="capitalize">{listing.type}</span>}
                  </div>
                  {listing.description && <p className="text-sm text-harbor-500 mb-3 line-clamp-2">{listing.description}</p>}
                  <button onClick={() => handleSaveListing(listing.id)} className="btn-teal w-full py-2 rounded-lg text-sm">Save Listing</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Saved Listings ({saved.length})</h2>
          {saved.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No saved listings yet. Browse and save listings you like!</p>
            </div>
          ) : saved.map(item => (
            <div key={item.id} className="card p-5 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-harbor-800">{item.housing_listings?.title || 'Listing'}</h3>
                <p className="text-lg font-bold text-teal-600">{item.housing_listings?.price_monthly ? `$${item.housing_listings.price_monthly}/mo` : 'N/A'}</p>
              </div>
              <p className="text-sm text-harbor-500">Saved: {new Date(item.created_at).toLocaleDateString()}</p>
              {item.housing_listings?.neighborhood && <p className="text-xs text-harbor-400 mt-1">{item.housing_listings.neighborhood}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Submit Repair Request</h3>
            <div className="space-y-3">
              <input className="input-field w-full px-3 py-2 rounded-lg" placeholder="Describe the issue..." value={maintenanceForm.title} onChange={e => setMaintenanceForm(p => ({ ...p, title: e.target.value }))} />
              <textarea className="input-field w-full px-3 py-2 rounded-lg min-h-[80px]" placeholder="Additional details..." value={maintenanceForm.description} onChange={e => setMaintenanceForm(p => ({ ...p, description: e.target.value }))} />
              <select className="input-field px-3 py-2 rounded-lg" value={maintenanceForm.priority} onChange={e => setMaintenanceForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <button onClick={handleSubmitMaintenance} className="btn-teal px-4 py-2 rounded-lg text-sm mt-3">Submit Request</button>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">Request History</h2>
          {maintenance.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No maintenance requests yet.</p>
            </div>
          ) : maintenance.map(req => (
            <div key={req.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{req.title}</p>
                <p className="text-xs text-harbor-500">Submitted: {new Date(req.submitted_at).toLocaleDateString()} {req.has_photos && '| Photos attached'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', req.priority === 'high' ? 'bg-red-100 text-red-700' : req.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-harbor-100 text-harbor-600')}>{req.priority}</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColor(req.status))}>{req.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Housing Resources</h2>
          {[
            { title: 'Tenant Rights in Florida', desc: 'Know your rights as a renter including security deposits, eviction procedures, and habitability standards.', icon: '⚖️' },
            { title: 'Utility Assistance Programs', desc: 'LIHEAP, JEA payment plans, and community assistance for utility bills.', icon: '💡' },
            { title: 'Moving Help & Resources', desc: 'Community volunteers, donation centers, and low-cost moving services.', icon: '🚚' },
            { title: 'First-Time Renter Guide', desc: 'Everything you need to know: credit checks, applications, what to look for, and lease basics.', icon: '📚' },
          ].map((resource, idx) => (
            <div key={idx} className="card p-5 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{resource.icon}</span>
                <div>
                  <h3 className="font-semibold text-harbor-800">{resource.title}</h3>
                  <p className="text-sm text-harbor-500 mt-1">{resource.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
