'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  mly_balance: number;
  city: string;
  neighborhood: string | null;
  role: string;
  safety_mode: boolean;
  health_streak: number;
  trust_score: number;
  created_at: string;
}

interface MlyTx {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [transactions, setTransactions] = useState<MlyTx[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [saving, setSaving] = useState(false);

  // Safety mode
  const [safetyMode, setSafetyMode] = useState(false);

  const { user, setUser } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setEditName(data.display_name);
        setEditCity(data.city);
        setEditNeighborhood(data.neighborhood ?? '');
        setSafetyMode(data.safety_mode);
      }

      // Load recent transactions
      const { data: txs } = await supabase
        .from('mly_transactions')
        .select('*')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txs) setTransactions(txs);

      setLoading(false);
    };

    loadProfile();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editName.trim(),
        city: editCity.trim(),
        neighborhood: editNeighborhood.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => prev ? {
        ...prev,
        display_name: editName.trim(),
        city: editCity.trim(),
        neighborhood: editNeighborhood.trim() || null,
      } : null);

      setUser({
        ...user,
        display_name: editName.trim(),
        city: editCity.trim(),
      });

      setEditing(false);
    }

    setSaving(false);
  };

  const handleToggleSafety = async () => {
    if (!user) return;

    const newMode = !safetyMode;
    setSafetyMode(newMode);

    await supabase
      .from('profiles')
      .update({ safety_mode: newMode })
      .eq('id', user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.')) return;
    if (!confirm('Really sure? Last chance.')) return;

    // Sign out (actual deletion would need a server-side function)
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Profile Header */}
      <section className="card text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-harbor-800 via-teal-500 to-mly-500 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-white">
            {profile?.display_name?.charAt(0)?.toUpperCase() ?? 'M'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">
          {profile?.display_name ?? 'Neighbor'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {profile?.city}{profile?.neighborhood ? ` · ${profile.neighborhood}` : ''}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-harbor-800">
          <div>
            <p className="text-lg font-bold text-mly-600">{profile?.mly_balance?.toFixed(0) ?? 0}</p>
            <p className="text-xs text-gray-500">$MLY</p>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-500">{profile?.health_streak ?? 0}</p>
            <p className="text-xs text-gray-500">Streak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{profile?.trust_score ?? 50}</p>
            <p className="text-xs text-gray-500">Trust</p>
          </div>
        </div>
      </section>

      {/* Edit Profile */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Info</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-teal-500 font-medium">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field !py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="input-field !py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Neighborhood (optional)</label>
              <input
                type="text"
                value={editNeighborhood}
                onChange={(e) => setEditNeighborhood(e.target.value)}
                className="input-field !py-2 text-sm"
                placeholder="e.g., Northside"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-teal flex-1 text-sm !py-2">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-primary flex-1 text-sm !py-2">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-harbor-800 dark:text-gray-200">{profile?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="text-harbor-800 dark:text-gray-200 capitalize">{profile?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">City</span>
              <span className="text-harbor-800 dark:text-gray-200">{profile?.city}</span>
            </div>
            {profile?.neighborhood && (
              <div className="flex justify-between">
                <span className="text-gray-500">Neighborhood</span>
                <span className="text-harbor-800 dark:text-gray-200">{profile.neighborhood}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* $MLY Activity */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent $MLY Activity</h2>
          <Link href="/profile/transactions" className="text-xs text-teal-500 font-medium">
            View all →
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                <div>
                  <p className="text-sm text-harbor-800 dark:text-gray-200">{tx.description || tx.type}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'earn' || tx.type === 'ubi' ? 'text-teal-500' : 'text-red-400'}`}>
                  {tx.type === 'earn' || tx.type === 'ubi' ? '+' : '-'}{tx.amount} MLY
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settings */}
      <section className="card space-y-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Settings</h2>

        {/* Safety Mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Safety Mode</p>
            <p className="text-xs text-gray-500">Hide your profile from searches. One tap to disappear.</p>
          </div>
          <button
            onClick={handleToggleSafety}
            className={`w-12 h-7 rounded-full transition-colors relative ${safetyMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-harbor-700'}`}
            role="switch"
            aria-checked={safetyMode}
            aria-label="Toggle safety mode"
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${safetyMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {safetyMode && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              🛡️ Safety Mode Active — Your profile is hidden from neighbor searches and community visibility. Only direct message contacts can reach you.
            </p>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <button onClick={handleLogout} className="btn-primary w-full">
          Sign Out
        </button>

        <button
          onClick={handleDeleteAccount}
          className="w-full py-3 px-6 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete My Account
        </button>
      </section>

      <p className="text-center text-xs text-gray-400 pb-4">
        MiLyfe v0.1.0 — Community-owned. People-powered.
      </p>
    </div>
  );
}
