'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'search' | 'saved' | 'documents' | 'maintenance' | 'resources'

interface Listing {
  id: string
  title: string
  rent: number
  bedrooms: number
  bathrooms: number
  petFriendly: boolean
  acceptsVouchers: boolean
  distance: string
  neighborhood: string
  available: string
  features: string[]
}

interface SavedListing {
  id: string
  listing: Listing
  notes: string
  savedAt: string
}

interface Document {
  id: string
  name: string
  type: 'lease' | 'utility' | 'insurance' | 'other'
  uploadedAt: string
  size: string
}

interface MaintenanceRequest {
  id: string
  title: string
  status: 'submitted' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  submittedAt: string
  hasPhotos: boolean
}

export default function HousingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [saved, setSaved] = useState<SavedListing[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([])
  const [filters, setFilters] = useState({ minRent: '', maxRent: '', bedrooms: '', petFriendly: false, acceptsVouchers: false })
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', priority: 'medium', description: '' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'search', label: 'Search' },
    { key: 'saved', label: 'Saved' },
    { key: 'documents', label: 'Documents' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'resources', label: 'Resources' },
  ]

  useEffect(() => {
    loadHousingData()
  }, [])

  async function loadHousingData() {
    setLoading(true)
    try {
      setListings([
        { id: '1', title: '2BR Apartment - Riverside', rent: 1200, bedrooms: 2, bathrooms: 1, petFriendly: true, acceptsVouchers: true, distance: '0.5 mi', neighborhood: 'Riverside', available: 'Feb 1', features: ['W/D In-Unit', 'Parking', 'Updated Kitchen'] },
        { id: '2', title: 'Studio - Downtown Loft', rent: 850, bedrooms: 0, bathrooms: 1, petFriendly: false, acceptsVouchers: false, distance: '1.2 mi', neighborhood: 'Downtown', available: 'Now', features: ['High Ceilings', 'City View', 'Gym Access'] },
        { id: '3', title: '3BR House - Springfield', rent: 1450, bedrooms: 3, bathrooms: 2, petFriendly: true, acceptsVouchers: true, distance: '2.0 mi', neighborhood: 'Springfield', available: 'Feb 15', features: ['Yard', 'Garage', 'Near Schools'] },
        { id: '4', title: '1BR Apt - San Marco', rent: 1050, bedrooms: 1, bathrooms: 1, petFriendly: true, acceptsVouchers: false, distance: '1.8 mi', neighborhood: 'San Marco', available: 'Mar 1', features: ['Pool', 'Balcony', 'Renovated'] },
      ])
      setSaved([
        { id: '1', listing: { id: '1', title: '2BR Apartment - Riverside', rent: 1200, bedrooms: 2, bathrooms: 1, petFriendly: true, acceptsVouchers: true, distance: '0.5 mi', neighborhood: 'Riverside', available: 'Feb 1', features: ['W/D In-Unit', 'Parking', 'Updated Kitchen'] }, notes: 'Great location, need to check parking situation', savedAt: '2024-01-12' },
      ])
      setDocuments([
        { id: '1', name: 'Lease Agreement - 123 Park St', type: 'lease', uploadedAt: '2024-01-01', size: '2.4 MB' },
        { id: '2', name: 'JEA Bill - January 2024', type: 'utility', uploadedAt: '2024-01-15', size: '156 KB' },
        { id: '3', name: 'Renters Insurance Policy', type: 'insurance', uploadedAt: '2023-12-01', size: '1.1 MB' },
      ])
      setMaintenance([
        { id: '1', title: 'Leaking faucet in kitchen', status: 'in-progress', priority: 'medium', submittedAt: '2024-01-13', hasPhotos: true },
        { id: '2', title: 'AC not cooling properly', status: 'submitted', priority: 'high', submittedAt: '2024-01-15', hasPhotos: false },
        { id: '3', title: 'Replace smoke detector battery', status: 'completed', priority: 'low', submittedAt: '2024-01-10', hasPhotos: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSaveListing(listing: Listing) {
    setSaved(prev => [...prev, { id: String(Date.now()), listing, notes: '', savedAt: new Date().toISOString().split('T')[0] }])
    toast.success('Listing saved!')
  }

  function handleSubmitMaintenance() {
    if (!maintenanceForm.title) {
      toast.error('Please describe the issue')
      return
    }
    setMaintenance(prev => [{ id: String(Date.now()), title: maintenanceForm.title, status: 'submitted', priority: maintenanceForm.priority as MaintenanceRequest['priority'], submittedAt: new Date().toLocaleDateString(), hasPhotos: false }, ...prev])
    setMaintenanceForm({ title: '', priority: 'medium', description: '' })
    toast.success('Maintenance request submitted!')
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
              <input className="input-field px-3 py-2 rounded-lg text-sm" placeholder="Min rent" value={filters.minRent} onChange={e => setFilters(p => ({ ...p, minRent: e.target.value }))} />
              <input className="input-field px-3 py-2 rounded-lg text-sm" placeholder="Max rent" value={filters.maxRent} onChange={e => setFilters(p => ({ ...p, maxRent: e.target.value }))} />
              <select className="input-field px-3 py-2 rounded-lg text-sm" value={filters.bedrooms} onChange={e => setFilters(p => ({ ...p, bedrooms: e.target.value }))}>
                <option value="">Bedrooms</option>
                <option value="0">Studio</option>
                <option value="1">1 BR</option>
                <option value="2">2 BR</option>
                <option value="3">3+ BR</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-harbor-600">
                <input type="checkbox" checked={filters.petFriendly} onChange={e => setFilters(p => ({ ...p, petFriendly: e.target.checked }))} className="rounded" />
                Pet-Friendly
              </label>
              <label className="flex items-center gap-2 text-sm text-harbor-600">
                <input type="checkbox" checked={filters.acceptsVouchers} onChange={e => setFilters(p => ({ ...p, acceptsVouchers: e.target.checked }))} className="rounded" />
                Vouchers OK
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="card p-5 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-harbor-800">{listing.title}</h3>
                  <p className="text-lg font-bold text-teal-600">${listing.rent}/mo</p>
                </div>
                <p className="text-sm text-harbor-500 mb-2">{listing.neighborhood} | {listing.distance} | Available: {listing.available}</p>
                <div className="flex items-center gap-3 text-xs text-harbor-500 mb-3">
                  <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} BR`}</span>
                  <span>{listing.bathrooms} BA</span>
                  {listing.petFriendly && <span className="text-teal-600">🐾 Pets OK</span>}
                  {listing.acceptsVouchers && <span className="text-mly-600">✓ Vouchers</span>}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.features.map(f => (
                    <span key={f} className="px-2 py-0.5 bg-harbor-50 text-harbor-600 rounded text-xs">{f}</span>
                  ))}
                </div>
                <button onClick={() => handleSaveListing(listing)} className="btn-teal w-full py-2 rounded-lg text-sm">Save Listing</button>
              </div>
            ))}
          </div>
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
                <h3 className="font-semibold text-harbor-800">{item.listing.title}</h3>
                <p className="text-lg font-bold text-teal-600">${item.listing.rent}/mo</p>
              </div>
              <p className="text-sm text-harbor-500">Saved: {item.savedAt}</p>
              {item.notes && <p className="text-sm text-harbor-600 mt-2 italic">Note: {item.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="card p-4 rounded-xl bg-teal-50 border border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">Secure Document Vault</h3>
            <p className="text-xs text-teal-600">Your documents are encrypted and only accessible by you.</p>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-harbor-800">My Documents</h2>
            <button className="btn-teal px-3 py-1.5 rounded-lg text-sm">Upload Document</button>
          </div>
          {documents.map(doc => (
            <div key={doc.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{doc.type === 'lease' ? '📄' : doc.type === 'utility' ? '💡' : doc.type === 'insurance' ? '🛡️' : '📎'}</span>
                <div>
                  <p className="font-medium text-harbor-800 text-sm">{doc.name}</p>
                  <p className="text-xs text-harbor-500">Uploaded: {doc.uploadedAt} | {doc.size}</p>
                </div>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', doc.type === 'lease' ? 'bg-teal-100 text-teal-700' : doc.type === 'utility' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>{doc.type}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Submit Repair Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input-field px-3 py-2 rounded-lg col-span-2" placeholder="Describe the issue..." value={maintenanceForm.title} onChange={e => setMaintenanceForm(p => ({ ...p, title: e.target.value }))} />
              <select className="input-field px-3 py-2 rounded-lg" value={maintenanceForm.priority} onChange={e => setMaintenanceForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <button onClick={handleSubmitMaintenance} className="btn-teal px-4 py-2 rounded-lg text-sm mt-3">Submit Request</button>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">Request History</h2>
          {maintenance.map(req => (
            <div key={req.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{req.title}</p>
                <p className="text-xs text-harbor-500">Submitted: {req.submittedAt} {req.hasPhotos && '| 📷 Photos attached'}</p>
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
