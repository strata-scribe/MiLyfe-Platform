'use client';

import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  mly_balance: number;
  city: string;
  joined_at: string;
  role?: string;
  neighborhood?: string;
}

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // Mi Assistant
  miOpen: boolean;
  toggleMi: () => void;
  setMiOpen: (open: boolean) => void;

  // Navigation
  activeApp: 'home' | 'city' | 'health' | 'shop' | 'connect' | 'vault';
  setActiveApp: (app: AppState['activeApp']) => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Mi Assistant
  miOpen: false,
  toggleMi: () => set((state) => ({ miOpen: !state.miOpen })),
  setMiOpen: (open) => set({ miOpen: open }),

  // Navigation
  activeApp: 'home',
  setActiveApp: (app) => set({ activeApp: app }),

  // Theme
  darkMode: false,
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newMode);
    }
    return { darkMode: newMode };
  }),

  // Notifications
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
