import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Standing Decay Cron
 *
 * Runs daily. Applies gradual decay to standing facets to ensure
 * standing reflects recent activity, not historical accumulation.
 *
 * Decay rate: 1% per day on all facets.
 * Minimum: facets never decay below 0.
 * Purpose: standing must be maintained through ongoing participation.
 */

const DAILY_DECAY_RATE = 0.01; // 1% per day
const MIN_DAYS_SINCE_DECAY = 1;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - MIN_DAYS_SINCE_DECAY * 24 * 60 * 60 * 1000).toISOString();

  // Get standings that haven't been decayed today
  const { data: standings, error: fetchError } = await supabase
    .from('standing')
    .select('id, user_id, neighbor, carer, maker, teacher, keeper, voice, shop, helper, last_decay_at')
    .lt('last_decay_at', oneDayAgo);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!standings || standings.length === 0) {
    return NextResponse.json({ decayed: 0, message: 'No standings due for decay' });
  }

  let decayed = 0;
  let errors = 0;

  for (const standing of standings) {
    try {
      // Calculate days since last decay
      const daysSinceDecay = Math.floor(
        (now.getTime() - new Date(standing.last_decay_at).getTime()) / (24 * 60 * 60 * 1000),
      );

      // Apply compound decay
      const decayFactor = Math.pow(1 - DAILY_DECAY_RATE, daysSinceDecay);

      const { error: updateError } = await supabase
        .from('standing')
        .update({
          neighbor: Math.max(0, Number((standing.neighbor * decayFactor).toFixed(2))),
          carer: Math.max(0, Number((standing.carer * decayFactor).toFixed(2))),
          maker: Math.max(0, Number((standing.maker * decayFactor).toFixed(2))),
          teacher: Math.max(0, Number((standing.teacher * decayFactor).toFixed(2))),
          keeper: Math.max(0, Number((standing.keeper * decayFactor).toFixed(2))),
          voice: Math.max(0, Number((standing.voice * decayFactor).toFixed(2))),
          shop: Math.max(0, Number((standing.shop * decayFactor).toFixed(2))),
          helper: Math.max(0, Number((standing.helper * decayFactor).toFixed(2))),
          last_decay_at: now.toISOString(),
        })
        .eq('id', standing.id);

      if (updateError) {
        errors++;
      } else {
        decayed++;
      }
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    decayed,
    errors,
    total_eligible: standings.length,
    decay_rate: `${DAILY_DECAY_RATE * 100}% per day`,
    timestamp: now.toISOString(),
  });
}
