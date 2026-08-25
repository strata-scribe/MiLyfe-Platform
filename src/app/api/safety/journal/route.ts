import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { encrypted_content, content_type } = await request.json();

  if (!encrypted_content) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 });
  }

  const { error } = await supabase.from('safety_journal').insert({
    user_id: user.id,
    encrypted_content,
    content_type: content_type || 'note',
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

  if (!id) return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });

  const { data, error } = await supabase
    .from('safety_journal')
    .select('encrypted_content')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ encrypted_content: data.encrypted_content });
}
