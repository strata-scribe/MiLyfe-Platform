import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Mi Chat History — Load previous conversation messages.
 */
export async function GET(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ messages: [] });
  }

  // Fetch last 50 messages for this conversation
  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, body, metadata, created_at')
    .eq('sender_id', user.id)
    .eq('receiver_id', user.id)
    .filter('metadata->>conversation_id', 'eq', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (!rawMessages || rawMessages.length === 0) {
    return NextResponse.json({ messages: [] });
  }

  // Format for the chat component
  const messages = rawMessages.map((msg) => ({
    id: msg.id,
    role: (msg.metadata as any)?.role || 'assistant',
    content: msg.body,
  }));

  return NextResponse.json({ messages });
}
