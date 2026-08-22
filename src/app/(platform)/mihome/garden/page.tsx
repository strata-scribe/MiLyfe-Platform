'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Plant {
  id: string;
  home_id: string;
  name: string;
  species: string | null;
  location: 'indoor' | 'outdoor' | 'balcony' | 'greenhouse';
  type: 'vegetable' | 'fruit' | 'herb' | 'flower' | 'tree' | 'succulent';
  water_frequency: number; // days
  last_watered: string | null;
  last_fertilized: string | null;
  planted_date: string;
  notes: string | null;
  health: 'thriving' | 'healthy' | 'needs_attention' | 'struggling';
  image_url: string | null;
}

interface GardenTask {
  id: string;
  home_id: string;
  title: string;
  type: 'water' | 'fertilize' | 'prune' | 'harvest' | 'plant' | 'weed' | 'other';
  due_date: string;
  plant_id: string | null;
  completed: boolean;
}

type GardenTab = 'plants' | 'tasks' | 'calendar';

const PLANT_ICONS: Record<string, string> = {
  vegetable: '🥬', fruit: '🍓', herb: '🌿', flower: '🌺', tree: '🌳', succulent: '🪴',
};

const HEALTH_COLORS: Record<string, string> = {
  thriving: 'text-green-600', healthy: 'text-teal-600', needs_attention: 'text-orange-600', struggling: 'text-red-600',
};

export default function GardenPage() {
  const [tab, setTab] = useState<GardenTab>('plants');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [tasks, setTasks] = useState<GardenTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form
  const [pName, setPName] = useState('');
  const [pSpecies, setPSpecies] = useState('');
  const [pType, setPType] = useState<Plant['type']>('flower');
  const [pLocation, setPLocation] = useState<Plant['location']>('outdoor');
  const [pWaterFreq, setPWaterFreq] = useState('3');
  const [adding, setAdding] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: p } = await supabase.from('mihome_plants').select('*').order('name');
    if (p) setPlants(p);
    const { data: t } = await supabase.from('mihome_garden_tasks').select('*').eq('completed', false).order('due_date');
    if (t) setTasks(t);
    setLoading(false);
  }

  async function addPlant() {
    if (!user || !pName.trim()) return;
    setAdding(true);
    const supabase = createClient();
    await supabase.from('mihome_plants').insert({
      home_id: null, name: pName.trim(), species: pSpecies.trim() || null,
      location: pLocation, type: pType, water_frequency: parseInt(pWaterFreq) || 3,
      planted_date: new Date().toISOString(), health: 'healthy', last_watered: new Date().toISOString(),
    });
    setPName(''); setPSpecies(''); setShowAdd(false); setAdding(false);
    loadData();
  }

  async function waterPlant(plantId: string) {
    const supabase = createClient();
    const now = new Date().toISOString();
    await supabase.from('mihome_plants').update({ last_watered: now }).eq('id', plantId);
    setPlants(prev => prev.map(p => p.id === plantId ? { ...p, last_watered: now } : p));
  }

  async function completeTask(taskId: string) {
    const supabase = createClient();
    await supabase.from('mihome_garden_tasks').update({ completed: true }).eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  function needsWater(plant: Plant): boolean {
    if (!plant.last_watered) return true;
    const daysSince = Math.floor((Date.now() - new Date(plant.last_watered).getTime()) / 86400000);
    return daysSince >= plant.water_frequency;
  }

  const needsWaterCount = plants.filter(needsWater).length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Garden</h1>
          <p className="text-xs text-gray-500">{plants.length} plants · {needsWaterCount} need water</p>
        </div>
        {user && <button onClick={() => setShowAdd(!showAdd)} className="btn-teal text-xs">+ Plant</button>}
      </div>

      {needsWaterCount > 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400">💧 {needsWaterCount} plant{needsWaterCount !== 1 ? 's' : ''} need watering</p>
        </div>
      )}

      {/* Add Plant */}
      {showAdd && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Add Plant</h3>
          <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Plant name" className="input-field" />
          <input value={pSpecies} onChange={e => setPSpecies(e.target.value)} placeholder="Species (optional)" className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <select value={pType} onChange={e => setPType(e.target.value as any)} className="input-field">
              {Object.entries(PLANT_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
            </select>
            <select value={pLocation} onChange={e => setPLocation(e.target.value as any)} className="input-field">
              <option value="indoor">🏠 Indoor</option>
              <option value="outdoor">🌳 Outdoor</option>
              <option value="balcony">🏗️ Balcony</option>
              <option value="greenhouse">🏡 Greenhouse</option>
            </select>
          </div>
          <input value={pWaterFreq} onChange={e => setPWaterFreq(e.target.value)} placeholder="Water every X days" className="input-field" type="number" />
          <button onClick={addPlant} disabled={!pName.trim() || adding} className="btn-teal w-full disabled:opacity-50">
            {adding ? 'Adding...' : 'Add Plant'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['plants', 'tasks', 'calendar'] as GardenTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Plants Tab */}
      {tab === 'plants' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            plants.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🌱</p>
                <p className="text-sm text-gray-500">No plants yet — start your garden!</p>
              </div>
            ) : plants.map(plant => (
              <div key={plant.id} className="card flex items-center gap-3">
                <span className="text-2xl">{PLANT_ICONS[plant.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{plant.name}</p>
                  <p className="text-xs text-gray-500">{plant.species || plant.type} · {plant.location}</p>
                  <p className={cn('text-[10px] capitalize', HEALTH_COLORS[plant.health])}>{plant.health.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  {needsWater(plant) ? (
                    <button onClick={() => waterPlant(plant.id)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">💧 Water</button>
                  ) : (
                    <p className="text-[10px] text-gray-400">Watered ✓</p>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-gray-500">No garden tasks pending</p>
            </div>
          ) : tasks.map(task => (
            <div key={task.id} className="card flex items-center gap-3">
              <button onClick={() => completeTask(task.id)} className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-teal-500 transition-colors flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-harbor-800 dark:text-white">{task.title}</p>
                <p className="text-xs text-gray-500 capitalize">{task.type} · Due {new Date(task.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Tab */}
      {tab === 'calendar' && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Garden Calendar</p>
          <p className="text-xs text-gray-500 mt-1">Planting seasons, harvest times, and care schedules</p>
          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            {['🌱 Spring', '☀️ Summer', '🍂 Fall', '❄️ Winter'].map(s => (
              <div key={s} className="p-2 bg-gray-50 dark:bg-harbor-900 rounded-lg">
                <p className="text-xs">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
