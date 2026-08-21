'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';

export function TopBar() {
  const { user, unreadCount, toggleDarkMode } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-harbor-950/90 backdrop-blur-lg border-b border-gray-100 dark:border-harbor-800">
      <div className="flex items-center justify-between max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto h-14 px-4 md:px-6">
        {/* Brand */}
        <Link href="/home" className="flex items-center gap-2">
          <img src="/logo.png" alt="MiLyfe" className="h-7 w-auto" />
        </Link>

        {/* Balance */}
        <div className="flex items-center gap-1 bg-mly-50 dark:bg-mly-900/20 px-3 py-1.5 rounded-full">
          <span className="text-sm font-bold text-mly-700 dark:text-mly-400">
            ${user?.mly_balance?.toFixed(0) ?? '0'} MLY
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            🌓
          </button>

          <Link
            href="/profile"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
            aria-label="Your profile"
          >
            👤
          </Link>
        </div>
      </div>
    </header>
  );
}
