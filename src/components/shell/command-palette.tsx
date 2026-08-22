'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { cn } from '@/lib/utils/cn';

/**
 * ⌘K Command Palette — production-ready global search/navigation.
 * Keyboard accessible, fuzzy matching, grouped results.
 */

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAVIGATION_ITEMS = [
  { group: 'Navigate', items: [
    { label: 'Home', href: '/home', icon: '🏠' },
    { label: 'MiHome', href: '/mihome', icon: '🏡' },
    { label: 'Forum', href: '/forum', icon: '💬' },
    { label: 'Market', href: '/market', icon: '🛒' },
    { label: 'News', href: '/news', icon: '📰' },
    { label: 'Social Feed', href: '/social', icon: '📱' },
    { label: 'Wallet', href: '/wallet', icon: '💰' },
    { label: 'Messages', href: '/connect', icon: '✉️' },
    { label: 'Learn', href: '/learn', icon: '📚' },
    { label: 'Map / Navigate', href: '/nav', icon: '🗺️' },
  ]},
  { group: 'Media', items: [
    { label: 'MiTV — Live Streams', href: '/media/tv', icon: '📺' },
    { label: 'MiBlog — Write', href: '/media/blog', icon: '✍️' },
    { label: 'MiVlog — Record', href: '/media/vlog', icon: '📹' },
    { label: 'Podcast', href: '/media/podcast', icon: '🎙️' },
    { label: 'Radio', href: '/media/radio', icon: '📻' },
    { label: 'Creator Analytics', href: '/media/analytics', icon: '📊' },
  ]},
  { group: 'MiHome', items: [
    { label: 'Smart Home', href: '/mihome/smart', icon: '💡' },
    { label: 'Maintenance', href: '/mihome/maintenance', icon: '🔧' },
    { label: 'Household', href: '/mihome/household', icon: '📋' },
    { label: 'Roommates', href: '/mihome/roommates', icon: '👥' },
    { label: 'Security', href: '/mihome/security', icon: '🔒' },
    { label: 'Utilities', href: '/mihome/utilities', icon: '⚡' },
    { label: 'Projects', href: '/mihome/projects', icon: '🏗️' },
    { label: 'Garden', href: '/mihome/garden', icon: '🌱' },
  ]},
  { group: 'City', items: [
    { label: 'Report Issue', href: '/city', icon: '🚨' },
    { label: 'City Projects', href: '/city/projects', icon: '🔧' },
    { label: 'Govern / Vote', href: '/govern', icon: '🗳️' },
    { label: 'Alerts', href: '/broadcast', icon: '📢' },
  ]},
  { group: 'You', items: [
    { label: 'Profile', href: '/profile', icon: '👤' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
    { label: 'Health', href: '/health', icon: '❤️' },
    { label: 'Career', href: '/career', icon: '💼' },
    { label: 'Digital Twin', href: '/twin', icon: '🪞' },
    { label: 'Achievements', href: '/achievements', icon: '🏆' },
    { label: 'Auto', href: '/auto', icon: '🚗' },
  ]},
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const navigate = useCallback((href: string) => {
    router.push(href);
    onOpenChange(false);
  }, [router, onOpenChange]);

  // Close on escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-lg px-4">
        <Command className="rounded-2xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-950 shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-gray-100 dark:border-harbor-800 px-4">
            <span className="text-gray-400 mr-2 text-sm">🔍</span>
            <Command.Input
              placeholder="Search anything... (pages, features, actions)"
              className="flex h-12 w-full rounded-md bg-transparent text-sm text-harbor-800 dark:text-white placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-gray-400 bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>
            {NAVIGATION_ITEMS.map((group) => (
              <Command.Group key={group.group} heading={group.group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
                {group.items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${group.group}`}
                    onSelect={() => navigate(item.href)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-harbor-800 dark:text-white cursor-pointer transition-colors aria-selected:bg-teal-50 dark:aria-selected:bg-teal-900/20 aria-selected:text-teal-700 dark:aria-selected:text-teal-400"
                  >
                    <span className="text-base w-6 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          <div className="border-t border-gray-100 dark:border-harbor-800 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>⌘K Toggle</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
