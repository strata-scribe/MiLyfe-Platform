import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JournalView } from './journal-view';

export const metadata = { title: 'Safety Journal' };

export default async function JournalPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch encrypted entries (server can't read them — just stores ciphertext)
  const { data: entries } = await supabase
    .from('safety_journal')
    .select('id, content_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <JournalView userId={user.id} entries={entries || []} />;
}
