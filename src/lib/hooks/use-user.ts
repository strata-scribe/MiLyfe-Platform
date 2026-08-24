'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import type { Tables } from '@/types/database';

export function useUser() {
  const { user, setUser, setWallet, setStanding } = useAppStore();
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (user) return;

    const supabase = createClient();

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const [profileRes, walletRes, standingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('wallets').select('*').eq('user_id', authUser.id).single(),
        supabase.from('standing').select('*').eq('user_id', authUser.id).single(),
      ]);

      if (profileRes.data) setUser(profileRes.data as Tables<'profiles'>);
      if (walletRes.data) setWallet(walletRes.data as Tables<'wallets'>);
      if (standingRes.data) setStanding(standingRes.data as Tables<'standing'>);
      setLoading(false);
    }

    loadUser();
  }, [user, setUser, setWallet, setStanding]);

  return { user, loading };
}
