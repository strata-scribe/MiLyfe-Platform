'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';

export default function YouPage() {
  const { user } = useAppStore();

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Profile Card */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-harbor-800 via-teal-500 to-mly-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-white">
            {user?.display_name?.charAt(0)?.toUpperCase() ?? 'M'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-harbor-800 dark:text-white truncate">
            {user?.display_name ?? 'Neighbor'}
          </p>
          <p className="text-xs text-gray-500">{user?.city ?? 'Jacksonville'}</p>
          <p className="text-xs text-mly-600 font-medium">${user?.mly_balance?.toFixed(0) ?? 0} MLY</p>
        </div>
        <Link href="/profile" className="text-xs text-teal-500 font-medium">
          Edit →
        </Link>
      </div>

      {/* Your Apps */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">Your Space</h2>

        {[
          { href: '/profile', icon: '⚙️', name: 'Profile & Settings', desc: 'Edit info, safety mode, sign out' },
          { href: '/vault', icon: '🔐', name: 'MiVault', desc: 'Documents, credentials, shares' },
          { href: '/connect', icon: '💬', name: 'MiConnect', desc: 'Messages, groups, neighbors' },
          { href: '/media', icon: '🎬', name: 'MiMedia', desc: 'Your content, channels, playlists' },
          { href: '/notifications', icon: '🔔', name: 'Notifications', desc: 'Alerts, updates, UBI drops' },
          { href: '/safety', icon: '🛡️', name: 'Safety', desc: 'Check-in, contacts, emergency' },
        ].map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            <span className="text-2xl w-10 text-center">{app.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">{app.name}</p>
              <p className="text-xs text-gray-500 truncate">{app.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Standing */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Community Standing</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-harbor-800 rounded-full h-3">
              <div className="bg-teal-500 h-3 rounded-full" style={{ width: '50%' }} />
            </div>
          </div>
          <span className="text-sm font-bold text-harbor-800 dark:text-white">Level 2</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Earn standing through participation. Unlocks features at higher levels.</p>
      </div>

      {/* Admin (if applicable) */}
      <Link href="/admin" className="card flex items-center gap-4 bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700 hover:scale-[1.02] transition-transform">
        <span className="text-2xl w-10 text-center">🛠️</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-harbor-800 dark:text-white">Admin Dashboard</p>
          <p className="text-xs text-gray-500">Moderate, manage, distribute UBI</p>
        </div>
      </Link>
    </div>
  );
}
