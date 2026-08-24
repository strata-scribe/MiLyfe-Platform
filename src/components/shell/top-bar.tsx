'use client';

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function TopBar() {
  const { toggleSearch } = useAppStore();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-harbor-950 border-b border-gray-100 dark:border-harbor-800">
      <div className="flex items-center justify-between h-full px-4">
        <Link href="/home" className="flex items-center gap-1 min-h-0 min-w-0">
          <span className="text-lg font-bold text-harbor-800 dark:text-white">Mi</span>
          <span className="text-lg font-bold text-teal-500">Lyfe</span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleSearch}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </button>
          <Link
            href="/notifications"
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
