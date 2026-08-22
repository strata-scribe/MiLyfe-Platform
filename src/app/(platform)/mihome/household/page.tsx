'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Chore {
  id: string;
  home_id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  assigned_to: string | null;
  last_completed: string | null;
  next_due: string | null;
  points: number;
}

interface ShoppingItem {
  id: string;
  home_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  added_by: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  home_id: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string | null;
  location: string;
  low_threshold: number;
}

type HouseholdTab = 'chores' | 'shopping' | 'inventory';

const SHOP_CATEGORIES = ['Groceries', 'Cleaning', 'Personal', 'Household', 'Pet', 'Other'];
const CHORE_FREQ_LABELS: Record<string, string> = { daily: 'Every Day', weekly: 'Every Week', biweekly: 'Every 2 Weeks', monthly: 'Monthly' };

export default function HouseholdPage() {
  const [tab, setTab] = useState<HouseholdTab>('chores');
  const [chores, setChores] = useState<Chore[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Chore form
  const [showAddChore, setShowAddChore] = useState(false);
  const [choreTitle, setChoreTitle] = useState('');
  const [choreFreq, setChoreFreq] = useState<Chore['frequency']>('weekly');
  const [chorePoints, setChorePoints] = useState('5');

  // Shopping form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Groceries');
  const [itemQty, setItemQty] = useState('1');

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: c } = await supabase.from('mihome_chores').select('*').order('next_due', { ascending: true });
    if (c) setChores(c);
    const { data: s } = await supabase.from('mihome_shopping').select('*').eq('purchased', false).order('created_at', { ascending: false });
    if (s) setShopping(s);
    const { data: inv } = await supabase.from('mihome_inventory').select('*').order('name');
    if (inv) setInventory(inv);
    setLoading(false);
  }

  async function addChore() {
    if (!user || !choreTitle.trim()) return;
    const supabase = createClient();
    await supabase.from('mihome_chores').insert({
      home_id: null, title: choreTitle.trim(), frequency: choreFreq,
      assigned_to: user.id, points: parseInt(chorePoints) || 5,
      next_due: new Date().toISOString(),
    });
    setChoreTitle(''); setShowAddChore(false); loadData();
  }

  async function completeChore(choreId: string) {
    const supabase = createClient();
    await supabase.from('mihome_chores').update({
      last_completed: new Date().toISOString(),
    }).eq('id', choreId);
    setChores(prev => prev.map(c => c.id === choreId ? { ...c, last_completed: new Date().toISOString() } : c));
  }

  async function addShoppingItem() {
    if (!user || !itemName.trim()) return;
    const supabase = createClient();
    await supabase.from('mihome_shopping').insert({
      home_id: null, name: itemName.trim(), category: itemCategory,
      quantity: parseInt(itemQty) || 1, unit: 'ea', purchased: false, added_by: user.id,
    });
    setItemName(''); loadData();
  }

  async function togglePurchased(itemId: string) {
    const supabase = createClient();
    await supabase.from('mihome_shopping').update({ purchased: true }).eq('id', itemId);
    setShopping(prev => prev.filter(i => i.id !== itemId));
  }

  const lowStock = inventory.filter(i => i.quantity <= i.low_threshold);

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Household</h1>
        <p className="text-xs text-gray-500">Chores, shopping & inventory</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['chores', 'shopping', 'inventory'] as HouseholdTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>
            {t === 'shopping' ? `🛒 ${shopping.length}` : t === 'chores' ? `📋 ${chores.length}` : `📦 ${inventory.length}`}
          </button>
        ))}
      </div>

      {/* Chores Tab */}
      {tab === 'chores' && (
        <div className="space-y-3">
          {!showAddChore ? (
            <button onClick={() => setShowAddChore(true)} className="card w-full text-center py-3 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 border-2 border-dashed border-gray-200 dark:border-harbor-700">+ Add Chore</button>
          ) : (
            <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
              <input value={choreTitle} onChange={e => setChoreTitle(e.target.value)} placeholder="Chore name" className="input-field" />
              <div className="flex gap-2">
                <select value={choreFreq} onChange={e => setChoreFreq(e.target.value as any)} className="input-field flex-1">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input value={chorePoints} onChange={e => setChorePoints(e.target.value)} placeholder="Points" className="input-field w-20" type="number" />
              </div>
              <div className="flex gap-2">
                <button onClick={addChore} disabled={!choreTitle.trim()} className="btn-teal flex-1 disabled:opacity-50">Add</button>
                <button onClick={() => setShowAddChore(false)} className="px-4 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            chores.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm text-gray-500">No chores set up yet</p>
              </div>
            ) : chores.map(chore => (
              <div key={chore.id} className="card flex items-center gap-3">
                <button onClick={() => completeChore(chore.id)} className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-teal-500 hover:bg-teal-50 flex items-center justify-center transition-colors">
                  {chore.last_completed && new Date(chore.last_completed).toDateString() === new Date().toDateString() && <span className="text-teal-500 text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{chore.title}</p>
                  <p className="text-xs text-gray-500">{CHORE_FREQ_LABELS[chore.frequency]}</p>
                </div>
                <span className="text-xs text-mly-600 font-bold">+{chore.points} MLY</span>
              </div>
            ))
          }
        </div>
      )}

      {/* Shopping Tab */}
      {tab === 'shopping' && (
        <div className="space-y-3">
          <div className="card flex gap-2">
            <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Add item..." className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && addShoppingItem()} />
            <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="input-field w-auto text-xs">
              {SHOP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addShoppingItem} disabled={!itemName.trim()} className="btn-teal text-xs disabled:opacity-50">Add</button>
          </div>

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-12" />) :
            shopping.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🛒</p>
                <p className="text-sm text-gray-500">Shopping list is empty</p>
              </div>
            ) : (
              <div className="card divide-y divide-gray-100 dark:divide-harbor-800">
                {shopping.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <button onClick={() => togglePurchased(item.id)} className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-teal-500 transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-harbor-800 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.category} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          {lowStock.length > 0 && (
            <div className="card border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
              <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-2">⚠️ Low Stock ({lowStock.length})</h3>
              <div className="space-y-1">
                {lowStock.map(item => (
                  <p key={item.id} className="text-xs text-orange-600 dark:text-orange-300">{item.name} — {item.quantity} left</p>
                ))}
              </div>
            </div>
          )}

          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-14" />) :
            inventory.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📦</p>
                <p className="text-sm text-gray-500">No inventory tracked yet</p>
                <p className="text-xs text-gray-400 mt-1">Track household supplies, pantry items, and more</p>
              </div>
            ) : inventory.map(item => (
              <div key={item.id} className="card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category} · {item.location}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold', item.quantity <= item.low_threshold ? 'text-orange-600' : 'text-harbor-800 dark:text-white')}>{item.quantity}</p>
                  {item.expiry_date && <p className="text-[10px] text-gray-400">Exp {new Date(item.expiry_date).toLocaleDateString()}</p>}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
