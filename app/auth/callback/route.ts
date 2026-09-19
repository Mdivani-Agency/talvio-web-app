import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/account';
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const errorUrl = new URL('/auth/error', origin);
  errorUrl.searchParams.set('error', 'auth_callback_failed');
  errorUrl.searchParams.set(
    'error_description',
    'Could not complete sign-in. Try again.',
  );
  return NextResponse.redirect(errorUrl);
}
