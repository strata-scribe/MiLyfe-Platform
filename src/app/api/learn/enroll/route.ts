import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { path_id } = body;

  if (!path_id) {
    return NextResponse.json({ error: 'path_id required' }, { status: 400 });
  }

  // Check path exists
  const { data: path } = await supabase
    .from('learn_paths')
    .select('id, module_count')
    .eq('id', path_id)
    .eq('is_active', true)
    .single();

  if (!path) {
    return NextResponse.json({ error: 'Path not found' }, { status: 404 });
  }

  // Check not already enrolled
  const { data: existing } = await supabase
    .from('learn_enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('path_id', path_id)
    .single();

  if (existing && existing.status !== 'dropped') {
    return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
  }

  // Re-enroll if previously dropped, otherwise create new
  if (existing) {
    const { error } = await supabase
      .from('learn_enrollments')
      .update({ status: 'active', progress_percent: 0 })
      .eq('id', existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Get first module
    const { data: firstModule } = await supabase
      .from('learn_modules')
      .select('id')
      .eq('path_id', path_id)
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .single();

    const { error } = await supabase.from('learn_enrollments').insert({
      user_id: user.id,
      path_id,
      status: 'active',
      progress_percent: 0,
      current_module_id: firstModule?.id || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update enrolled count (non-critical)
    await supabase
      .from('learn_paths')
      .update({ enrolled_count: (path.module_count > 0 ? path.module_count : 0) + 1 })
      .eq('id', path_id)
      .then(() => {});
  }

  return NextResponse.json({ success: true });
}
