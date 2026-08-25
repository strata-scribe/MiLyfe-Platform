'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ─── Enroll in Path ──────────────────────────────────────────────────────────
export async function enrollInPath(pathId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check not already enrolled
  const { data: existing } = await supabase
    .from('learn_enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('path_id', pathId)
    .single();

  if (existing && existing.status !== 'dropped') {
    return { error: 'Already enrolled in this path' };
  }

  // Get first module
  const { data: firstModule } = await supabase
    .from('learn_modules')
    .select('id')
    .eq('path_id', pathId)
    .eq('is_active', true)
    .order('sort_order')
    .limit(1)
    .single();

  if (existing) {
    // Re-enroll
    await supabase
      .from('learn_enrollments')
      .update({ status: 'active', progress_percent: 0, current_module_id: firstModule?.id })
      .eq('id', existing.id);
  } else {
    await supabase.from('learn_enrollments').insert({
      user_id: user.id,
      path_id: pathId,
      status: 'active',
      progress_percent: 0,
      current_module_id: firstModule?.id || null,
    });
  }

  revalidatePath('/learn');
  return { success: true };
}

// ─── Start Module ────────────────────────────────────────────────────────────
export async function startModule(moduleId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check if progress record exists
  const { data: existing } = await supabase
    .from('learn_progress')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single();

  if (existing && existing.status !== 'not_started') {
    return { error: 'Module already started' };
  }

  if (existing) {
    await supabase
      .from('learn_progress')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('learn_progress').insert({
      user_id: user.id,
      module_id: moduleId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
  }

  // Update enrollment current_module
  const { data: mod } = await supabase
    .from('learn_modules')
    .select('path_id')
    .eq('id', moduleId)
    .single();

  if (mod) {
    await supabase
      .from('learn_enrollments')
      .update({ current_module_id: moduleId })
      .eq('user_id', user.id)
      .eq('path_id', mod.path_id);
  }

  revalidatePath('/learn');
  return { success: true };
}

// ─── Complete Module ─────────────────────────────────────────────────────────
const completeModuleSchema = z.object({
  module_id: z.string().uuid(),
  time_spent_minutes: z.number().int().positive().max(480).default(1),
  notes: z.string().max(2000).optional(),
});

export async function completeModule(input: z.infer<typeof completeModuleSchema>) {
  const parsed = completeModuleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { module_id, time_spent_minutes, notes } = parsed.data;

  // Update progress
  await supabase
    .from('learn_progress')
    .upsert({
      user_id: user.id,
      module_id,
      status: 'completed',
      completed_at: new Date().toISOString(),
      time_spent_minutes,
      notes: notes || '',
    }, { onConflict: 'user_id,module_id' });

  // Recalculate enrollment progress
  const { data: mod } = await supabase
    .from('learn_modules')
    .select('path_id')
    .eq('id', module_id)
    .single();

  if (mod) {
    const { data: allModules } = await supabase
      .from('learn_modules')
      .select('id')
      .eq('path_id', mod.path_id)
      .eq('is_active', true);

    const { data: completedModules } = await supabase
      .from('learn_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .in('module_id', (allModules || []).map(m => m.id));

    const totalModules = allModules?.length || 1;
    const completed = completedModules?.length || 0;
    const percent = Math.round((completed / totalModules) * 100);

    const isComplete = percent >= 100;

    await supabase
      .from('learn_enrollments')
      .update({
        progress_percent: percent,
        status: isComplete ? 'completed' : 'active',
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('user_id', user.id)
      .eq('path_id', mod.path_id);

    // If path is complete, issue badge
    if (isComplete) {
      const { data: path } = await supabase
        .from('learn_paths')
        .select('title, completion_badge, icon')
        .eq('id', mod.path_id)
        .single();

      if (path) {
        await supabase.from('learn_badges').upsert({
          user_id: user.id,
          path_id: mod.path_id,
          badge_name: path.completion_badge,
          badge_description: `Completed the ${path.title} learning path`,
          badge_icon: path.icon,
          issued_by: 'system',
          portable: true,
        }, { onConflict: 'user_id,path_id' });

        // Standing boost (teacher facet if teaching, maker if repair, etc.)
        await supabase
          .from('standing')
          .update({ teacher: 5 }) // simplified — real implementation adds to current
          .eq('user_id', user.id);
      }
    }
  }

  revalidatePath('/learn');
  return { success: true, completed: true };
}

// ─── Submit Assessment ───────────────────────────────────────────────────────
const submitAssessmentSchema = z.object({
  module_id: z.string().uuid(),
  assessment_type: z.enum(['quiz', 'portfolio', 'reflection', 'project']),
  data: z.record(z.unknown()),
});

export async function submitAssessment(input: z.infer<typeof submitAssessmentSchema>) {
  const parsed = submitAssessmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  await supabase
    .from('learn_progress')
    .upsert({
      user_id: user.id,
      module_id: parsed.data.module_id,
      status: 'submitted',
      assessment_data: parsed.data.data,
    }, { onConflict: 'user_id,module_id' });

  revalidatePath('/learn');
  return { success: true };
}

// ─── Update Time Spent ───────────────────────────────────────────────────────
export async function updateTimeSpent(moduleId: string, additionalMinutes: number) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: progress } = await supabase
    .from('learn_progress')
    .select('time_spent_minutes')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single();

  if (progress) {
    await supabase
      .from('learn_progress')
      .update({ time_spent_minutes: progress.time_spent_minutes + additionalMinutes })
      .eq('user_id', user.id)
      .eq('module_id', moduleId);
  }

  return { success: true };
}
