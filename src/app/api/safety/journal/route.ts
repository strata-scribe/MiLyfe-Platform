import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

const journalEntrySchema = z.object({
  encrypted_content: z.string().min(1, 'Content required').max(50000, 'Content too large'),
  content_type: z.enum(['note', 'incident', 'evidence', 'plan']).optional().default('note'),
});

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit
  const rl = await checkRateLimit(user.id, 'safety-journal', RATE_LIMITS.safety);
  if (!rl.success) return rl.error!;

  // Validate
  let input: z.infer<typeof journalEntrySchema>;
  try {
    const body = await request.json();
    input = journalEntrySchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { error } = await supabase.from('safety_journal').insert({
    user_id: user.id,
    encrypted_content: input.encrypted_content,
    content_type: input.content_type,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Valid entry ID required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('safety_journal')
    .select('encrypted_content')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ encrypted_content: data.encrypted_content });
}
