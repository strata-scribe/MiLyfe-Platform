import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ChatThread } from './chat-thread';
import type { Metadata } from 'next';

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', params.userId)
    .single();

  return {
    title: profile ? `Chat with ${profile.display_name}` : 'Chat',
  };
}

export default async function ChatPage({ params }: Props) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify the other user exists
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .eq('id', params.userId)
    .single();

  if (!otherProfile) notFound();

  // Verify connection exists
  const { data: connection } = await supabase
    .from('connections')
    .select('id')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${params.userId}),and(requester_id.eq.${params.userId},addressee_id.eq.${user.id})`
    )
    .eq('status', 'accepted')
    .single();

  if (!connection) {
    redirect('/connect');
  }

  // Load initial messages (last 50)
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(50);

  // Mark unread messages from the other user as read
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', params.userId)
    .eq('receiver_id', user.id)
    .eq('read', false);

  return (
    <ChatThread
      currentUserId={user.id}
      otherUser={otherProfile}
      initialMessages={messages || []}
    />
  );
}
