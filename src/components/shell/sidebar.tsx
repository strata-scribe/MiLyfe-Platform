'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store/app-store';
import { StandingBadge } from '@/components/ui/standing-badge';

interface NavSection {
  label: string;
  items: { href: string; icon: string; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'City',
    items: [
      { href: '/city', icon: '🚨', label: 'Report' },
      { href: '/city/projects', icon: '🔧', label: 'Projects' },
      { href: '/govern', icon: '🗳️', label: 'Govern' },
      { href: '/nav', icon: '🗺️', label: 'Navigate' },
      { href: '/broadcast', icon: '📢', label: 'Alerts' },
    ],
  },
  {
    label: 'Social',
    items: [
      { href: '/social', icon: '📱', label: 'Feed' },
      { href: '/forum', icon: '💬', label: 'Forum' },
      { href: '/connect', icon: '✉️', label: 'Messages' },
      { href: '/media', icon: '🎬', label: 'Media' },
      { href: '/news', icon: '📰', label: 'News' },
      { href: '/record', icon: '📹', label: 'Record' },
    ],
  },
  {
    label: 'Pocket',
    items: [
      { href: '/wallet', icon: '💰', label: 'Wallet' },
      { href: '/market', icon: '🛒', label: 'Market' },
      { href: '/shop', icon: '🛍️', label: 'Shop' },
      { href: '/auto', icon: '🚗', label: 'Auto' },
      { href: '/housing', icon: '🏠', label: 'Housing' },
      { href: '/mihome', icon: '🏡', label: 'MiHome' },
    ],
  },
  {
    label: 'You',
    items: [
      { href: '/health', icon: '❤️', label: 'Health' },
      { href: '/learn', icon: '📚', label: 'Learn' },
      { href: '/career', icon: '💼', label: 'Career' },
      { href: '/twin', icon: '🪞', label: 'Twin' },
      { href: '/achievements', icon: '🏆', label: 'Badges' },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/wiki', icon: '📖', label: 'Wiki' },
      { href: '/academia', icon: '🔬', label: 'Research' },
      { href: '/dev-portal', icon: '🛠️', label: 'Develop' },
      { href: '/transparency', icon: '📊', label: 'Stats' },
      { href: '/tokenomics', icon: '📈', label: 'Economy' },
      { href: '/constitution/interactive', icon: '📜', label: 'Constitution' },
      { href: '/finance', icon: '🏦', label: 'Finance' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 bg-white dark:bg-harbor-950 border-r border-gray-100 dark:border-harbor-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56 lg:w-60'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-harbor-800 flex-shrink-0">
        <Link href="/home" className="flex items-center gap-2">
          <img src="/logo.png" alt="MiLyfe" className="h-7 w-auto" />
          {!collapsed && <span className="text-sm font-bold text-harbor-800 dark:text-white">MiLyfe</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-400 hover:text-gray-600 hidden lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User quick info */}
      {user && !collapsed && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-harbor-800 flex-shrink-0">
          <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{user.display_name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-mly-600 font-bold">${user.mly_balance?.toFixed(0)} MLY</span>
            <StandingBadge compact />
          </div>
        </div>
      )}

      {/* Home link */}
      <div className="px-2 pt-3 flex-shrink-0">
        <Link
          href="/home"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
            pathname === '/home'
              ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-harbor-900'
          )}
        >
          <span className="text-lg">🏠</span>
          {!collapsed && <span className="text-sm font-medium">Home</span>}
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-hide">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                      active
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-harbor-900 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + Profile */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-harbor-800 flex-shrink-0 space-y-0.5">
        <Link href="/settings" className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-harbor-900', pathname.startsWith('/settings') && 'bg-gray-50 dark:bg-harbor-900')}>
          <span className="text-base">⚙️</span>{!collapsed && <span>Settings</span>}
        </Link>
        <Link href="/profile" className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-harbor-900', pathname.startsWith('/profile') && 'bg-gray-50 dark:bg-harbor-900')}>
          <span className="text-base">👤</span>{!collapsed && <span>Profile</span>}
        </Link>
      </div>
    </aside>
  );
}
