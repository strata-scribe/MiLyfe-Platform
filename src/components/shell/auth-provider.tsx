'use client';

import { useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import type { Tables } from '@/types/database';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setWallet, setStanding } = useAppStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadUserData(userId: string) {
      const [profileRes, walletRes, standingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('*').eq('user_id', userId).single(),
        supabase.from('standing').select('*').eq('user_id', userId).single(),
      ]);

      if (profileRes.data) setUser(profileRes.data as Tables<'profiles'>);
      if (walletRes.data) setWallet(walletRes.data as Tables<'wallets'>);
      if (standingRes.data) setStanding(standingRes.data as Tables<'standing'>);
    }

    // Load initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUserData(user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setWallet(null);
          setStanding(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setWallet, setStanding]);

  return <>{children}</>;
}
