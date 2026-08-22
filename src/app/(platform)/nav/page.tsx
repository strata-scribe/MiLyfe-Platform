'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { fetchJTARoutes, fetchJTAStops, type TransitRoute, type TransitStop } from '@/lib/transit/jta';

interface MapReport { id: string; user_id: string; type: string; lat: number; lng: number; description: string | null; upvotes: number; expires_at: string; created_at: string; }

const REPORT_TYPES = [
  { value: 'hazard', label: '⚠️ Hazard', color: 'bg-amber-500' },
  { value: 'police', label: '🚔 Police', color: 'bg-blue-500' },
  { value: 'construction', label: '🚧 Construction', color: 'bg-orange-500' },
  { value: 'flood', label: '🌊 Flooding', color: 'bg-cyan-500' },
  { value: 'accident', label: '💥 Accident', color: 'bg-red-500' },
  { value: 'closure', label: '🚫 Road Closed', color: 'bg-gray-500' },
  { value: 'speed_trap', label: '📸 Speed Trap', color: 'bg-purple-500' },
];

type NavTab = 'map' | 'reports' | 'transit' | 'report';

export default function NavPage() {
  const [tab, setTab] = useState<NavTab>('map');
  const [reports, setReports] = useState<MapReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Report form
  const [reportType, setReportType] = useState('hazard');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLng, setReportLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    const supabase = createClient();
    const { data } = await supabase.from('map_reports').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  }

  function getLocation() {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setReportLat(pos.coords.latitude); setReportLng(pos.coords.longitude); setGettingLocation(false); },
      () => { setGettingLocation(false); alert('Unable to get location. Please enable GPS.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submitReport() {
    if (!user || !reportLat || !reportLng) return;
    setSubmitting(true);
    const supabase = createClient();
    const expiresAt = new Date(); expiresAt.setHours(expiresAt.getHours() + 4); // Reports expire in 4h
    await supabase.from('map_reports').insert({ user_id: user.id, type: reportType, lat: reportLat, lng: reportLng, description: reportDesc.trim() || null, expires_at: expiresAt.toISOString() });
    setReportDesc(''); setReportLat(null); setReportLng(null); setSubmitting(false); setTab('reports'); loadReports();
  }

  async function upvoteReport(id: string) {
    const supabase = createClient();
    setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    await supabase.from('map_reports').update({ upvotes: reports.find(r => r.id === id)!.upvotes + 1 }).eq('id', id);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiNav</h1>
          <p className="text-xs text-gray-500">Community navigation. Report hazards. Find routes.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['map', 'reports', 'transit', 'report'] as NavTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'report' ? '+ Report' : t}</button>
        ))}
      </div>

      {/* Map placeholder */}
      {tab === 'map' && (
        <div className="space-y-3">
          <div className="card aspect-[4/3] bg-gradient-to-br from-green-100 to-blue-100 dark:from-harbor-800 dark:to-harbor-900 flex items-center justify-center rounded-xl overflow-hidden relative">
            <div className="text-center z-10">
              <p className="text-4xl mb-2">🗺️</p>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">Interactive Map</p>
              <p className="text-xs text-gray-500 mt-1">MapLibre GL integration — coming in Phase 4</p>
              <p className="text-xs text-gray-400 mt-0.5">{reports.length} active reports in your area</p>
            </div>
            {/* Report pins overlay */}
            {reports.slice(0, 5).map((r, i) => (
              <div key={r.id} className={cn('absolute w-6 h-6 rounded-full flex items-center justify-center text-xs', REPORT_TYPES.find(t => t.value === r.type)?.color || 'bg-gray-500')} style={{ top: `${20 + i * 15}%`, left: `${15 + i * 18}%` }}>
                {REPORT_TYPES.find(t => t.value === r.type)?.label.split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center !p-2"><p className="text-lg font-bold text-harbor-800 dark:text-white">{reports.length}</p><p className="text-[10px] text-gray-500">Active Reports</p></div>
            <div className="card text-center !p-2"><p className="text-lg font-bold text-harbor-800 dark:text-white">{reports.filter(r => r.type === 'hazard').length}</p><p className="text-[10px] text-gray-500">Hazards</p></div>
            <div className="card text-center !p-2"><p className="text-lg font-bold text-harbor-800 dark:text-white">{reports.filter(r => r.type === 'police').length}</p><p className="text-[10px] text-gray-500">Police</p></div>
          </div>
        </div>
      )}

      {/* Reports list */}
      {tab === 'reports' && (
        <div className="space-y-2">
          {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-16" />) :
          reports.length === 0 ? <div className="card text-center py-8"><p className="text-sm text-gray-500">No active reports. Roads are clear! 🎉</p></div> :
          reports.map(r => {
            const typeInfo = REPORT_TYPES.find(t => t.value === r.type);
            return (
              <div key={r.id} className="card flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg text-white', typeInfo?.color || 'bg-gray-500')}>
                  {typeInfo?.label.split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{r.type.replace(/_/g, ' ')}</p>
                  {r.description && <p className="text-xs text-gray-500 truncate">{r.description}</p>}
                  <p className="text-xs text-gray-400">Expires {new Date(r.expires_at).toLocaleTimeString()}</p>
                </div>
                <button onClick={() => upvoteReport(r.id)} className="text-xs text-gray-400 hover:text-teal-600">▲ {r.upvotes}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Transit */}
      {tab === 'transit' && (
        <TransitPanel />
      )}

      {/* Report */}
      {tab === 'report' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Report a Road Condition</h3>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_TYPES.map(t => (
              <button key={t.value} onClick={() => setReportType(t.value)} className={cn('py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all', reportType === t.value ? `${t.color} text-white border-transparent` : 'border-gray-200 dark:border-harbor-700 text-gray-600')}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Details (optional)" className="input-field resize-none" rows={2} />
          <button onClick={getLocation} disabled={gettingLocation} className="w-full py-2 border border-gray-200 dark:border-harbor-700 rounded-lg text-xs font-medium">
            {gettingLocation ? '📡 Getting location...' : reportLat ? `📍 ${reportLat.toFixed(4)}, ${reportLng?.toFixed(4)}` : '📍 Get My Location'}
          </button>
          <button onClick={submitReport} disabled={!reportLat || submitting} className="btn-teal w-full disabled:opacity-50">{submitting ? 'Reporting...' : 'Submit Report'}</button>
        </div>
      )}
    </div>
  );
}


// Transit panel using JTA GTFS data
function TransitPanel() {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [nearbyStops, setNearbyStops] = useState<TransitStop[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  useEffect(() => {
    fetchJTARoutes().then(r => { setRoutes(r); setLoadingRoutes(false); });
  }, []);

  function findNearbyStops() {
    setLoadingStops(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const stops = await fetchJTAStops(pos.coords.latitude, pos.coords.longitude);
        setNearbyStops(stops);
        setLoadingStops(false);
      },
      () => { setLoadingStops(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-3">
      {/* Nearby stops */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">🚏 Nearby Stops</h3>
          <button onClick={findNearbyStops} disabled={loadingStops} className="text-xs text-teal-600 font-medium">
            {loadingStops ? '📡 Finding...' : '📍 Find Near Me'}
          </button>
        </div>
        {nearbyStops.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            Tap &quot;Find Near Me&quot; to see JTA stops within 1km.
          </p>
        ) : (
          <div className="space-y-2">
            {nearbyStops.map(stop => (
              <div key={stop.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                <span className="text-lg">🚏</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-harbor-800 dark:text-white truncate">{stop.stop_name}</p>
                  <div className="flex gap-1 mt-0.5">
                    {stop.routes.map(r => (
                      <span key={r} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                        #{r}
                      </span>
                    ))}
                  </div>
                </div>
                {stop.wheelchair_boarding === 1 && <span className="text-xs">♿</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All routes */}
      <div className="card">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">🚌 JTA Routes</h3>
        {loadingRoutes ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}</div>
        ) : (
          <div className="space-y-1.5">
            {routes.map(route => (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-harbor-800/50 transition-colors text-left"
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `#${route.route_color}`, color: `#${route.route_text_color}` }}
                >
                  {route.route_short_name}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-harbor-800 dark:text-white truncate">{route.route_long_name}</p>
                </div>
                <span className="text-xs text-gray-400">{route.route_type === 3 ? '🚌' : '🚈'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Data source:</strong> JTA GTFS via Transitland API. Schedule data updates daily. 
          Real-time vehicle positions require JTA partnership (in progress).
        </p>
      </div>
    </div>
  );
}
