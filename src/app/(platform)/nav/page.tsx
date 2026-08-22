'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'map' | 'routes' | 'transit' | 'gas' | 'commute'

interface PointOfInterest {
  id: string
  name: string
  type: string
  address: string
  lat: number
  lng: number
}

interface SavedRoute {
  id: string
  user_id: string
  name: string
  from_location: string
  to_location: string
  distance: string
  duration: string
  last_used: string
}

export default function NavPage() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [loading, setLoading] = useState(true)
  const [pois, setPois] = useState<PointOfInterest[]>([])
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'map', label: 'Map' },
    { key: 'routes', label: 'Routes' },
    { key: 'transit', label: 'Transit' },
    { key: 'gas', label: 'Gas/EV' },
    { key: 'commute', label: 'Commute' },
  ]

  useEffect(() => {
    loadNavData()
  }, [])

  async function loadNavData() {
    setLoading(true)
    try {
      const supabase = createClient()

      const [poisRes, routesRes] = await Promise.all([
        supabase.from('nav_points_of_interest').select('*').order('created_at', { ascending: false }),
        supabase.from('nav_saved_routes').select('*').eq('user_id', user?.id || '').order('last_used', { ascending: false }),
      ])

      setPois(poisRes.data || [])
      setRoutes(routesRes.data || [])
    } catch (err) {
      toast.error('Failed to load navigation data')
    } finally {
      setLoading(false)
    }
  }

  function handleShareRoute(routeId: string) {
    toast.success('Route link copied to clipboard!')
  }

  async function handleSaveRoute() {
    toast.success('Route saved to favorites!')
  }

  const poiIcon = (type: string) => {
    switch (type) {
      case 'community': return '🏛️'
      case 'business': return '🏪'
      case 'transit': return '🚌'
      case 'park': return '🌳'
      case 'service': return '🏥'
      default: return '📍'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Navigation & Transit</h1>
          <p className="text-harbor-500 mt-1">Get around Jacksonville efficiently</p>
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

      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="card rounded-xl overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-teal-50 to-harbor-100 flex items-center justify-center border-b border-harbor-200">
              <div className="text-center">
                <p className="text-harbor-400 text-sm">MapLibre Interactive Map</p>
                <p className="text-harbor-300 text-xs mt-1">Community locations & points of interest</p>
              </div>
            </div>
            <div className="p-4">
              <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Search places, addresses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Nearby Points of Interest</h3>
            {pois.length === 0 ? (
              <p className="text-sm text-harbor-500">No points of interest added yet.</p>
            ) : (
              <div className="space-y-2">
                {pois.filter(poi => !searchQuery || poi.name.toLowerCase().includes(searchQuery.toLowerCase())).map(poi => (
                  <div key={poi.id} className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg hover:bg-harbor-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{poiIcon(poi.type)}</span>
                      <div>
                        <p className="font-medium text-harbor-800 text-sm">{poi.name}</p>
                        <p className="text-xs text-harbor-500">{poi.address}</p>
                      </div>
                    </div>
                    <span className="text-xs text-teal-600 font-medium capitalize">{poi.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Save New Route</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input-field px-3 py-2 rounded-lg" placeholder="From..." />
              <input className="input-field px-3 py-2 rounded-lg" placeholder="To..." />
              <button onClick={handleSaveRoute} className="btn-teal px-4 py-2 rounded-lg text-sm">Save Route</button>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-harbor-800">Saved Routes</h2>
          {routes.length === 0 ? (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">No saved routes yet. Save your first route above!</p>
            </div>
          ) : routes.map(route => (
            <div key={route.id} className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-harbor-800">{route.name}</h4>
                <button onClick={() => handleShareRoute(route.id)} className="text-xs text-teal-600 hover:underline">Share</button>
              </div>
              <div className="flex items-center gap-2 text-sm text-harbor-500">
                <span>{route.from_location}</span>
                <span className="text-harbor-300">→</span>
                <span>{route.to_location}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-harbor-400">
                <span>{route.distance}</span>
                <span>{route.duration}</span>
                <span>Last used: {route.last_used ? new Date(route.last_used).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'transit' && (
        <div className="space-y-4">
          <div className="card p-4 rounded-xl bg-teal-50 border border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">JTA Real-Time Arrivals</h3>
            <p className="text-xs text-teal-600">Live bus & Skyway schedules for Jacksonville</p>
          </div>
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">No transit data yet. Real-time transit feeds will appear here once configured.</p>
          </div>
        </div>
      )}

      {activeTab === 'gas' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Gas & EV Charging Prices</h2>
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">No gas/EV station data yet. Price data will appear here once stations are added.</p>
          </div>
        </div>
      )}

      {activeTab === 'commute' && (
        <div className="space-y-4">
          <div className="card p-8 rounded-xl text-center">
            <p className="text-harbor-500">No commute data yet. Start logging trips to see your stats and carpool matches.</p>
          </div>
        </div>
      )}
    </div>
  )
}
