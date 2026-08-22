'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Vehicle { id: string; make: string; model: string; year: number; color: string | null; plate: string | null; mileage: number; type: string; status: string; image_url: string | null; }
interface MaintenanceRecord { id: string; vehicle_id: string; type: string; description: string | null; mileage: number | null; cost: number; next_due_date: string | null; performed_at: string; }
interface CarShare { id: string; vehicle_id: string; owner_id: string; hourly_rate: number; daily_rate: number; available_from: string | null; available_to: string | null; rules: string | null; status: string; vehicles?: Vehicle; profiles?: { display_name: string }; }

type AutoTab = 'garage' | 'maintenance' | 'share' | 'parking';

const MAINTENANCE_TYPES = ['oil_change', 'tire', 'brakes', 'inspection', 'battery', 'transmission', 'other'] as const;

export default function AutoPage() {
  const [tab, setTab] = useState<AutoTab>('garage');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [shares, setShares] = useState<CarShare[]>([]);
  const [loading, setLoading] = useState(true);

  // Add vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState('2020');
  const [vType, setVType] = useState('gas');
  const [vColor, setVColor] = useState('');
  const [adding, setAdding] = useState(false);

  // Log maintenance form
  const [showLogMaint, setShowLogMaint] = useState(false);
  const [mVehicleId, setMVehicleId] = useState('');
  const [mType, setMType] = useState<typeof MAINTENANCE_TYPES[number]>('oil_change');
  const [mCost, setMCost] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [logging, setLogging] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const supabase = createClient();
    const { data: v } = await supabase.from('vehicles').select('*').eq('owner_id', user!.id);
    if (v) setVehicles(v);

    if (v && v.length > 0) {
      const vIds = v.map(ve => ve.id);
      const { data: m } = await supabase.from('maintenance_records').select('*').in('vehicle_id', vIds).order('performed_at', { ascending: false });
      if (m) setMaintenance(m);
    }

    const { data: s } = await supabase.from('car_shares').select('*, vehicles!car_shares_vehicle_id_fkey(*), profiles!car_shares_owner_id_fkey(display_name)').eq('status', 'available');
    if (s) setShares(s as any);
    setLoading(false);
  }

  async function addVehicle() {
    if (!user || !vMake.trim() || !vModel.trim()) return;
    setAdding(true);
    const supabase = createClient();
    await supabase.from('vehicles').insert({ owner_id: user.id, make: vMake.trim(), model: vModel.trim(), year: parseInt(vYear), type: vType, color: vColor.trim() || null });
    setVMake(''); setVModel(''); setVColor(''); setShowAddVehicle(false); setAdding(false); loadData();
  }

  async function logMaintenance() {
    if (!mVehicleId) return;
    setLogging(true);
    const supabase = createClient();
    await supabase.from('maintenance_records').insert({ vehicle_id: mVehicleId, type: mType, cost: parseFloat(mCost) || 0, description: mDesc.trim() || null });
    setMCost(''); setMDesc(''); setShowLogMaint(false); setLogging(false); loadData();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiAuto</h1>
          <p className="text-xs text-gray-500">Your vehicles, maintenance, and community car sharing</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['garage', 'maintenance', 'share', 'parking'] as AutoTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Garage */}
      {tab === 'garage' && (
        <div className="space-y-3">
          {user && <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="btn-teal text-xs w-full">+ Add Vehicle</button>}
          {showAddVehicle && (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <div className="grid grid-cols-2 gap-2">
                <input value={vMake} onChange={e => setVMake(e.target.value)} placeholder="Make (Toyota)" className="input-field" />
                <input value={vModel} onChange={e => setVModel(e.target.value)} placeholder="Model (Camry)" className="input-field" />
                <input value={vYear} onChange={e => setVYear(e.target.value)} placeholder="Year" type="number" className="input-field" />
                <select value={vType} onChange={e => setVType(e.target.value)} className="input-field"><option value="gas">Gas</option><option value="electric">Electric</option><option value="hybrid">Hybrid</option><option value="diesel">Diesel</option></select>
              </div>
              <input value={vColor} onChange={e => setVColor(e.target.value)} placeholder="Color (optional)" className="input-field" />
              <button onClick={addVehicle} disabled={!vMake.trim() || !vModel.trim() || adding} className="btn-teal w-full disabled:opacity-50">{adding ? 'Adding...' : 'Add Vehicle'}</button>
            </div>
          )}
          {vehicles.length === 0 ? <div className="card text-center py-8"><p className="text-3xl mb-2">🚗</p><p className="text-sm text-gray-500">No vehicles registered.</p></div> :
          vehicles.map(v => (
            <div key={v.id} className="card flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-2xl">
                {v.type === 'electric' ? '⚡' : v.type === 'hybrid' ? '🔋' : '🚗'}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{v.year} {v.make} {v.model}</h3>
                <p className="text-xs text-gray-500">{v.color && `${v.color} · `}{v.type} · {v.mileage.toLocaleString()} mi</p>
                <span className={cn('text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block', v.status === 'active' ? 'bg-green-100 text-green-600' : v.status === 'for_sale' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')}>{v.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance */}
      {tab === 'maintenance' && (
        <div className="space-y-3">
          {vehicles.length > 0 && <button onClick={() => setShowLogMaint(!showLogMaint)} className="btn-teal text-xs w-full">+ Log Maintenance</button>}
          {showLogMaint && (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <select value={mVehicleId} onChange={e => setMVehicleId(e.target.value)} className="input-field">
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={mType} onChange={e => setMType(e.target.value as any)} className="input-field">{MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select>
                <input value={mCost} onChange={e => setMCost(e.target.value)} placeholder="Cost $" type="number" className="input-field" />
              </div>
              <input value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Notes (optional)" className="input-field" />
              <button onClick={logMaintenance} disabled={!mVehicleId || logging} className="btn-teal w-full disabled:opacity-50">{logging ? 'Logging...' : 'Log Maintenance'}</button>
            </div>
          )}
          {maintenance.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">{vehicles.length === 0 ? 'Add a vehicle first.' : 'No maintenance records yet.'}</p></div> :
          maintenance.map(m => (
            <div key={m.id} className="card flex items-center gap-3">
              <span className="text-xl">{m.type === 'oil_change' ? '🛢️' : m.type === 'tire' ? '🛞' : m.type === 'brakes' ? '🛑' : '🔧'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{m.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-500">{new Date(m.performed_at).toLocaleDateString()}{m.description && ` · ${m.description}`}</p>
              </div>
              <span className="text-sm font-bold text-harbor-800 dark:text-white">${m.cost}</span>
            </div>
          ))}
        </div>
      )}

      {/* Car Share */}
      {tab === 'share' && (
        <div className="space-y-3">
          <div className="card bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800">
            <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400">🚗 Community Car Sharing</h3>
            <p className="text-xs text-teal-600 dark:text-teal-300 mt-1">Share your car when you're not using it. Get paid in $MLY.</p>
          </div>
          {shares.length === 0 ? <div className="card text-center py-6"><p className="text-xs text-gray-500">No cars available for sharing right now.</p></div> :
          shares.map(s => (
            <div key={s.id} className="card flex items-center gap-3">
              <span className="text-2xl">🚗</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{(s.vehicles as any)?.year} {(s.vehicles as any)?.make} {(s.vehicles as any)?.model}</p>
                <p className="text-xs text-gray-500">{(s.profiles as any)?.display_name} {s.rules && `· ${s.rules}`}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-mly-600">${s.hourly_rate}/hr</p>
                <p className="text-xs text-gray-400">${s.daily_rate}/day</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parking */}
      {tab === 'parking' && (
        <div className="card text-center py-8">
          <p className="text-3xl mb-2">🅿️</p>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Parking Finder</p>
          <p className="text-xs text-gray-500 mt-1">Community-reported free parking spots, EV chargers, and lot rates.</p>
          <p className="text-xs text-gray-400 mt-3">Report spots from MiNav map feature.</p>
        </div>
      )}
    </div>
  );
}
