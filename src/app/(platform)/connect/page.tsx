import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConnectView } from './connect-view';

export const metadata = { title: 'Connect' };

export default async function ConnectPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get accepted connections with profiles
  const { data: connections } = await supabase
    .from('connections')
    .select('*, requester:profiles!connections_requester_id_fkey(*), addressee:profiles!connections_addressee_id_fkey(*)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false });

  // Get pending requests TO this user
  const { data: pendingRequests } = await supabase
    .from('connections')
    .select('*, requester:profiles!connections_requester_id_fkey(*)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Get recent messages for conversation list
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <ConnectView
      userId={user.id}
      connections={connections || []}
      pendingRequests={pendingRequests || []}
      recentMessages={recentMessages || []}
    />
  );
}
