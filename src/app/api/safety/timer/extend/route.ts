import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get active timer
  const { data: timer } = await supabase
    .from('walk_home_timers')
    .select('id, expected_arrival')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!timer) {
    return NextResponse.json({ error: 'No active timer' }, { status: 404 });
  }

  // Extend by 15 minutes
  const newArrival = new Date(
    Math.max(new Date(timer.expected_arrival).getTime(), Date.now()) + 15 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from('walk_home_timers')
    .update({
      expected_arrival: newArrival,
      last_checkin_at: new Date().toISOString(),
      escalation_level: 0, // Reset escalation on extension
    })
    .eq('id', timer.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
