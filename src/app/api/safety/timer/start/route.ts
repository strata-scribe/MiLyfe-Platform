import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { destination, minutes } = body;

  if (!minutes || minutes < 1 || minutes > 180) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
  }

  // Cancel any existing active timer
  await supabase
    .from('walk_home_timers')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'active');

  // Get safety contacts to alert
  const { data: contacts } = await supabase
    .from('safety_contacts')
    .select('contact_name, contact_user_id')
    .eq('user_id', user.id)
    .eq('notify_on_timer_expire', true);

  const alertContacts = (contacts || []).map((c) => c.contact_name);

  // Create new timer
  const expectedArrival = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('walk_home_timers')
    .insert({
      user_id: user.id,
      status: 'active',
      destination: destination || null,
      expected_arrival: expectedArrival,
      alert_contacts: alertContacts,
      escalation_level: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, timer_id: data.id });
}
