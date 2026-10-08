import { NextResponse } from 'next/server';

import {
  publicRequestOrigin,
  safeRedirectPath,
  sameOriginRedirect,
} from '@/lib/auth/safe-redirect-path';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicRequestOrigin(request);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));
  const supabaseError = searchParams.get('error');

  if (supabaseError) {
    const errorUrl = new URL('/auth/error', origin);
    errorUrl.searchParams.set('error', supabaseError);
    const description = searchParams.get('error_description');
    if (description) {
      errorUrl.searchParams.set('error_description', description);
    }
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(sameOriginRedirect(next, origin));
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
