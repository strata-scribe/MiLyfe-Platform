'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string | null;
  license_plate: string | null;
  mileage: number;
  fuel_type: 'gas' | 'diesel' | 'electric' | 'hybrid';
  status: 'active' | 'maintenance' | 'listed' | 'sold';
  image_url: string | null;
  created_at: string;
  profiles?: { display_name: string };
}

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  mileage_at: number;
  cost: number;
  provider: string | null;
  date: string;
  next_due_mileage: number | null;
  next_due_date: string | null;
}

interface Expense {
  id: string;
  vehicle_id: string;
  type: 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'parking' | 'other';
  amount: number;
  description: string;
  date: string;
}

type VehicleTab = 'overview' | 'maintenance' | 'expenses' | 'documents';

const FUEL_ICONS: Record<string, string> = { gas: '⛽', diesel: '🛢️', electric: '🔋', hybrid: '⚡' };

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<VehicleTab>('overview');

  // Add maintenance form
  const [showAddMaint, setShowAddMaint] = useState(false);
  const [maintType, setMaintType] = useState('Oil Change');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintMileage, setMaintMileage] = useState('');
  const [adding, setAdding] = useState(false);

  // Add expense form
  const [showAddExp, setShowAddExp] = useState(false);
  const [expType, setExpType] = useState<Expense['type']>('fuel');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const { user } = useAppStore();

  useEffect(() => { loadVehicle(); }, [vehicleId]);

  async function loadVehicle() {
    setLoading(true);
    const supabase = createClient();

    const { data: v } = await supabase
      .from('vehicles')
      .select('*, profiles!vehicles_owner_id_fkey(display_name)')
      .eq('id', vehicleId)
      .single();
    if (v) setVehicle(v as any);

    const { data: m } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false })
      .limit(20);
    if (m) setMaintenance(m);

    const { data: e } = await supabase
      .from('vehicle_expenses')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false })
      .limit(30);
    if (e) setExpenses(e);

    setLoading(false);
  }

  async function addMaintenance() {
    if (!maintType || !maintMileage) return;
    setAdding(true);
    const supabase = createClient();
    await supabase.from('vehicle_maintenance').insert({
      vehicle_id: vehicleId, type: maintType, description: maintDesc.trim(),
      mileage_at: parseInt(maintMileage), cost: parseFloat(maintCost) || 0,
      date: new Date().toISOString().split('T')[0],
    });
    // Update vehicle mileage
    if (vehicle && parseInt(maintMileage) > vehicle.mileage) {
      await supabase.from('vehicles').update({ mileage: parseInt(maintMileage) }).eq('id', vehicleId);
    }
    setMaintType('Oil Change'); setMaintDesc(''); setMaintCost(''); setMaintMileage('');
    setShowAddMaint(false); setAdding(false);
    loadVehicle();
  }

  async function addExpense() {
    if (!expAmount) return;
    const supabase = createClient();
    await supabase.from('vehicle_expenses').insert({
      vehicle_id: vehicleId, type: expType, amount: parseFloat(expAmount),
      description: expDesc.trim(), date: new Date().toISOString().split('T')[0],
    });
    setExpAmount(''); setExpDesc(''); setShowAddExp(false);
    loadVehicle();
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const fuelCost = expenses.filter(e => e.type === 'fuel').reduce((s, e) => s + e.amount, 0);
  const maintCostTotal = expenses.filter(e => e.type === 'maintenance').reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-6 w-32" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-32" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/auto" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Auto</Link>
        <div className="card text-center py-8">
          <p className="text-sm text-gray-500">Vehicle not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/auto" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Auto</Link>

      {/* Vehicle Header */}
      <div className="card">
        <div className="aspect-video bg-gray-100 dark:bg-harbor-800 rounded-xl flex items-center justify-center mb-3">
          {vehicle.image_url ? (
            <img src={vehicle.image_url} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <span className="text-6xl">🚗</span>
          )}
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{vehicle.color}</span>
              <span>·</span>
              <span>{FUEL_ICONS[vehicle.fuel_type]} {vehicle.fuel_type}</span>
              <span>·</span>
              <span>{vehicle.mileage.toLocaleString()} mi</span>
            </div>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded capitalize',
            vehicle.status === 'active' ? 'bg-green-100 text-green-700' :
            vehicle.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-600'
          )}>{vehicle.status}</span>
        </div>
        {vehicle.license_plate && <p className="text-xs text-gray-400 mt-2">Plate: {vehicle.license_plate}</p>}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">${totalExpenses.toFixed(0)}</p>
          <p className="text-[10px] text-gray-500">Total Spent</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-orange-600">${fuelCost.toFixed(0)}</p>
          <p className="text-[10px] text-gray-500">Fuel</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-teal-600">{maintenance.length}</p>
          <p className="text-[10px] text-gray-500">Services</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['overview', 'maintenance', 'expenses', 'documents'] as VehicleTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Make:</span> <span className="text-harbor-800 dark:text-white ml-1">{vehicle.make}</span></div>
              <div><span className="text-gray-500">Model:</span> <span className="text-harbor-800 dark:text-white ml-1">{vehicle.model}</span></div>
              <div><span className="text-gray-500">Year:</span> <span className="text-harbor-800 dark:text-white ml-1">{vehicle.year}</span></div>
              <div><span className="text-gray-500">Color:</span> <span className="text-harbor-800 dark:text-white ml-1">{vehicle.color}</span></div>
              <div><span className="text-gray-500">Fuel:</span> <span className="text-harbor-800 dark:text-white ml-1 capitalize">{vehicle.fuel_type}</span></div>
              <div><span className="text-gray-500">Mileage:</span> <span className="text-harbor-800 dark:text-white ml-1">{vehicle.mileage.toLocaleString()}</span></div>
              {vehicle.vin && <div className="col-span-2"><span className="text-gray-500">VIN:</span> <span className="text-harbor-800 dark:text-white ml-1 font-mono text-[10px]">{vehicle.vin}</span></div>}
            </div>
          </div>

          {/* Upcoming maintenance */}
          {maintenance.filter(m => m.next_due_date).length > 0 && (
            <div className="card border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
              <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-2">⚠️ Upcoming Service</h3>
              {maintenance.filter(m => m.next_due_date).slice(0, 3).map(m => (
                <p key={m.id} className="text-xs text-orange-600">{m.type} — Due {new Date(m.next_due_date!).toLocaleDateString()}{m.next_due_mileage ? ` or ${m.next_due_mileage.toLocaleString()} mi` : ''}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {tab === 'maintenance' && (
        <div className="space-y-3">
          {!showAddMaint ? (
            <button onClick={() => setShowAddMaint(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ Log Service</button>
          ) : (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <select value={maintType} onChange={e => setMaintType(e.target.value)} className="input-field">
                {['Oil Change', 'Tire Rotation', 'Brakes', 'Battery', 'Transmission', 'Inspection', 'Alignment', 'AC Service', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input value={maintDesc} onChange={e => setMaintDesc(e.target.value)} placeholder="Notes (optional)" className="input-field" />
              <div className="grid grid-cols-2 gap-2">
                <input value={maintMileage} onChange={e => setMaintMileage(e.target.value)} placeholder="Mileage" className="input-field" type="number" />
                <input value={maintCost} onChange={e => setMaintCost(e.target.value)} placeholder="Cost ($MLY)" className="input-field" type="number" />
              </div>
              <div className="flex gap-2">
                <button onClick={addMaintenance} disabled={!maintMileage || adding} className="btn-teal flex-1 disabled:opacity-50">{adding ? 'Saving...' : 'Log Service'}</button>
                <button onClick={() => setShowAddMaint(false)} className="px-4 py-2 text-xs bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {maintenance.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No maintenance records yet</p>
            </div>
          ) : maintenance.map(m => (
            <div key={m.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-harbor-800 flex items-center justify-center text-sm">🔧</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{m.type}</p>
                <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()} · {m.mileage_at.toLocaleString()} mi</p>
              </div>
              <p className="text-xs font-bold text-harbor-800 dark:text-white">${m.cost.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          {!showAddExp ? (
            <button onClick={() => setShowAddExp(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ Add Expense</button>
          ) : (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <select value={expType} onChange={e => setExpType(e.target.value as any)} className="input-field">
                <option value="fuel">⛽ Fuel</option>
                <option value="maintenance">🔧 Maintenance</option>
                <option value="insurance">🛡️ Insurance</option>
                <option value="registration">📋 Registration</option>
                <option value="parking">🅿️ Parking</option>
                <option value="other">📄 Other</option>
              </select>
              <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount ($MLY)" className="input-field" type="number" />
              <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Description" className="input-field" />
              <div className="flex gap-2">
                <button onClick={addExpense} disabled={!expAmount} className="btn-teal flex-1 disabled:opacity-50">Add</button>
                <button onClick={() => setShowAddExp(false)} className="px-4 py-2 text-xs bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {expenses.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-500">No expenses tracked yet</p>
            </div>
          ) : expenses.map(e => (
            <div key={e.id} className="card flex items-center gap-3 py-2.5">
              <span className="text-lg">{e.type === 'fuel' ? '⛽' : e.type === 'maintenance' ? '🔧' : e.type === 'insurance' ? '🛡️' : '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white capitalize">{e.type}{e.description ? `: ${e.description}` : ''}</p>
                <p className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</p>
              </div>
              <p className="text-xs font-bold text-harbor-800 dark:text-white">${e.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div className="space-y-3">
          {['Insurance Card', 'Registration', 'Title', 'Service Records'].map(doc => (
            <div key={doc} className="card flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{doc}</p>
                <p className="text-xs text-gray-500">Not uploaded</p>
              </div>
              <button className="text-xs text-teal-600">Upload</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
