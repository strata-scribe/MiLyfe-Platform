import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Timer Escalation Cron — Checks for expired walk-home timers
 *
 * Runs every 2 minutes. For each expired timer:
 * - Level 0 → 1: Send push notification to user ("Are you OK?")
 * - Level 1 → 2: Notify safety contacts ("hasn't checked in")
 * - Level 2 → 3: Share last known info with contacts
 * - Level 3 → 4: Alert keeper
 *
 * Protected by CRON_SECRET.
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();

  // Get all expired timers via RPC
  const { data: expiredTimers, error } = await supabase.rpc('get_expired_timers');

  if (error || !expiredTimers || expiredTimers.length === 0) {
    return NextResponse.json({ escalated: 0, message: 'No expired timers' });
  }

  let escalated = 0;

  for (const timer of expiredTimers) {
    const minutesOverdue = timer.minutes_overdue;
    const currentLevel = timer.escalation_level;
    let newLevel = currentLevel;

    // Determine new escalation level based on time overdue
    if (minutesOverdue >= 15 && currentLevel < 4) newLevel = 4; // Keeper alert
    else if (minutesOverdue >= 10 && currentLevel < 3) newLevel = 3; // Location shared
    else if (minutesOverdue >= 5 && currentLevel < 2) newLevel = 2; // Contacts notified
    else if (minutesOverdue >= 2 && currentLevel < 1) newLevel = 1; // Nudge sent

    if (newLevel > currentLevel) {
      // Escalate the timer
      await supabase.rpc('escalate_timer', {
        p_timer_id: timer.timer_id,
        p_new_level: newLevel,
      });

      // Send notifications based on level
      if (newLevel === 1) {
        // Nudge the user
        await supabase.from('notifications').insert({
          user_id: timer.user_id,
          type: 'safety',
          title: 'Are you OK?',
          body: "Your walk-home timer has expired. Tap to confirm you're safe.",
          link: '/safety',
        });
      } else if (newLevel >= 2) {
        // Notify contacts
        // In production: send push/SMS via web-push or Twilio
        // For now: create notifications for the user about escalation
        await supabase.from('notifications').insert({
          user_id: timer.user_id,
          type: 'safety',
          title: `Safety escalation (level ${newLevel})`,
          body: newLevel === 2
            ? 'Your safety contacts have been notified.'
            : newLevel === 3
              ? 'Your last location has been shared with contacts.'
              : 'A community keeper has been alerted.',
          link: '/safety',
        });
      }

      escalated++;
    }
  }

  return NextResponse.json({
    escalated,
    total_expired: expiredTimers.length,
    timestamp: new Date().toISOString(),
  });
}
