'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';

export default function PocketPage() {
  const { user } = useAppStore();

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Wallet Card */}
      <div className="card bg-gradient-to-br from-harbor-800 via-harbor-700 to-teal-600 text-white p-6 rounded-2xl">
        <p className="text-xs text-harbor-200">$MLY Balance</p>
        <p className="text-4xl font-bold mt-1">${user?.mly_balance?.toFixed(0) ?? '0'}</p>
        <p className="text-xs text-harbor-300 mt-1">1 MLY = $1 USD</p>
        <div className="flex gap-3 mt-5">
          <Link href="/wallet" className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">
            Send
          </Link>
          <Link href="/wallet" className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">
            Receive
          </Link>
          <Link href="/profile/transactions" className="flex-1 py-2.5 bg-white/20 rounded-xl text-center text-sm font-medium hover:bg-white/30 transition-colors">
            History
          </Link>
        </div>
      </div>

      {/* Pocket Apps */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">Earn & Spend</h2>

        <Link href="/shop" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <span className="text-2xl w-10 text-center">🛍️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">MiShop</p>
            <p className="text-xs text-gray-500">Buy & sell goods with $MLY</p>
          </div>
        </Link>

        <Link href="/jobs" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <span className="text-2xl w-10 text-center">💼</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Jobs & Gigs</p>
            <p className="text-xs text-gray-500">Post work, hire, get hired</p>
          </div>
        </Link>

        <Link href="/aid" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <span className="text-2xl w-10 text-center">🤝</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Mutual Aid</p>
            <p className="text-xs text-gray-500">Help neighbors, earn $15 MLY per assist</p>
          </div>
          <span className="text-[10px] font-bold text-mly-600 bg-mly-50 dark:bg-mly-900/20 px-2 py-0.5 rounded-full">+$15</span>
        </Link>

        <Link href="/media" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <span className="text-2xl w-10 text-center">🎬</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">MiMedia</p>
            <p className="text-xs text-gray-500">Video, music, radio, podcasts</p>
          </div>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">New</span>
        </Link>

        <Link href="/business" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <span className="text-2xl w-10 text-center">🏪</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Business Hub</p>
            <p className="text-xs text-gray-500">Register, directory, accept $MLY</p>
          </div>
        </Link>

        <Link href="/wallet/exchange" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <span className="text-2xl w-10 text-center">💱</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Exchange Board</p>
            <p className="text-xs text-gray-500">Buy/sell $MLY peer-to-peer. No middleman.</p>
          </div>
        </Link>
      </div>

      {/* UBI Info */}
      <div className="card bg-mly-50 dark:bg-mly-900/20 border-mly-200 dark:border-mly-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Daily UBI: +$10 MLY</p>
            <p className="text-xs text-gray-500">Stay active (check-in or report) to receive daily.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
