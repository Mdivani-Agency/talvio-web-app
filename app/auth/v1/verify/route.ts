import { NextResponse } from 'next/server';

import { supabaseVerifyUrl } from '@/lib/auth/verify-proxy';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ message: 'Auth is not configured' }, { status: 500 });
  }

  const incoming = new URL(request.url);
  return NextResponse.redirect(supabaseVerifyUrl(supabaseUrl, incoming.search));
}
