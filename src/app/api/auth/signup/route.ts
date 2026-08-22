import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-side signup that auto-confirms users (bypasses email requirement)
export async function POST(request: Request) {
  const { email, password, display_name } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Use service role to create + auto-confirm user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create user with admin API (auto-confirmed)
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: display_name || email.split('@')[0] },
  });

  if (createError) {
    // If user already exists, just return error
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Sign them in immediately
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 400 });
  }

  return NextResponse.json({
    user: user.user,
    session: session.session,
    message: 'Account created successfully',
  });
}
