'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  eligibility: string | null;
  verified: boolean;
}

const categories = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'food', label: 'Food', icon: '🍽️' },
  { key: 'shelter', label: 'Shelter', icon: '🏠' },
  { key: 'health', label: 'Health', icon: '🏥' },
  { key: 'mental_health', label: 'Mental Health', icon: '🧠' },
  { key: 'legal', label: 'Legal', icon: '⚖️' },
  { key: 'employment', label: 'Jobs', icon: '💼' },
  { key: 'youth', label: 'Youth', icon: '🧑‍🎓' },
  { key: 'domestic_violence', label: 'DV Support', icon: '🛡️' },
  { key: 'substance', label: 'Recovery', icon: '💚' },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      let query = supabase.from('resources').select('*').order('verified', { ascending: false }).order('name');
      if (filter !== 'all') query = query.eq('category', filter);
      const { data } = await query;
      if (data) setResources(data);
      setLoading(false);
    };
    load();
  }, [filter, supabase]);

  const filtered = search
    ? resources.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
    : resources;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Resource Directory</h1>
        <p className="text-xs text-gray-500">Free services for Jacksonville residents. Verified by MiLyfe.</p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field !py-2.5 text-sm"
        placeholder="Search resources..."
      />

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => { setFilter(cat.key); setLoading(true); }}
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              filter === cat.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        [1, 2, 3, 4].map((i) => <div key={i} className="card skeleton h-24" />)
      ) : filtered.length === 0 ? (
        <div className="text-center py-12"><p className="text-4xl mb-2">📋</p><p className="text-gray-500">No resources found for this category.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{r.name}</h3>
                    {r.verified && <span className="text-[10px] bg-teal-100 dark:bg-teal-900/30 text-teal-600 px-1.5 py-0.5 rounded-full">Verified</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {r.address && <p>📍 {r.address}</p>}
                {r.phone && <p>📞 <a href={`tel:${r.phone}`} className="text-teal-500 underline">{r.phone}</a></p>}
                {r.hours && <p>🕐 {r.hours}</p>}
                {r.eligibility && <p>✓ {r.eligibility}</p>}
              </div>

              <div className="flex gap-2">
                {r.phone && (
                  <a href={`tel:${r.phone}`} className="btn-teal flex-1 text-center text-xs !py-2">Call</a>
                )}
                {r.address && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(r.address)}`} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-center text-xs !py-2">
                    Directions
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emergency Banner */}
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <p className="text-sm font-bold text-red-700 dark:text-red-400">In immediate danger?</p>
        <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">Call 911 · Mental health crisis: 988 · DV hotline: 1-800-799-7233</p>
      </div>
    </div>
  );
}
