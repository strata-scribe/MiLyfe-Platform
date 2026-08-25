import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { contact_name, contact_phone, contact_user_id } = body;

  if (!contact_name?.trim()) {
    return NextResponse.json({ error: 'Contact name required' }, { status: 400 });
  }

  const { error } = await supabase.from('safety_contacts').insert({
    user_id: user.id,
    contact_name: contact_name.trim(),
    contact_phone: contact_phone || null,
    contact_user_id: contact_user_id || null,
    notify_on_leave_now: true,
    notify_on_timer_expire: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('id');

  if (!contactId) {
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('safety_contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
