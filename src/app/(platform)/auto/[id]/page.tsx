'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate: string | null;
  mileage: number;
  type: 'gas' | 'ev' | 'hybrid';
  status: string;
  image_url: string | null;
  created_at: string;
}

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  mileage: number;
  cost: number;
  provider: string | null;
  notes: string | null;
  next_due: string | null;
  created_at: string;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({ type: 'oil_change', mileage: '', cost: '', provider: '', notes: '', next_due: '' });
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => { loadVehicle(); }, [vehicleId]);

  async function loadVehicle() {
    setLoading(true);
    const { data: v } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
    if (v) setVehicle(v as any);

    const { data: r } = await supabase.from('maintenance_records').select('*').eq('vehicle_id', vehicleId).order('created_at', { ascending: false });
    if (r) setRecords(r as any);
    setLoading(false);
  }

  async function addMaintenanceRecord() {
    if (!user || !vehicle) return;
    const { error } = await supabase.from('maintenance_records').insert({
      vehicle_id: vehicleId,
      type: newRecord.type,
      mileage: parseInt(newRecord.mileage) || vehicle.mileage,
      cost: parseFloat(newRecord.cost) || 0,
      provider: newRecord.provider || null,
      notes: newRecord.notes || null,
      next_due: newRecord.next_due || null,
    });
    if (error) { toast.error('Failed to add record'); return; }

    if (newRecord.mileage) {
      await supabase.from('vehicles').update({ mileage: parseInt(newRecord.mileage) }).eq('id', vehicleId);
    }
    toast.success('Maintenance record added!');
    setShowAddRecord(false);
    setNewRecord({ type: 'oil_change', mileage: '', cost: '', provider: '', notes: '', next_due: '' });
    loadVehicle();
  }

  const maintenanceTypes = ['oil_change', 'tire_rotation', 'brakes', 'battery', 'inspection', 'transmission', 'coolant', 'air_filter', 'spark_plugs', 'other'];

  function typeLabel(type: string) { return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

  if (loading) return <div className="space-y-4 animate-slide-up"><div className="skeleton h-48 rounded-xl" /><div className="skeleton h-32 rounded-xl" /></div>;
  if (!vehicle) return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/auto" className="text-gray-400 text-sm">← Back</Link>
      <div className="card text-center py-8"><p className="text-gray-500">Vehicle not found</p></div>
    </div>
  );

  const totalSpent = records.reduce((s, r) => s + r.cost, 0);
  const upcomingService = records.find(r => r.next_due && new Date(r.next_due) > new Date());

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/auto" className="text-gray-400 text-sm">← Back to MiAuto</Link>

      {/* Vehicle Header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-3xl">
            {vehicle.type === 'ev' ? '⚡' : vehicle.type === 'hybrid' ? '🔋' : '🚗'}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <span className="capitalize">{vehicle.color}</span>
              {vehicle.plate && <><span>·</span><span>{vehicle.plate}</span></>}
              <span>·</span>
              <span>{vehicle.mileage.toLocaleString()} mi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{records.length}</p>
          <p className="text-[10px] text-gray-400">Records</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-mly-600">${totalSpent.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400">Total Spent</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">{vehicle.mileage.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">Miles</p>
        </div>
      </div>

      {/* Upcoming Service */}
      {upcomingService && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Upcoming: {typeLabel(upcomingService.type)}</p>
              <p className="text-xs text-yellow-600">Due {new Date(upcomingService.next_due!).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Record */}
      <button onClick={() => setShowAddRecord(!showAddRecord)} className="btn-teal w-full">+ Add Maintenance Record</button>

      {showAddRecord && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-medium text-harbor-800 dark:text-white">Log Maintenance</h3>
          <select value={newRecord.type} onChange={e => setNewRecord(p => ({ ...p, type: e.target.value }))} className="input-field w-full text-sm">
            {maintenanceTypes.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Mileage" value={newRecord.mileage} onChange={e => setNewRecord(p => ({ ...p, mileage: e.target.value }))} className="input-field text-sm" />
            <input type="number" placeholder="Cost ($)" value={newRecord.cost} onChange={e => setNewRecord(p => ({ ...p, cost: e.target.value }))} className="input-field text-sm" />
          </div>
          <input type="text" placeholder="Provider (shop name)" value={newRecord.provider} onChange={e => setNewRecord(p => ({ ...p, provider: e.target.value }))} className="input-field w-full text-sm" />
          <input type="text" placeholder="Notes" value={newRecord.notes} onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))} className="input-field w-full text-sm" />
          <input type="date" value={newRecord.next_due} onChange={e => setNewRecord(p => ({ ...p, next_due: e.target.value }))} className="input-field w-full text-sm" />
          <p className="text-[10px] text-gray-400">Next service due date (optional)</p>
          <button onClick={addMaintenanceRecord} className="btn-teal w-full text-sm">Save Record</button>
        </div>
      )}

      {/* Maintenance History */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Maintenance History</h3>
        {records.length === 0 ? (
          <div className="card text-center py-6"><p className="text-xs text-gray-500">No records yet. Log your first service!</p></div>
        ) : records.map(r => (
          <div key={r.id} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-sm">🔧</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{typeLabel(r.type)}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{r.mileage.toLocaleString()} mi</span>
                {r.provider && <><span>·</span><span>{r.provider}</span></>}
                <span>·</span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <span className="text-sm font-medium text-mly-600">${r.cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
