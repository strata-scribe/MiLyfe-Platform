'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const sendMessageSchema = z.object({
  receiver_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export async function sendMessage(input: SendMessageInput) {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (parsed.data.receiver_id === user.id) {
    return { error: 'Cannot message yourself' };
  }

  // Verify they are connected
  const { data: connection } = await supabase
    .from('connections')
    .select('id')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${parsed.data.receiver_id}),and(requester_id.eq.${parsed.data.receiver_id},addressee_id.eq.${user.id})`
    )
    .eq('status', 'accepted')
    .single();

  if (!connection) {
    return { error: 'You must be connected to message this person' };
  }

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: parsed.data.receiver_id,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };

  revalidatePath('/connect');
  return { success: true };
}

export async function markMessagesRead(otherUserId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', user.id)
    .eq('read', false);

  return { success: true };
}
