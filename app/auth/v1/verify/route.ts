import { NextResponse } from 'next/server';

import { supabaseVerifyUrl } from '@/lib/auth/verify-proxy';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ message: 'Auth is not configured' }, { status: 500 });
  }

  const incoming = new URL(request.url);
  const upstream = await fetch(supabaseVerifyUrl(supabaseUrl, incoming.search), {
    redirect: 'manual',
  });

  const headers = new Headers();
  const location = upstream.headers.get('location');
  if (location) headers.set('location', location);
  const setCookie = upstream.headers.get('set-cookie');
  if (setCookie) headers.set('set-cookie', setCookie);

  return new NextResponse(null, { status: upstream.status, headers });
}
