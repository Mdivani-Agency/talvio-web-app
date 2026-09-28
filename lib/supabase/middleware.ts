import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { publicEntryRedirect } from '@/lib/public-entry';

function nextWithReturnPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-talvio-pathname', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.next({ request: { headers } });
}

function redirectKeepingSession(request: NextRequest, response: NextResponse, pathname: string, status: 307 | 308) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirect = NextResponse.redirect(url, status);
  for (const cookie of response.headers.getSetCookie()) {
    redirect.headers.append('set-cookie', cookie);
  }
  return redirect;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = nextWithReturnPath(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    const decision = publicEntryRedirect(request.nextUrl.pathname, false);
    if (!decision) {
      return supabaseResponse;
    }
    return redirectKeepingSession(request, supabaseResponse, decision.pathname, decision.status);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = nextWithReturnPath(request);
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = typeof data?.claims?.sub === 'string' && data.claims.sub.length > 0;
  const decision = publicEntryRedirect(request.nextUrl.pathname, signedIn);
  if (!decision) {
    return supabaseResponse;
  }

  return redirectKeepingSession(request, supabaseResponse, decision.pathname, decision.status);
}
