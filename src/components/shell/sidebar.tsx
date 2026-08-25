'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Wallet,
  Gift,
  Star,
  Landmark,
  Newspaper,
  MessageCircle,
  Heart,
  BookOpen,
  User,
  Grid3X3,
  Trophy,
  GraduationCap,
  Store,
  Shield,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store';
import { NotificationBell } from './notification-bell';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/wallet', label: 'Pocket', icon: Wallet },
  { href: '/learn', label: 'Learn', icon: GraduationCap },
  { href: '/street', label: 'Street', icon: Store },
  { href: '/governance', label: 'Voice', icon: Landmark },
  { href: '/mi', label: 'Mi', icon: Bot },
  { href: '/connect', label: 'Connect', icon: Users },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/standing', label: 'Standing', icon: Star },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/forum', label: 'Forum', icon: MessageCircle },
  { href: '/health', label: 'Health', icon: Heart },
  { href: '/safety', label: 'Safety', icon: Shield },
  { href: '/wiki', label: 'Wiki', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/bounties', label: 'Bounties', icon: Trophy },
  { href: '/apps', label: 'Apps', icon: Grid3X3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 lg:w-60 flex-col border-r border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950 z-30"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-harbor-800">
        <Link href="/home" className="flex items-center gap-2 min-h-0 min-w-0">
          <span className="text-xl font-bold text-harbor-800 dark:text-white">Mi</span>
          <span className="text-xl font-bold text-teal-500">Lyfe</span>
        </Link>
        <NotificationBell />
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-harbor-900 hover:text-harbor-800 dark:hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-3 border-t border-gray-100 dark:border-harbor-800">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors min-h-[44px]"
          >
            <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300">
              {user.display_name?.slice(0, 2).toUpperCase() || 'MI'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-harbor-800 dark:text-white">
                {user.display_name || user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">@{user.username}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
