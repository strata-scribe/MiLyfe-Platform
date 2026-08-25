import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StreetView } from './street-view';

export const metadata = { title: 'Street' };

export default async function StreetPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [listingsRes, questsRes, resourcesRes, surplusRes] = await Promise.all([
    supabase
      .from('marketplace_listings')
      .select('*, profiles!seller_id(username, display_name, avatar_url)')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('quests')
      .select('*, profiles!creator_id(username, display_name, avatar_url)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('community_resources')
      .select('*')
      .in('status', ['active', 'stale'])
      .order('category'),
    supabase
      .from('surplus_items')
      .select('*, profiles!donor_id(username, display_name)')
      .eq('status', 'available')
      .gt('available_until', new Date().toISOString())
      .order('available_until')
      .limit(20),
  ]);

  return (
    <StreetView
      userId={user.id}
      listings={listingsRes.data || []}
      quests={questsRes.data || []}
      resources={resourcesRes.data || []}
      surplus={surplusRes.data || []}
    />
  );
}
