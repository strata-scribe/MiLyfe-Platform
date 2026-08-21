'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';

// v2 — fixed subscription cleanup
const AUTH_PROVIDER_VERSION = 2;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore();
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    // Load initial session
    const loadSession = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              mly_balance: profile.mly_balance,
              city: profile.city,
              joined_at: profile.created_at,
            });
          } else {
            setUser({
              id: authUser.id,
              email: authUser.email ?? '',
              display_name: authUser.user_metadata?.display_name ?? 'Neighbor',
              avatar_url: authUser.user_metadata?.avatar_url,
              mly_balance: 100,
              city: 'Jacksonville',
              joined_at: authUser.created_at,
            });
          }
        }
      } catch (e) {
        console.log('[MiLyfe] Auth check skipped — not logged in');
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                mly_balance: profile.mly_balance,
                city: profile.city,
                joined_at: profile.created_at,
              });
            }
          } catch {
            // Profile fetch failed, that's okay
          }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/login');
        }
      }
    );

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [setUser, router]);

  return <>{children}</>;
}
