import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MiChat } from '@/components/mi/mi-chat';

export const metadata = { title: 'Mi' };

export default async function MiPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <MiChat />
    </div>
  );
}
