import { create } from 'zustand';
import type { Tables } from '@/types/database';

interface AppState {
  // User
  user: Tables<'profiles'> | null;
  wallet: Tables<'wallets'> | null;
  standing: Tables<'standing'> | null;

  // UI
  sidebarOpen: boolean;
  searchOpen: boolean;

  // Actions
  setUser: (user: Tables<'profiles'> | null) => void;
  setWallet: (wallet: Tables<'wallets'> | null) => void;
  setStanding: (standing: Tables<'standing'> | null) => void;
  toggleSidebar: () => void;
  toggleSearch: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  wallet: null,
  standing: null,
  sidebarOpen: false,
  searchOpen: false,

  setUser: (user) => set({ user }),
  setWallet: (wallet) => set({ wallet }),
  setStanding: (standing) => set({ standing }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
}));
