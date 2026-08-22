'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

/**
 * Right contextual panel — visible only on desktop (lg+).
 * Shows: notifications preview, trending topics, Mi AI quick chat, standing progress.
 */
export function RightPanel() {
  const { user, unreadCount } = useAppStore();
  const [miInput, setMiInput] = useState('');
  const [miResponse, setMiResponse] = useState('');
  const [miLoading, setMiLoading] = useState(false);

  async function askMi() {
    if (!miInput.trim()) return;
    setMiLoading(true);
    try {
      const res = await fetch('/api/mi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: miInput, history: [] }),
      });
      const data = await res.json();
      setMiResponse(data.response || 'No response');
    } catch {
      setMiResponse('Mi is unavailable right now.');
    }
    setMiInput('');
    setMiLoading(false);
  }

  return (
    <aside className="hidden lg:block fixed right-0 top-0 bottom-0 w-72 xl:w-80 bg-white dark:bg-harbor-950 border-l border-gray-100 dark:border-harbor-800 overflow-y-auto z-30">
      <div className="p-4 space-y-4">
        {/* Notifications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </div>
          <Link href="/notifications" className="block text-xs text-gray-500 hover:text-teal-600 transition-colors">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up ✓'}
          </Link>
        </div>

        {/* Mi AI Quick Chat */}
        <div className="bg-gray-50 dark:bg-harbor-900 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ask Mi</h3>
          {miResponse && (
            <div className="text-xs text-harbor-800 dark:text-gray-200 bg-white dark:bg-harbor-950 rounded-lg p-2 mb-2 leading-relaxed">
              {miResponse}
            </div>
          )}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={miInput}
              onChange={(e) => setMiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askMi()}
              placeholder="Ask anything..."
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-harbor-950 border border-gray-200 dark:border-harbor-700 outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button onClick={askMi} disabled={miLoading || !miInput.trim()} className="px-2.5 py-2 bg-teal-500 text-white rounded-lg text-xs disabled:opacity-50">
              {miLoading ? '...' : '→'}
            </button>
          </div>
        </div>

        {/* Trending / Community Pulse */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trending</h3>
          <div className="space-y-2">
            {['#jacksonville', '#community', '#milyfe', '#mly', '#civictech'].map((tag) => (
              <Link key={tag} href={`/forum?q=${tag}`} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-teal-600 transition-colors">
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Links</h3>
          <div className="space-y-1.5">
            <Link href="/health" className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-teal-600">❤️ Daily Check-in</Link>
            <Link href="/city" className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-teal-600">🚨 Report Issue</Link>
            <Link href="/wallet" className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-teal-600">💰 Send $MLY</Link>
            <Link href="/learn" className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-teal-600">📚 Courses</Link>
          </div>
        </div>

        {/* Platform Info */}
        <div className="pt-3 border-t border-gray-100 dark:border-harbor-800">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Link href="/transparency" className="hover:text-teal-600">Stats</Link>
            <span>·</span>
            <Link href="/constitution/interactive" className="hover:text-teal-600">Constitution</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-teal-600">Privacy</Link>
          </div>
          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">MiLyfe — Your City. Your Life. Your Platform.</p>
        </div>
      </div>
    </aside>
  );
}
