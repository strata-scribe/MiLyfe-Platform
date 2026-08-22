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
  type: 'community' | 'business' | 'transit' | 'park' | 'service'
  address: string
  distance: string
}

interface SavedRoute {
  id: string
  name: string
  from: string
  to: string
  distance: string
  duration: string
  lastUsed: string
}

interface TransitRoute {
  id: string
  line: string
  destination: string
  nextArrival: string
  status: 'on-time' | 'delayed' | 'cancelled'
  frequency: string
}

interface GasStation {
  id: string
  name: string
  type: 'gas' | 'ev'
  price: string
  distance: string
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
}

interface CommuteStats {
  avgTime: string
  avgDistance: string
  avgCost: string
  tripsThisWeek: number
  co2Saved: string
}

export default function NavPage() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [loading, setLoading] = useState(true)
  const [pois, setPois] = useState<PointOfInterest[]>([])
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [transit, setTransit] = useState<TransitRoute[]>([])
  const [gasStations, setGasStations] = useState<GasStation[]>([])
  const [commuteStats, setCommuteStats] = useState<CommuteStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()
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
      setPois([
        { id: '1', name: 'Riverside Community Center', type: 'community', address: '1234 Park St, Jacksonville', distance: '0.3 mi' },
        { id: '2', name: 'JTA Bus Stop - Main & 5th', type: 'transit', address: 'Main St & 5th Ave', distance: '0.1 mi' },
        { id: '3', name: 'Springfield Park', type: 'park', address: '800 N Main St', distance: '0.8 mi' },
        { id: '4', name: 'MiLyfe Co-op Store', type: 'business', address: '456 Oak Ave', distance: '0.5 mi' },
        { id: '5', name: 'Health Clinic - Eastside', type: 'service', address: '789 Elm Blvd', distance: '1.2 mi' },
      ])
      setRoutes([
        { id: '1', name: 'Home to Work', from: '123 Riverside Ave', to: '456 Downtown Blvd', distance: '4.2 mi', duration: '12 min', lastUsed: 'Today' },
        { id: '2', name: 'Grocery Run', from: 'Home', to: 'Publix - San Marco', distance: '2.1 mi', duration: '7 min', lastUsed: 'Yesterday' },
        { id: '3', name: 'Kids School', from: 'Home', to: 'Springfield Elementary', distance: '1.8 mi', duration: '5 min', lastUsed: '2 days ago' },
      ])
      setTransit([
        { id: '1', line: 'Route 1 - Kings Ave', destination: 'Downtown Terminal', nextArrival: '3 min', status: 'on-time', frequency: 'Every 15 min' },
        { id: '2', line: 'Route 5 - Riverside', destination: 'Riverside Ave Station', nextArrival: '8 min', status: 'on-time', frequency: 'Every 20 min' },
        { id: '3', line: 'Route 12 - Beach Blvd', destination: 'Jacksonville Beach', nextArrival: '15 min', status: 'delayed', frequency: 'Every 30 min' },
        { id: '4', line: 'Skyway - Convention', destination: 'Convention Center', nextArrival: '2 min', status: 'on-time', frequency: 'Every 5 min' },
      ])
      setGasStations([
        { id: '1', name: 'Shell - Main St', type: 'gas', price: '$3.29/gal', distance: '0.4 mi', lastUpdated: '2 hours ago', trend: 'down' },
        { id: '2', name: 'BP - Park Ave', type: 'gas', price: '$3.35/gal', distance: '0.7 mi', lastUpdated: '1 hour ago', trend: 'stable' },
        { id: '3', name: 'ChargePoint - Library', type: 'ev', price: '$0.32/kWh', distance: '0.5 mi', lastUpdated: '30 min ago', trend: 'stable' },
        { id: '4', name: 'Tesla Supercharger - Town Ctr', type: 'ev', price: '$0.38/kWh', distance: '2.1 mi', lastUpdated: '1 hour ago', trend: 'up' },
      ])
      setCommuteStats({
        avgTime: '18 min',
        avgDistance: '4.2 mi',
        avgCost: '$2.80/day',
        tripsThisWeek: 8,
        co2Saved: '12 lbs',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleShareRoute(routeId: string) {
    toast.success('Route link copied to clipboard!')
  }

  function handleSaveRoute() {
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
            <div className="space-y-2">
              {pois.map(poi => (
                <div key={poi.id} className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg hover:bg-harbor-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{poiIcon(poi.type)}</span>
                    <div>
                      <p className="font-medium text-harbor-800 text-sm">{poi.name}</p>
                      <p className="text-xs text-harbor-500">{poi.address}</p>
                    </div>
                  </div>
                  <span className="text-xs text-teal-600 font-medium">{poi.distance}</span>
                </div>
              ))}
            </div>
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
          {routes.map(route => (
            <div key={route.id} className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-harbor-800">{route.name}</h4>
                <button onClick={() => handleShareRoute(route.id)} className="text-xs text-teal-600 hover:underline">Share</button>
              </div>
              <div className="flex items-center gap-2 text-sm text-harbor-500">
                <span>{route.from}</span>
                <span className="text-harbor-300">→</span>
                <span>{route.to}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-harbor-400">
                <span>{route.distance}</span>
                <span>{route.duration}</span>
                <span>Last used: {route.lastUsed}</span>
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
          {transit.map(route => (
            <div key={route.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{route.line}</p>
                <p className="text-sm text-harbor-500">To: {route.destination}</p>
                <p className="text-xs text-harbor-400">{route.frequency}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-teal-600">{route.nextArrival}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded', route.status === 'on-time' ? 'bg-green-100 text-green-700' : route.status === 'delayed' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>{route.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'gas' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Gas & EV Charging Prices</h2>
          {gasStations.map(station => (
            <div key={station.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{station.type === 'gas' ? '⛽' : '⚡'}</span>
                <div>
                  <p className="font-medium text-harbor-800">{station.name}</p>
                  <p className="text-xs text-harbor-500">{station.distance} away | Updated {station.lastUpdated}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-harbor-800">{station.price}</p>
                <span className={cn('text-xs', station.trend === 'down' ? 'text-green-600' : station.trend === 'up' ? 'text-red-500' : 'text-harbor-400')}>
                  {station.trend === 'down' ? '↓ Dropping' : station.trend === 'up' ? '↑ Rising' : '→ Stable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'commute' && (
        <div className="space-y-4">
          {commuteStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[{ label: 'Avg Time', value: commuteStats.avgTime }, { label: 'Avg Distance', value: commuteStats.avgDistance }, { label: 'Daily Cost', value: commuteStats.avgCost }, { label: 'Trips/Week', value: String(commuteStats.tripsThisWeek) }, { label: 'CO₂ Saved', value: commuteStats.co2Saved }].map(stat => (
                <div key={stat.label} className="card p-3 rounded-xl text-center">
                  <p className="text-xs text-harbor-500">{stat.label}</p>
                  <p className="text-lg font-bold text-teal-600 mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-harbor-800 mb-3">Carpool Matching</h3>
            <p className="text-sm text-harbor-500 mb-3">Find neighbors heading the same direction</p>
            <div className="space-y-2">
              {[{ name: 'Alex T.', route: 'Riverside → Downtown', time: '8:00 AM', seats: 2 }, { name: 'Jamie L.', route: 'Springfield → Southside', time: '7:30 AM', seats: 3 }].map((match, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-harbor-50 rounded-lg">
                  <div>
                    <p className="font-medium text-harbor-800 text-sm">{match.name}</p>
                    <p className="text-xs text-harbor-500">{match.route} | {match.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-harbor-400">{match.seats} seats</span>
                    <button className="btn-teal px-3 py-1 rounded text-xs">Request</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
